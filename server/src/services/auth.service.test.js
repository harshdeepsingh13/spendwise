import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/env.js', () => ({
  env: { JWT_SECRET: 'test-secret', JWT_EXPIRE: '7d' }
}))

vi.mock('../models/User.model.js', () => {
  const User = vi.fn()
  User.findOne = vi.fn()
  return { User }
})

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn(() => 'mock-token') }
}))

import { createUser, authenticateUser, signTokenForUser } from './auth.service.js'
import { User } from '../models/User.model.js'
import jwt from 'jsonwebtoken'

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.mockImplementation(function (data) {
      Object.assign(this, data)
      this._id = 'new-user-id'
      this.save = vi.fn().mockResolvedValue(undefined)
    })
    User.findOne.mockResolvedValue(null)
  })

  it('throws 400 when email is missing', async () => {
    const err = await createUser({ password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 400 when password is missing', async () => {
    const err = await createUser({ email: 'test@example.com' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 409 when email already registered (local account)', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', googleId: null })
    const err = await createUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(409)
    expect(err.message).toBe('Email already registered')
  })

  it('throws 409 with Google-specific message when email registered via Google', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', googleId: 'google123' })
    const err = await createUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(409)
    expect(err.message).toMatch(/Google/i)
  })

  it('returns token and user object on successful creation', async () => {
    const result = await createUser({ email: 'new@example.com', password: 'pass', displayName: 'New User' })
    expect(result.token).toBe('mock-token')
    expect(result.user).toMatchObject({
      id: 'new-user-id',
      email: 'new@example.com',
      displayName: 'New User'
    })
  })

  it('defaults displayName to email prefix when not provided', async () => {
    const result = await createUser({ email: 'john@example.com', password: 'pass' })
    expect(result.user.displayName).toBe('john')
  })

  it('calls jwt.sign with the new user id', async () => {
    await createUser({ email: 'new@example.com', password: 'pass' })
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'new-user-id' },
      'test-secret',
      { expiresIn: '7d' }
    )
  })
})

describe('authenticateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.findOne.mockResolvedValue(null)
  })

  it('throws 400 when email is missing', async () => {
    const err = await authenticateUser({ password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 400 when password is missing', async () => {
    const err = await authenticateUser({ email: 'test@example.com' }).catch((e) => e)
    expect(err.status).toBe(400)
    expect(err.message).toMatch(/email and password required/i)
  })

  it('throws 401 when user is not found', async () => {
    const err = await authenticateUser({ email: 'ghost@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid email or password')
  })

  it('throws 401 with Google message when account uses Google sign-in', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', password: null, googleId: 'google123' })
    const err = await authenticateUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/Google sign-in/i)
  })

  it('throws 401 when account has no password and is not a Google account', async () => {
    User.findOne.mockResolvedValue({ email: 'test@example.com', password: null, googleId: null })
    const err = await authenticateUser({ email: 'test@example.com', password: 'pass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toMatch(/password login/i)
  })

  it('throws 401 when password is incorrect', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      email: 'test@example.com',
      password: 'hashed',
      googleId: null,
      comparePassword: vi.fn().mockResolvedValue(false)
    })
    const err = await authenticateUser({ email: 'test@example.com', password: 'wrongpass' }).catch((e) => e)
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid email or password')
  })

  it('returns token and user on successful authentication', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'hashed',
      googleId: null,
      comparePassword: vi.fn().mockResolvedValue(true)
    })
    const result = await authenticateUser({ email: 'test@example.com', password: 'correctpass' })
    expect(result.token).toBe('mock-token')
    expect(result.user).toMatchObject({
      id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User'
    })
  })

  it('calls jwt.sign with authenticated user id', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'hashed',
      googleId: null,
      comparePassword: vi.fn().mockResolvedValue(true)
    })
    await authenticateUser({ email: 'test@example.com', password: 'correctpass' })
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'user123' },
      'test-secret',
      { expiresIn: '7d' }
    )
  })
})

describe('signTokenForUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a token for the given user', () => {
    const token = signTokenForUser({ _id: 'user456' })
    expect(token).toBe('mock-token')
  })

  it('calls jwt.sign with stringified user._id', () => {
    signTokenForUser({ _id: 'user456' })
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'user456' },
      'test-secret',
      { expiresIn: '7d' }
    )
  })
})
