import { Router } from 'express'
import passport from 'passport'
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
import { authMiddleware } from '../middleware/auth.middleware.js'
import { authRateLimit } from '../middleware/rateLimit.middleware.js'

const router = Router()

// Local auth
router.post('/signup', authRateLimit, signup)
router.post('/login',  authRateLimit, login)

// Password reset
router.post('/forgot-password', authRateLimit, forgotPassword)
router.post('/reset-password',  authRateLimit, resetPassword)

// OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  handleOAuthCallback
)

// Token refresh (reads httpOnly cookie)
router.post('/refresh', refresh)

// Protected
router.get('/me',     authMiddleware, getMe)
router.post('/logout', authMiddleware, logout)

// MFA
router.post('/mfa/setup',        authMiddleware, setupMfa)
router.post('/mfa/verify-setup', authMiddleware, verifyMfaSetup)
router.post('/mfa/validate',     authRateLimit,  validateMfaLogin)
router.delete('/mfa',            authMiddleware, disableMfaHandler)

export default router

