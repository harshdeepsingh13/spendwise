import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Captured references to inspect after model import
let capturedPreSaveHook = null
let capturedDefinition = null
let capturedOptions = null
const capturedMethods = {}
const capturedModelArgs = { name: null }

vi.mock('mongoose', () => {
  function MockSchema(definition, options) {
    capturedDefinition = definition
    capturedOptions = options
    this.methods = capturedMethods
    this.pre = function (event, fn) {
      if (event === 'save') capturedPreSaveHook = fn
    }
  }

  return {
    default: {
      Schema: MockSchema,
      model: vi.fn((name) => {
        capturedModelArgs.name = name
        return {}
      }),
    },
  }
})

// Import model after mock is in place
const { User } = await import('./User.model.js')

describe('User model — schema setup', () => {
  it('registers a pre-save hook', () => {
    expect(capturedPreSaveHook).toBeTypeOf('function')
  })

  it('attaches comparePassword to schema methods', () => {
    expect(capturedMethods.comparePassword).toBeTypeOf('function')
  })

  it('exports the compiled model', () => {
    expect(User).toBeDefined()
  })

  it('registers the model under the name "User"', () => {
    expect(capturedModelArgs.name).toBe('User')
  })

  it('enables timestamps on the schema', () => {
    expect(capturedOptions).toEqual({ timestamps: true })
  })
})

describe('User model — schema field configuration', () => {
  it('requires a unique, lowercased email', () => {
    expect(capturedDefinition.email).toMatchObject({
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    })
  })

  it('restricts tier to free/pro and defaults to free', () => {
    expect(capturedDefinition.tier.enum).toEqual(['free', 'pro'])
    expect(capturedDefinition.tier.default).toBe('free')
  })

  it('defaults timezone to UTC and baseCurrency to USD', () => {
    expect(capturedDefinition.timezone.default).toBe('UTC')
    expect(capturedDefinition.baseCurrency.default).toBe('USD')
  })

  it('excludes sensitive fields from default query results (select: false)', () => {
    for (const field of [
      'mfaTempSecret',
      'mfaSecret',
      'refreshToken',
      'resetToken',
      'resetTokenExpiry',
    ]) {
      expect(capturedDefinition[field].select).toBe(false)
    }
  })

  it('disables MFA by default', () => {
    expect(capturedDefinition.mfaEnabled.default).toBe(false)
  })

  it('indexes googleId as a sparse index', () => {
    expect(capturedDefinition.googleId).toMatchObject({
      type: String,
      index: true,
      sparse: true,
    })
  })

  it('defaults notificationPrefs (budget alerts off, 80% threshold, in-app on)', () => {
    const prefs = capturedDefinition.notificationPrefs
    expect(prefs.budgetAlerts.enabled.default).toBe(false)
    expect(prefs.budgetAlerts.threshold.default).toBe(80)
    expect(prefs.inApp.default).toBe(true)
    expect(prefs.email.default).toBe(false)
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

  it('calls next exactly once with no argument on success', async () => {
    const next = vi.fn()
    const ctx = { isModified: vi.fn(() => true), password: 'plain-text' }

    await capturedPreSaveHook.call(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it('produces a bcrypt hash distinct from the plaintext', async () => {
    const next = vi.fn()
    const ctx = { isModified: vi.fn(() => true), password: 'plain-text' }

    await capturedPreSaveHook.call(ctx, next)

    expect(ctx.password).not.toBe('plain-text')
    expect(ctx.password).toMatch(/^\$2[aby]\$10\$/)
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

  // OAuth accounts have no stored password; callers (authenticateUser) must
  // guard on `user.password` before invoking this — bcrypt itself rejects.
  it('rejects when the account has no stored password (OAuth user)', async () => {
    const ctx = { password: undefined }

    await expect(capturedMethods.comparePassword.call(ctx, 'anything')).rejects.toThrow()
  })
})
