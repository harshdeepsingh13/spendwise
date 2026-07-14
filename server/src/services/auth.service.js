import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { User } from '../models/User.model.js'
import { env } from '../config/env.js'
import { sendMail } from '../utils/mailer.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Enforces the app's password policy (min length + at least one number/special char).
 * @param {string} password - Candidate password.
 * @throws {Error} 400 when the password is too weak.
 */
function assertStrongPassword(password) {
  if (!password || password.length < 8) {
    const err = new Error('Password must be at least 8 characters')
    err.status = 400
    throw err
  }
  if (!/[0-9!@#$%^&*]/.test(password)) {
    const err = new Error('Password must contain at least one number or special character (!@#$%^&*)')
    err.status = 400
    throw err
  }
}

/**
 * Hashes a reset token for at-rest storage so a DB leak can't be used to reset passwords.
 * @param {string} token - Raw token from the reset link.
 * @returns {string} SHA-256 hex digest.
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE })
}

function signRefreshToken(userId) {
  return jwt.sign(
    { sub: userId.toString(), type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRE }
  )
}

function generateTokenPair(userId) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  }
}

export function signMfaChallengeToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'mfa_challenge' }, env.JWT_SECRET, { expiresIn: '5m' })
}

export async function createUser({ email, password, displayName }) {
  if (!email || !password) {
    const err = new Error('Email and password required')
    err.status = 400
    throw err
  }
  assertStrongPassword(password)
  const existing = await User.findOne({ email })
  if (existing) {
    const err = new Error(
      existing.googleId
        ? 'This email is registered via Google. Please sign in with Google.'
        : 'Email already registered'
    )
    err.status = 409
    throw err
  }
  const user = new User({ email, password, displayName: displayName || email.split('@')[0] })
  const { accessToken, refreshToken } = generateTokenPair(user._id)
  user.refreshToken = refreshToken
  await user.save()
  return {
    token: accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, displayName: user.displayName },
  }
}

export async function authenticateUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password required')
    err.status = 400
    throw err
  }
  const user = await User.findOne({ email }).select('+mfaEnabled +mfaSecret')
  if (!user) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }
  if (!user.password) {
    const err = new Error(
      user.googleId
        ? 'This account uses Google sign-in. Please sign in with Google.'
        : 'This account does not have password login enabled'
    )
    err.status = 401
    throw err
  }
  const valid = await user.comparePassword(password)
  if (!valid) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }
  if (user.mfaEnabled) {
    return { requiresMfa: true, mfaChallengeToken: signMfaChallengeToken(user._id) }
  }
  const { accessToken, refreshToken } = generateTokenPair(user._id)
  user.refreshToken = refreshToken
  await user.save()
  return {
    token: accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, displayName: user.displayName },
  }
}

export async function generateSessionForUser(user) {
  const { accessToken, refreshToken } = generateTokenPair(user._id)
  await User.findByIdAndUpdate(user._id, { refreshToken })
  return { accessToken, refreshToken }
}

export async function refreshAccessToken(refreshToken) {
  let payload
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET)
  } catch {
    const err = new Error('Invalid or expired refresh token')
    err.status = 401
    throw err
  }
  if (payload.type !== 'refresh') {
    const err = new Error('Invalid token type')
    err.status = 401
    throw err
  }
  const user = await User.findById(payload.sub).select('+refreshToken')
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error('Refresh token revoked')
    err.status = 401
    throw err
  }
  return { token: signAccessToken(user._id) }
}

export async function logoutUser(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null })
}

/**
 * Starts a password reset: generates a one-time token, stores its hash + expiry on the
 * user, and emails the reset link. Always resolves without revealing whether the email
 * exists (no user enumeration). OAuth-only accounts (no password) are skipped silently.
 *
 * @param {string} email - Email that requested the reset.
 * @returns {Promise<void>}
 */
export async function requestPasswordReset(email) {
  if (!email) return
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || !user.password) return

  const token = crypto.randomBytes(32).toString('hex')
  user.resetToken = hashResetToken(token)
  user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`
  await sendMail({
    to: user.email,
    subject: 'Reset your Spendwise password',
    text: `Reset your password using this link (valid for 1 hour): ${resetUrl}`,
    html: `<p>We received a request to reset your Spendwise password.</p>
<p><a href="${resetUrl}">Click here to choose a new password</a>. This link is valid for 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
  })
}

/**
 * Completes a password reset: validates the token + new password, sets the new password,
 * and invalidates the reset token and any existing session.
 *
 * @param {string} token - Raw token from the reset link.
 * @param {string} newPassword - New password (must satisfy the password policy).
 * @returns {Promise<void>}
 * @throws {Error} 400 for a missing/invalid/expired token or a weak password.
 */
export async function resetPassword(token, newPassword) {
  if (!token) {
    const err = new Error('Invalid or expired reset link')
    err.status = 400
    throw err
  }
  assertStrongPassword(newPassword)

  const user = await User.findOne({
    resetToken: hashResetToken(token),
    resetTokenExpiry: { $gt: new Date() },
  }).select('+resetToken +resetTokenExpiry')

  if (!user) {
    const err = new Error('Invalid or expired reset link')
    err.status = 400
    throw err
  }

  user.password = newPassword
  user.resetToken = undefined
  user.resetTokenExpiry = undefined
  user.refreshToken = undefined
  await user.save()
}

export async function generateMfaSetup(userId) {
  const secret = speakeasy.generateSecret({ name: 'ExpenseTracker', length: 20 })
  await User.findByIdAndUpdate(userId, { mfaTempSecret: secret.base32 })
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url)
  return { qrCodeDataUrl, base32: secret.base32 }
}

export async function verifyAndEnableMfa(userId, totpCode) {
  const user = await User.findById(userId).select('+mfaTempSecret')
  if (!user?.mfaTempSecret) {
    const err = new Error('MFA setup not initiated')
    err.status = 400
    throw err
  }
  const valid = speakeasy.totp.verify({
    secret: user.mfaTempSecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  })
  if (!valid) {
    const err = new Error('Invalid authentication code')
    err.status = 400
    throw err
  }
  user.mfaSecret = user.mfaTempSecret
  user.mfaTempSecret = undefined
  user.mfaEnabled = true
  await user.save()
}

export async function validateMfaLogin(mfaChallengeToken, totpCode) {
  let payload
  try {
    payload = jwt.verify(mfaChallengeToken, env.JWT_SECRET)
  } catch {
    const err = new Error('Invalid or expired challenge token')
    err.status = 401
    throw err
  }
  if (payload.type !== 'mfa_challenge') {
    const err = new Error('Invalid token type')
    err.status = 401
    throw err
  }
  const user = await User.findById(payload.sub).select('+mfaSecret')
  if (!user?.mfaSecret) {
    const err = new Error('MFA not configured')
    err.status = 400
    throw err
  }
  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  })
  if (!valid) {
    const err = new Error('Invalid authentication code')
    err.status = 401
    throw err
  }
  const { accessToken, refreshToken } = generateTokenPair(user._id)
  user.refreshToken = refreshToken
  await user.save()
  return {
    token: accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, displayName: user.displayName },
  }
}

export async function disableMfa(userId, totpCode) {
  const user = await User.findById(userId).select('+mfaSecret')
  if (!user?.mfaEnabled || !user?.mfaSecret) {
    const err = new Error('MFA is not enabled')
    err.status = 400
    throw err
  }
  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  })
  if (!valid) {
    const err = new Error('Invalid authentication code')
    err.status = 400
    throw err
  }
  user.mfaEnabled = false
  user.mfaSecret = undefined
  user.mfaTempSecret = undefined
  await user.save()
}
