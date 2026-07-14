import { describe, it, expect, vi } from 'vitest'

vi.mock('../controllers/auth.controller.js', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  handleOAuthCallback: vi.fn(),
  refresh: vi.fn(),
  getMe: vi.fn(),
  logout: vi.fn(),
  setupMfa: vi.fn(),
  verifyMfaSetup: vi.fn(),
  validateMfaLogin: vi.fn(),
  disableMfaHandler: vi.fn(),
}))

vi.mock('../middleware/auth.middleware.js', () => ({
  authMiddleware: vi.fn((req, res, next) => next()),
}))

vi.mock('../middleware/rateLimit.middleware.js', () => ({
  authRateLimit: vi.fn((req, res, next) => next()),
}))

vi.mock('passport', () => ({
  default: {
    authenticate: vi.fn(() => (req, res, next) => next()),
  },
}))

import router from './auth.routes.js'
import passport from 'passport'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { authRateLimit } from '../middleware/rateLimit.middleware.js'
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  handleOAuthCallback,
  refresh,
  getMe,
  logout,
  setupMfa,
  verifyMfaSetup,
  validateMfaLogin,
  disableMfaHandler,
} from '../controllers/auth.controller.js'

/**
 * Finds the route layer for a given path + HTTP method on the router stack.
 * @param {string} path - Route path (e.g. '/signup').
 * @param {string} method - Lowercase HTTP method (e.g. 'post').
 * @returns {object|undefined} The matching Express route layer, if any.
 */
const findRoute = (path, method) =>
  router.stack.find((l) => l.route?.path === path && l.route.methods[method])

describe('auth.routes', () => {
  describe('local auth', () => {
    it('registers POST /signup → authRateLimit, signup', () => {
      const layer = findRoute('/signup', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authRateLimit, signup])
    })

    it('registers POST /login → authRateLimit, login', () => {
      const layer = findRoute('/login', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authRateLimit, login])
    })
  })

  describe('password reset', () => {
    it('registers POST /forgot-password → authRateLimit, forgotPassword', () => {
      const layer = findRoute('/forgot-password', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authRateLimit, forgotPassword])
    })

    it('registers POST /reset-password → authRateLimit, resetPassword', () => {
      const layer = findRoute('/reset-password', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authRateLimit, resetPassword])
    })
  })

  describe('OAuth', () => {
    it('registers GET /google with the google passport strategy', () => {
      const layer = findRoute('/google', 'get')
      expect(layer).toBeDefined()
      expect(passport.authenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'] })
    })

    it('registers GET /google/callback → passport authenticate then handleOAuthCallback', () => {
      const layer = findRoute('/google/callback', 'get')
      expect(layer).toBeDefined()
      expect(passport.authenticate).toHaveBeenCalledWith('google', {
        session: false,
        failureRedirect: '/login?error=oauth_failed',
      })
      // Last handler in the chain is the controller callback.
      expect(layer.route.stack[layer.route.stack.length - 1].handle).toBe(handleOAuthCallback)
    })
  })

  describe('token refresh', () => {
    it('registers POST /refresh → refresh (no auth middleware)', () => {
      const layer = findRoute('/refresh', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([refresh])
    })
  })

  describe('protected routes', () => {
    it('registers GET /me → authMiddleware, getMe', () => {
      const layer = findRoute('/me', 'get')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authMiddleware, getMe])
    })

    it('registers POST /logout → authMiddleware, logout', () => {
      const layer = findRoute('/logout', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authMiddleware, logout])
    })
  })

  describe('MFA', () => {
    it('registers POST /mfa/setup → authMiddleware, setupMfa', () => {
      const layer = findRoute('/mfa/setup', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authMiddleware, setupMfa])
    })

    it('registers POST /mfa/verify-setup → authMiddleware, verifyMfaSetup', () => {
      const layer = findRoute('/mfa/verify-setup', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authMiddleware, verifyMfaSetup])
    })

    it('registers POST /mfa/validate → authRateLimit, validateMfaLogin', () => {
      const layer = findRoute('/mfa/validate', 'post')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authRateLimit, validateMfaLogin])
    })

    it('registers DELETE /mfa → authMiddleware, disableMfaHandler', () => {
      const layer = findRoute('/mfa', 'delete')
      expect(layer).toBeDefined()
      expect(layer.route.stack.map((s) => s.handle)).toEqual([authMiddleware, disableMfaHandler])
    })
  })

  it('has exactly 13 route definitions (no extra or missing routes)', () => {
    const routeLayers = router.stack.filter((l) => l.route)
    expect(routeLayers).toHaveLength(13)
  })
})
