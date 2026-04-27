import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Captured references to inspect after model import
let capturedPreSaveHook = null
const capturedMethods = {}

vi.mock('mongoose', () => {
  function MockSchema() {
    this.methods = capturedMethods
    this.pre = function (event, fn) {
      if (event === 'save') capturedPreSaveHook = fn
    }
  }

  return {
    default: {
      Schema: MockSchema,
      model: vi.fn(() => ({})),
    },
  }
})

// Import model after mock is in place
await import('./User.model.js')

describe('User model — schema setup', () => {
  it('registers a pre-save hook', () => {
    expect(capturedPreSaveHook).toBeTypeOf('function')
  })

  it('attaches comparePassword to schema methods', () => {
    expect(capturedMethods.comparePassword).toBeTypeOf('function')
  })
})

describe('User model — pre-save password hashing', () => {
  it('hashes the password when it is modified', async () => {
    const next = vi.fn()
    const ctx = {
      isModified: vi.fn(() => true),
      password: 'plain-text',
    }

    await capturedPreSaveHook.call(ctx, next)

    expect(ctx.isModified).toHaveBeenCalledWith('password')
    const isHash = await bcrypt.compare('plain-text', ctx.password)
    expect(isHash).toBe(true)
    expect(next).toHaveBeenCalled()
  })

  it('skips hashing when password is not modified', async () => {
    const next = vi.fn()
    const originalPassword = '$2a$10$alreadyhashed'
    const ctx = {
      isModified: vi.fn(() => false),
      password: originalPassword,
    }

    await capturedPreSaveHook.call(ctx, next)

    expect(ctx.password).toBe(originalPassword)
    expect(next).toHaveBeenCalled()
  })
})

describe('User model — comparePassword method', () => {
  it('returns true for a matching password', async () => {
    const plain = 'secret123'
    const hash = await bcrypt.hash(plain, 10)
    const ctx = { password: hash }

    const result = await capturedMethods.comparePassword.call(ctx, plain)
    expect(result).toBe(true)
  })

  it('returns false for a wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10)
    const ctx = { password: hash }

    const result = await capturedMethods.comparePassword.call(ctx, 'wrong')
    expect(result).toBe(false)
  })
})
