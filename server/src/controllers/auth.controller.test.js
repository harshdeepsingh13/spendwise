import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: { CLIENT_URL: 'http://localhost:5173', NODE_ENV: 'test' },
}))

vi.mock('../services/auth.service.js')

import * as authService from '../services/auth.service.js'
import {
  signup,
  login,
  handleOAuthCallback,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  refresh,
  setupMfa,
  verifyMfaSetup,
  validateMfaLogin,
  disableMfaHandler,
} from './auth.controller.js'

describe('auth.controller', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, user: null, cookies: {} }
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    }
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('signup', () => {
    it('sets the refresh cookie and returns 201 with token + user', async () => {
      const mockResult = { token: 'abc', refreshToken: 'refresh-abc', user: { id: '1', email: 'a@b.com' } }
      authService.createUser.mockResolvedValue(mockResult)
      req.body = { email: 'a@b.com', password: 'pass1234' }

      await signup(req, res, next)

      expect(authService.createUser).toHaveBeenCalledWith(req.body)
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-abc', expect.any(Object))
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ token: 'abc', user: mockResult.user })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on service failure', async () => {
      const err = Object.assign(new Error('Email already registered'), { status: 409 })
      authService.createUser.mockRejectedValue(err)
      req.body = { email: 'a@b.com', password: 'pass1234' }

      await signup(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('sets the refresh cookie and returns token + user on success', async () => {
      const mockResult = { token: 'tok123', refreshToken: 'refresh-123', user: { id: '1', email: 'a@b.com' } }
      authService.authenticateUser.mockResolvedValue(mockResult)
      req.body = { email: 'a@b.com', password: 'pass1234' }

      await login(req, res, next)

      expect(authService.authenticateUser).toHaveBeenCalledWith(req.body)
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-123', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith({ token: 'tok123', user: mockResult.user })
      expect(next).not.toHaveBeenCalled()
    })

    it('returns an MFA challenge (no cookie) when MFA is required', async () => {
      authService.authenticateUser.mockResolvedValue({ requiresMfa: true, mfaChallengeToken: 'challenge-xyz' })
      req.body = { email: 'a@b.com', password: 'pass1234' }

      await login(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ requiresMfa: true, mfaChallengeToken: 'challenge-xyz' })
      expect(res.cookie).not.toHaveBeenCalled()
    })

    it('calls next with error on invalid credentials', async () => {
      const err = Object.assign(new Error('Invalid email or password'), { status: 401 })
      authService.authenticateUser.mockRejectedValue(err)

      await login(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('handleOAuthCallback', () => {
    it('redirects to the login error page when req.user is missing', async () => {
      req.user = null

      await handleOAuthCallback(req, res)

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=oauth_failed')
    })

    it('redirects with an MFA challenge token when the user has MFA enabled', async () => {
      req.user = { _id: 'user123', email: 'a@b.com', mfaEnabled: true }
      authService.signMfaChallengeToken.mockReturnValue('challenge-jwt')

      await handleOAuthCallback(req, res)

      expect(authService.signMfaChallengeToken).toHaveBeenCalledWith('user123')
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback?mfaChallengeToken=challenge-jwt'
      )
    })

    it('sets the refresh cookie and redirects with an access token on success', async () => {
      req.user = { _id: 'user123', email: 'a@b.com', mfaEnabled: false }
      authService.generateSessionForUser.mockResolvedValue({ accessToken: 'access-jwt', refreshToken: 'refresh-jwt' })

      await handleOAuthCallback(req, res)

      expect(authService.generateSessionForUser).toHaveBeenCalledWith(req.user)
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-jwt', expect.any(Object))
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback?token=access-jwt')
    })
  })

  describe('getMe', () => {
    it('returns the authenticated user from req.user', async () => {
      req.user = { _id: 'user123', email: 'a@b.com', displayName: 'Alice' }

      await getMe(req, res)

      expect(res.json).toHaveBeenCalledWith(req.user)
    })
  })

  describe('logout', () => {
    it('clears the refresh cookie and returns a success message', async () => {
      req.user = { _id: 'user123' }
      authService.logoutUser.mockResolvedValue(undefined)

      await logout(req, res, next)

      expect(authService.logoutUser).toHaveBeenCalledWith('user123')
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken')
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error when the service fails', async () => {
      req.user = { _id: 'user123' }
      const err = new Error('db down')
      authService.logoutUser.mockRejectedValue(err)

      await logout(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('forgotPassword', () => {
    it('returns a generic message without revealing account existence', async () => {
      authService.requestPasswordReset.mockResolvedValue(undefined)
      req.body = { email: 'a@b.com' }

      await forgotPassword(req, res, next)

      expect(authService.requestPasswordReset).toHaveBeenCalledWith('a@b.com')
      expect(res.json).toHaveBeenCalledWith({
        message: 'If an account exists for that email, a reset link has been sent.',
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on service failure', async () => {
      const err = new Error('mailer down')
      authService.requestPasswordReset.mockRejectedValue(err)
      req.body = { email: 'a@b.com' }

      await forgotPassword(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('resets the password with the token and new password', async () => {
      authService.resetPassword.mockResolvedValue(undefined)
      req.body = { token: 'reset-tok', password: 'newpass1234' }

      await resetPassword(req, res, next)

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-tok', 'newpass1234')
      expect(res.json).toHaveBeenCalledWith({ message: 'Password has been reset. You can now sign in.' })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on an invalid or expired token', async () => {
      const err = Object.assign(new Error('Invalid or expired token'), { status: 400 })
      authService.resetPassword.mockRejectedValue(err)
      req.body = { token: 'bad', password: 'newpass1234' }

      await resetPassword(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('returns a new session from the refresh cookie', async () => {
      req.cookies = { refreshToken: 'refresh-tok' }
      const result = { token: 'new-access', user: { id: '1' } }
      authService.refreshAccessToken.mockResolvedValue(result)

      await refresh(req, res, next)

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('refresh-tok')
      expect(res.json).toHaveBeenCalledWith(result)
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with a 401 error when no refresh cookie is present', async () => {
      req.cookies = {}

      await refresh(req, res, next)

      expect(authService.refreshAccessToken).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      const err = next.mock.calls[0][0]
      expect(err).toBeInstanceOf(Error)
      expect(err.status).toBe(401)
      expect(res.json).not.toHaveBeenCalled()
    })

    it('calls next with error when the refresh token is invalid', async () => {
      req.cookies = { refreshToken: 'stale' }
      const err = Object.assign(new Error('Invalid refresh token'), { status: 401 })
      authService.refreshAccessToken.mockRejectedValue(err)

      await refresh(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('setupMfa', () => {
    it('returns the generated MFA setup for the user', async () => {
      req.user = { _id: 'user123' }
      const setup = { secret: 'SECRET', qrCode: 'data:image/png;base64,...' }
      authService.generateMfaSetup.mockResolvedValue(setup)

      await setupMfa(req, res, next)

      expect(authService.generateMfaSetup).toHaveBeenCalledWith('user123')
      expect(res.json).toHaveBeenCalledWith(setup)
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on service failure', async () => {
      req.user = { _id: 'user123' }
      const err = new Error('cannot generate')
      authService.generateMfaSetup.mockRejectedValue(err)

      await setupMfa(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('verifyMfaSetup', () => {
    it('enables MFA using the provided token and returns a success message', async () => {
      req.user = { _id: 'user123' }
      req.body = { token: '123456' }
      authService.verifyAndEnableMfa.mockResolvedValue(undefined)

      await verifyMfaSetup(req, res, next)

      expect(authService.verifyAndEnableMfa).toHaveBeenCalledWith('user123', '123456')
      expect(res.json).toHaveBeenCalledWith({ message: 'MFA enabled successfully' })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on an invalid token', async () => {
      req.user = { _id: 'user123' }
      req.body = { token: '000000' }
      const err = Object.assign(new Error('Invalid MFA token'), { status: 400 })
      authService.verifyAndEnableMfa.mockRejectedValue(err)

      await verifyMfaSetup(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('validateMfaLogin', () => {
    it('sets the refresh cookie and returns token + user on a valid TOTP code', async () => {
      req.body = { mfaChallengeToken: 'challenge-jwt', totpCode: '123456' }
      const result = { token: 'access', refreshToken: 'refresh', user: { id: '1' } }
      authService.validateMfaLogin.mockResolvedValue(result)

      await validateMfaLogin(req, res, next)

      expect(authService.validateMfaLogin).toHaveBeenCalledWith('challenge-jwt', '123456')
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith({ token: 'access', user: result.user })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on an invalid TOTP code', async () => {
      req.body = { mfaChallengeToken: 'challenge-jwt', totpCode: '000000' }
      const err = Object.assign(new Error('Invalid MFA code'), { status: 401 })
      authService.validateMfaLogin.mockRejectedValue(err)

      await validateMfaLogin(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.cookie).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('disableMfaHandler', () => {
    it('disables MFA using the provided token and returns a success message', async () => {
      req.user = { _id: 'user123' }
      req.body = { token: '123456' }
      authService.disableMfa.mockResolvedValue(undefined)

      await disableMfaHandler(req, res, next)

      expect(authService.disableMfa).toHaveBeenCalledWith('user123', '123456')
      expect(res.json).toHaveBeenCalledWith({ message: 'MFA disabled successfully' })
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on an invalid token', async () => {
      req.user = { _id: 'user123' }
      req.body = { token: '000000' }
      const err = Object.assign(new Error('Invalid MFA token'), { status: 400 })
      authService.disableMfa.mockRejectedValue(err)

      await disableMfaHandler(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })
})
