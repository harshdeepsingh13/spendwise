import { env } from '../config/env.js'
import * as authService from '../services/auth.service.js'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const signup = async (req, res, next) => {
  try {
    const result = await authService.createUser(req.body)
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.status(201).json({ token: result.token, user: result.user })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const result = await authService.authenticateUser(req.body)
    if (result.requiresMfa) {
      return res.json({ requiresMfa: true, mfaChallengeToken: result.mfaChallengeToken })
    }
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ token: result.token, user: result.user })
  } catch (err) {
    next(err)
  }
}

export const handleOAuthCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`)
  }
  if (req.user.mfaEnabled) {
    const challengeToken = authService.signMfaChallengeToken(req.user._id)
    return res.redirect(`${env.CLIENT_URL}/auth/callback?mfaChallengeToken=${challengeToken}`)
  }
  const { accessToken, refreshToken } = await authService.generateSessionForUser(req.user)
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS)
  res.redirect(`${env.CLIENT_URL}/auth/callback?token=${accessToken}`)
}

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      const err = new Error('No refresh token')
      err.status = 401
      throw err
    }
    const result = await authService.refreshAccessToken(refreshToken)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res) => {
  res.json(req.user)
}

export const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id)
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export const setupMfa = async (req, res, next) => {
  try {
    const result = await authService.generateMfaSetup(req.user._id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const verifyMfaSetup = async (req, res, next) => {
  try {
    await authService.verifyAndEnableMfa(req.user._id, req.body.token)
    res.json({ message: 'MFA enabled successfully' })
  } catch (err) {
    next(err)
  }
}

export const validateMfaLogin = async (req, res, next) => {
  try {
    const { mfaChallengeToken, totpCode } = req.body
    const result = await authService.validateMfaLogin(mfaChallengeToken, totpCode)
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)
    res.json({ token: result.token, user: result.user })
  } catch (err) {
    next(err)
  }
}

export const disableMfaHandler = async (req, res, next) => {
  try {
    await authService.disableMfa(req.user._id, req.body.token)
    res.json({ message: 'MFA disabled successfully' })
  } catch (err) {
    next(err)
  }
}
