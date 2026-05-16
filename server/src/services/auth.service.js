import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { User } from '../models/User.model.js'
import { env } from '../config/env.js'

function signAccessToken(userId) {
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
  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters')
    err.status = 400
    throw err
  }
  if (!/[0-9!@#$%^&*]/.test(password)) {
    const err = new Error('Password must contain at least one number or special character (!@#$%^&*)')
    err.status = 400
    throw err
  }
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
