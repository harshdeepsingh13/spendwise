import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: { CLIENT_URL: 'http://localhost:5173' },
}))

vi.mock('../services/auth.service.js')

import * as authService from '../services/auth.service.js'
import { signup, login, handleOAuthCallback, getMe, logout } from './auth.controller.js'

describe('auth.controller', () => {
  let req, res, next

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, user: null }
    res = { json: vi.fn(), status: vi.fn().mockReturnThis(), redirect: vi.fn() }
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('signup', () => {
    it('returns 201 with result on success', async () => {
      const mockResult = { token: 'abc', user: { id: '1', email: 'a@b.com' } }
      authService.createUser.mockResolvedValue(mockResult)
      req.body = { email: 'a@b.com', password: 'pass123' }

      await signup(req, res, next)

      expect(authService.createUser).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockResult)
      expect(next).not.toHaveBeenCalled()
    })

    it('calls next with error on service failure', async () => {
      const err = Object.assign(new Error('Email already registered'), { status: 409 })
      authService.createUser.mockRejectedValue(err)
      req.body = { email: 'a@b.com', password: 'pass123' }

      await signup(req, res, next)

      expect(next).toHaveBeenCalledWith(err)
      expect(res.json).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('returns result on success', async () => {
      const mockResult = { token: 'tok123', user: { id: '1', email: 'a@b.com' } }
      authService.authenticateUser.mockResolvedValue(mockResult)
      req.body = { email: 'a@b.com', password: 'pass123' }

      await login(req, res, next)

      expect(authService.authenticateUser).toHaveBeenCalledWith(req.body)
      expect(res.json).toHaveBeenCalledWith(mockResult)
      expect(next).not.toHaveBeenCalled()
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
    it('returns 401 when req.user is null', () => {
      req.user = null

      handleOAuthCallback(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' })
      expect(res.redirect).not.toHaveBeenCalled()
    })

    it('returns 401 when req.user is undefined', () => {
      req.user = undefined

      handleOAuthCallback(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' })
    })

    it('redirects with signed token when req.user is set', () => {
      req.user = { _id: 'user123', email: 'a@b.com' }
      authService.signTokenForUser.mockReturnValue('signed-jwt')

      handleOAuthCallback(req, res)

      expect(authService.signTokenForUser).toHaveBeenCalledWith(req.user)
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback?token=signed-jwt'
      )
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
    it('returns a success message', () => {
      logout(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' })
    })
  })
})
