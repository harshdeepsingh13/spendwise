import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRE: '7d',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRE: '30d',
    CLIENT_URL: 'http://localhost:5173',
  },
}))

vi.mock('../utils/mailer.js', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../models/User.model.js', () => {
  const User = vi.fn()
  User.findOne = vi.fn()
  User.findById = vi.fn()
  User.findByIdAndUpdate = vi.fn()
  return { User }
})

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload) => {
      if (payload.type === 'refresh') return 'mock-refresh-token'
      if (payload.type === 'mfa_challenge') return 'mock-mfa-challenge'
      return 'mock-access-token'
    }),
    verify: vi.fn(),
  },
}))

vi.mock('speakeasy', () => ({
  default: {
    generateSecret: vi.fn(() => ({ base32: 'BASE32SECRET', otpauth_url: 'otpauth://totp/test' })),
    totp: { verify: vi.fn() },
  },
}))

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,QRCODE') },
}))

import {
  signAccessToken,
  signMfaChallengeToken,
  createUser,
  authenticateUser,
  generateSessionForUser,
  refreshAccessToken,
  logoutUser,
  generateMfaSetup,
  verifyAndEnableMfa,
  validateMfaLogin,
  disableMfa,
  requestPasswordReset,
  resetPassword,
} from './auth.service.js'
import { User } from '../models/User.model.js'
import { sendMail } from '../utils/mailer.js'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

/**
 * Builds a Mongoose-query-like value that is both awaitable and supports the
 * chained `.select()` the service uses on findOne/findById.
 * @param {*} value - Document (or null) the query resolves to.
 * @returns {Promise<*> & { select: Function }} Query-like resolved value.
 */
function makeQuery(value) {
  const query = Promise.resolve(value)
  query.select = vi.fn(() => Promise.resolve(value))
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signAccessToken', () => {
  it('signs an access token with the stringified user id', () => {
    const token = signAccessToken('user1')
    expect(token).toBe('mock-access-token')
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user1' }, 'test-secret', { expiresIn: '7d' })
  })

  it('stringifies non-string ids', () => {
    signAccessToken({ toString: () => 'objid' })
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'objid' }, 'test-secret', { expiresIn: '7d' })
  })
})

describe('signMfaChallengeToken', () => {
  it('signs a short-lived mfa_challenge token', () => {
    const token = signMfaChallengeToken('user1')
    expect(token).toBe('mock-mfa-challenge')
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'user1', type: 'mfa_challenge' },
      'test-secret',
      { expiresIn: '5m' }
    )
  })
})

describe('createUser', () => {
  let saved
  beforeEach(() => {
    saved = null
    User.mockImplementation(function (data) {
      Object.assign(this, data)
      this._id = 'new-user-id'
      this.save = vi.fn().mockImplementation(() => {
        saved = this
        return Promise.resolve()
      })
    })
    User.findOne.mockResolvedValue(null)
  })

  it('throws 400 when email is missing', async () => {
    const err = await createUser({ password: 'password1' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 400 when password is missing', async () => {
    const err = await createUser({ email: 'test@example.com' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 400 when password is shorter than 8 characters', async () => {
    const err = await createUser({ email: 'test@example.com', password: 'short1' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/at least 8 characters/i)
  })

  it('throws 400 when password lacks a number or special character', async () => {
    const err = await createUser({ email: 'test@example.com', password: 'onlyletters' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/number or special character/i)
  })

  it('throws 409 when email already registered (local account)', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', googleId: null })
    const err = await createUser({ email: 'test@example.com', password: 'password1' }).catch((e) => e)
    expect(err.status).toBe(409)
    expect(err.message).toBe('Email already registered')
  })

  it('throws 409 with Google-specific message when email registered via Google', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', googleId: 'google123' })
    const err = await createUser({ email: 'test@example.com', password: 'password1' }).catch((e) => e)
    expect(err.status).toBe(409)
    expect(err.message).toMatch(/Google/i)
  })

  it('returns token, refreshToken and user on successful creation', async () => {
    const result = await createUser({ email: 'new@example.com', password: 'password1', displayName: 'New User' })
    expect(result.token).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
    expect(result.user).toMatchObject({ id: 'new-user-id', email: 'new@example.com', displayName: 'New User' })
  })

  it('persists the refresh token on the new user document', async () => {
    await createUser({ email: 'new@example.com', password: 'password1' })
    expect(saved.refreshToken).toBe('mock-refresh-token')
    expect(saved.save).toHaveBeenCalledOnce()
  })

  it('defaults displayName to email prefix when not provided', async () => {
    const result = await createUser({ email: 'john@example.com', password: 'password1' })
    expect(result.user.displayName).toBe('john')
  })

  it('signs both access and refresh tokens', async () => {
    await createUser({ email: 'new@example.com', password: 'password1' })
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'new-user-id' }, 'test-secret', { expiresIn: '7d' })
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'new-user-id', type: 'refresh' },
      'test-refresh-secret',
      { expiresIn: '30d' }
    )
  })
})

describe('authenticateUser', () => {
  const activeUser = (overrides = {}) => ({
    _id: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    password: 'hashed',
    googleId: null,
    mfaEnabled: false,
    comparePassword: vi.fn().mockResolvedValue(true),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  })

  it('throws 400 when email is missing', async () => {
    const err = await authenticateUser({ password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(400)
  })

  it('throws 400 when password is missing', async () => {
    const err = await authenticateUser({ email: 'test@example.com' }).catch((e) => e)
    expect(err.status).toBe(400)
  })

  it('throws 401 when user is not found', async () => {
    User.findOne.mockReturnValue(makeQuery(null))
    const err = await authenticateUser({ email: 'ghost@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid email or password')
  })

  it('throws 401 with Google message when account uses Google sign-in', async () => {
    User.findOne.mockReturnValue(makeQuery({ password: null, googleId: 'google123' }))
    const err = await authenticateUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/Google sign-in/i)
  })

  it('throws 401 when account has no password and is not a Google account', async () => {
    User.findOne.mockReturnValue(makeQuery({ password: null, googleId: null }))
    const err = await authenticateUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/password login/i)
  })

  it('throws 401 when password is incorrect', async () => {
    User.findOne.mockReturnValue(makeQuery(activeUser({ comparePassword: vi.fn().mockResolvedValue(false) })))
    const err = await authenticateUser({ email: 'test@example.com', password: 'wrong' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid email or password')
  })

  it('returns an MFA challenge when MFA is enabled', async () => {
    User.findOne.mockReturnValue(makeQuery(activeUser({ mfaEnabled: true })))
    const result = await authenticateUser({ email: 'test@example.com', password: 'correct' })
    expect(result).toEqual({ requiresMfa: true, mfaChallengeToken: 'mock-mfa-challenge' })
  })

  it('returns token, refreshToken and user on successful authentication', async () => {
    const user = activeUser()
    User.findOne.mockReturnValue(makeQuery(user))
    const result = await authenticateUser({ email: 'test@example.com', password: 'correct' })
    expect(result.token).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
    expect(result.user).toMatchObject({ id: 'user123', email: 'test@example.com', displayName: 'Test User' })
    expect(user.refreshToken).toBe('mock-refresh-token')
    expect(user.save).toHaveBeenCalledOnce()
  })
})

describe('generateSessionForUser', () => {
  it('signs a token pair and stores the refresh token', async () => {
    User.findByIdAndUpdate.mockResolvedValue(undefined)
    const result = await generateSessionForUser({ _id: 'user789' })
    expect(result).toEqual({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' })
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user789', { refreshToken: 'mock-refresh-token' })
  })
})

describe('refreshAccessToken', () => {
  it('throws 401 when the refresh token cannot be verified', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token')
    })
    const err = await refreshAccessToken('bad').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/invalid or expired refresh token/i)
  })

  it('throws 401 when the token type is not refresh', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'access' })
    const err = await refreshAccessToken('token').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/invalid token type/i)
  })

  it('throws 401 when the stored refresh token does not match', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'refresh' })
    User.findById.mockReturnValue(makeQuery({ _id: 'user1', refreshToken: 'different-token' }))
    const err = await refreshAccessToken('token').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/revoked/i)
  })

  it('throws 401 when the user is not found', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'refresh' })
    User.findById.mockReturnValue(makeQuery(null))
    const err = await refreshAccessToken('token').catch((e) => e)
    expect(err.status).toBe(401)
  })

  it('returns a fresh access token when the refresh token is valid', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'refresh' })
    User.findById.mockReturnValue(makeQuery({ _id: 'user1', refreshToken: 'token' }))
    const result = await refreshAccessToken('token')
    expect(result).toEqual({ token: 'mock-access-token' })
  })
})

describe('logoutUser', () => {
  it('clears the stored refresh token', async () => {
    User.findByIdAndUpdate.mockResolvedValue(undefined)
    await logoutUser('user1')
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user1', { refreshToken: null })
  })
})

describe('generateMfaSetup', () => {
  it('stores a temp secret and returns a QR code data url', async () => {
    User.findByIdAndUpdate.mockResolvedValue(undefined)
    const result = await generateMfaSetup('user1')
    expect(speakeasy.generateSecret).toHaveBeenCalledWith({ name: 'ExpenseTracker', length: 20 })
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user1', { mfaTempSecret: 'BASE32SECRET' })
    expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/test')
    expect(result).toEqual({ qrCodeDataUrl: 'data:image/png;base64,QRCODE', base32: 'BASE32SECRET' })
  })
})

describe('verifyAndEnableMfa', () => {
  it('throws 400 when MFA setup was not initiated', async () => {
    User.findById.mockReturnValue(makeQuery({ mfaTempSecret: null }))
    const err = await verifyAndEnableMfa('user1', '123456').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/not initiated/i)
  })

  it('throws 400 when the TOTP code is invalid', async () => {
    User.findById.mockReturnValue(makeQuery({ mfaTempSecret: 'SECRET', save: vi.fn() }))
    speakeasy.totp.verify.mockReturnValue(false)
    const err = await verifyAndEnableMfa('user1', '000000').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/invalid authentication code/i)
  })

  it('enables MFA and clears the temp secret on a valid code', async () => {
    const user = { mfaTempSecret: 'SECRET', save: vi.fn().mockResolvedValue(undefined) }
    User.findById.mockReturnValue(makeQuery(user))
    speakeasy.totp.verify.mockReturnValue(true)
    await verifyAndEnableMfa('user1', '123456')
    expect(user.mfaSecret).toBe('SECRET')
    expect(user.mfaTempSecret).toBeUndefined()
    expect(user.mfaEnabled).toBe(true)
    expect(user.save).toHaveBeenCalledOnce()
  })
})

describe('validateMfaLogin', () => {
  it('throws 401 when the challenge token cannot be verified', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token')
    })
    const err = await validateMfaLogin('bad', '123456').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/invalid or expired challenge token/i)
  })

  it('throws 401 when the token type is not mfa_challenge', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'refresh' })
    const err = await validateMfaLogin('token', '123456').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/invalid token type/i)
  })

  it('throws 400 when MFA is not configured for the user', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'mfa_challenge' })
    User.findById.mockReturnValue(makeQuery({ _id: 'user1', mfaSecret: null }))
    const err = await validateMfaLogin('token', '123456').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/not configured/i)
  })

  it('throws 401 when the TOTP code is invalid', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'mfa_challenge' })
    User.findById.mockReturnValue(makeQuery({ _id: 'user1', mfaSecret: 'SECRET', save: vi.fn() }))
    speakeasy.totp.verify.mockReturnValue(false)
    const err = await validateMfaLogin('token', '000000').catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/invalid authentication code/i)
  })

  it('returns a session on a valid TOTP code', async () => {
    jwt.verify.mockReturnValue({ sub: 'user1', type: 'mfa_challenge' })
    const user = {
      _id: 'user1',
      email: 'test@example.com',
      displayName: 'Test User',
      mfaSecret: 'SECRET',
      save: vi.fn().mockResolvedValue(undefined),
    }
    User.findById.mockReturnValue(makeQuery(user))
    speakeasy.totp.verify.mockReturnValue(true)
    const result = await validateMfaLogin('token', '123456')
    expect(result.token).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
    expect(result.user).toMatchObject({ id: 'user1', email: 'test@example.com', displayName: 'Test User' })
    expect(user.refreshToken).toBe('mock-refresh-token')
    expect(user.save).toHaveBeenCalledOnce()
  })
})

describe('disableMfa', () => {
  it('throws 400 when MFA is not enabled', async () => {
    User.findById.mockReturnValue(makeQuery({ mfaEnabled: false, mfaSecret: null }))
    const err = await disableMfa('user1', '123456').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/not enabled/i)
  })

  it('throws 400 when the TOTP code is invalid', async () => {
    User.findById.mockReturnValue(makeQuery({ mfaEnabled: true, mfaSecret: 'SECRET', save: vi.fn() }))
    speakeasy.totp.verify.mockReturnValue(false)
    const err = await disableMfa('user1', '000000').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/invalid authentication code/i)
  })

  it('disables MFA and clears secrets on a valid code', async () => {
    const user = {
      mfaEnabled: true,
      mfaSecret: 'SECRET',
      save: vi.fn().mockResolvedValue(undefined),
    }
    User.findById.mockReturnValue(makeQuery(user))
    speakeasy.totp.verify.mockReturnValue(true)
    await disableMfa('user1', '123456')
    expect(user.mfaEnabled).toBe(false)
    expect(user.mfaSecret).toBeUndefined()
    expect(user.mfaTempSecret).toBeUndefined()
    expect(user.save).toHaveBeenCalledOnce()
  })
})

describe('requestPasswordReset', () => {
  it('does nothing when no email is provided', async () => {
    await requestPasswordReset('')
    expect(User.findOne).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('silently returns without emailing when the email is unknown (no enumeration)', async () => {
    User.findOne.mockResolvedValue(null)
    await requestPasswordReset('ghost@example.com')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('skips OAuth-only accounts (no password) without emailing', async () => {
    User.findOne.mockResolvedValue({ email: 'g@example.com', password: null, save: vi.fn() })
    await requestPasswordReset('g@example.com')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('stores a hashed token + expiry and emails a reset link for a local account', async () => {
    const user = { email: 'user@example.com', password: 'hashed', save: vi.fn().mockResolvedValue(undefined) }
    User.findOne.mockResolvedValue(user)

    await requestPasswordReset('user@example.com')

    expect(user.resetToken).toEqual(expect.any(String))
    expect(user.resetTokenExpiry.getTime()).toBeGreaterThan(Date.now())
    expect(user.save).toHaveBeenCalledOnce()
    expect(sendMail).toHaveBeenCalledOnce()
    const mail = sendMail.mock.calls[0][0]
    expect(mail.to).toBe('user@example.com')
    expect(mail.html).toContain('http://localhost:5173/reset-password?token=')
    // The emailed token is the raw token, never the stored hash
    expect(mail.html).not.toContain(user.resetToken)
  })
})

describe('resetPassword', () => {
  it('throws 400 when no token is provided', async () => {
    const err = await resetPassword('', 'newpass123').catch((e) => e)
    expect(err.status).toBe(400)
  })

  it('throws 400 when the new password is too weak', async () => {
    const err = await resetPassword('sometoken', 'short').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/at least 8 characters/i)
  })

  it('throws 400 when the token is invalid or expired', async () => {
    User.findOne.mockReturnValue(makeQuery(null))
    const err = await resetPassword('badtoken', 'newpass123').catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/invalid or expired/i)
  })

  it('sets the new password and clears the token + session on success', async () => {
    const user = {
      password: 'old',
      resetToken: 'hash',
      resetTokenExpiry: new Date(Date.now() + 1000),
      refreshToken: 'rt',
      save: vi.fn().mockResolvedValue(undefined),
    }
    User.findOne.mockReturnValue(makeQuery(user))

    await resetPassword('validtoken', 'newpass123')

    expect(user.password).toBe('newpass123')
    expect(user.resetToken).toBeUndefined()
    expect(user.resetTokenExpiry).toBeUndefined()
    expect(user.refreshToken).toBeUndefined()
    expect(user.save).toHaveBeenCalledOnce()
  })
})
