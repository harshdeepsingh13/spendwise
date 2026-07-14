import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import dotenv from 'dotenv'

vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
}))

/** Minimal set of env vars the module requires to load without throwing. */
const REQUIRED = {
  MONGODB_URI: 'mongodb://localhost/test',
  JWT_SECRET: 'jwt-secret',
  JWT_REFRESH_SECRET: 'jwt-refresh-secret',
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'api-key',
  CLOUDINARY_API_SECRET: 'api-secret',
  CLIENT_URL: 'http://localhost:5173',
}

let ORIGINAL_ENV

/**
 * Re-imports the env module against a fresh process.env.
 * @param {Record<string, string>} envObj - Complete process.env to evaluate against.
 * @returns {Promise<object>} The exported `env` object.
 */
async function loadEnv(envObj) {
  process.env = envObj
  vi.resetModules()
  return (await import('./env.js')).env
}

beforeEach(() => {
  ORIGINAL_ENV = process.env
})

afterEach(() => {
  process.env = ORIGINAL_ENV
  vi.clearAllMocks()
})

describe('env config', () => {
  describe('required variable validation', () => {
    it('loads successfully when all required vars are present', async () => {
      const env = await loadEnv({ ...REQUIRED })
      expect(env.MONGODB_URI).toBe(REQUIRED.MONGODB_URI)
    })

    it.each(Object.keys(REQUIRED))('throws when %s is missing', async (key) => {
      const { [key]: _omitted, ...rest } = REQUIRED
      process.env = rest
      vi.resetModules()
      await expect(import('./env.js')).rejects.toThrow(
        `Missing required environment variable: ${key}`,
      )
    })

    it('throws when a required var is present but empty', async () => {
      process.env = { ...REQUIRED, JWT_SECRET: '' }
      vi.resetModules()
      await expect(import('./env.js')).rejects.toThrow(
        'Missing required environment variable: JWT_SECRET',
      )
    })
  })

  describe('defaults', () => {
    it('applies defaults when optional vars are unset', async () => {
      const env = await loadEnv({ ...REQUIRED })
      expect(env.PORT).toBe(5000)
      expect(env.NODE_ENV).toBe('development')
      expect(env.JWT_EXPIRE).toBe('15m')
      expect(env.JWT_REFRESH_EXPIRE).toBe('7d')
      expect(env.SMTP_FROM).toBe('Spendwise <no-reply@spendwise.app>')
    })

    it('derives GOOGLE_CALLBACK_URL from CLIENT_URL when unset', async () => {
      const env = await loadEnv({ ...REQUIRED })
      expect(env.GOOGLE_CALLBACK_URL).toBe(
        `${REQUIRED.CLIENT_URL}/api/auth/google/callback`,
      )
    })

    it('leaves optional SMTP vars undefined when unset', async () => {
      const env = await loadEnv({ ...REQUIRED })
      expect(env.SMTP_HOST).toBeUndefined()
      expect(env.SMTP_PORT).toBeUndefined()
      expect(env.SMTP_USER).toBeUndefined()
      expect(env.SMTP_PASS).toBeUndefined()
    })
  })

  describe('overrides', () => {
    it('uses provided values over defaults', async () => {
      const env = await loadEnv({
        ...REQUIRED,
        PORT: '8001',
        NODE_ENV: 'test',
        JWT_EXPIRE: '1h',
        JWT_REFRESH_EXPIRE: '14d',
        GOOGLE_CALLBACK_URL: 'https://app.example.com/cb',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user',
        SMTP_PASS: 'pass',
        SMTP_FROM: 'Custom <hi@example.com>',
      })
      expect(env.PORT).toBe('8001')
      expect(env.NODE_ENV).toBe('test')
      expect(env.JWT_EXPIRE).toBe('1h')
      expect(env.JWT_REFRESH_EXPIRE).toBe('14d')
      expect(env.GOOGLE_CALLBACK_URL).toBe('https://app.example.com/cb')
      expect(env.SMTP_HOST).toBe('smtp.example.com')
      expect(env.SMTP_PORT).toBe('587')
      expect(env.SMTP_FROM).toBe('Custom <hi@example.com>')
    })

    it('maps all configured values onto the exported env object', async () => {
      const env = await loadEnv({ ...REQUIRED })
      expect(env).toMatchObject({
        CLIENT_URL: REQUIRED.CLIENT_URL,
        MONGODB_URI: REQUIRED.MONGODB_URI,
        JWT_SECRET: REQUIRED.JWT_SECRET,
        JWT_REFRESH_SECRET: REQUIRED.JWT_REFRESH_SECRET,
        GOOGLE_CLIENT_ID: REQUIRED.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: REQUIRED.GOOGLE_CLIENT_SECRET,
        CLOUDINARY_CLOUD_NAME: REQUIRED.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: REQUIRED.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: REQUIRED.CLOUDINARY_API_SECRET,
      })
    })
  })

  describe('dotenv loading by NODE_ENV', () => {
    it('loads .env.local in development', async () => {
      await loadEnv({ ...REQUIRED, NODE_ENV: 'development' })
      expect(dotenv.config).toHaveBeenCalledTimes(1)
      expect(dotenv.config).toHaveBeenCalledWith({
        path: expect.stringContaining('.env.local'),
      })
    })

    it('loads .env in production', async () => {
      await loadEnv({ ...REQUIRED, NODE_ENV: 'production' })
      expect(dotenv.config).toHaveBeenCalledTimes(1)
      expect(dotenv.config).toHaveBeenCalledWith({
        path: expect.stringMatching(/[/\\]\.env$/),
      })
    })

    it('does not load any env file for other NODE_ENV values', async () => {
      await loadEnv({ ...REQUIRED, NODE_ENV: 'test' })
      expect(dotenv.config).not.toHaveBeenCalled()
    })
  })
})
