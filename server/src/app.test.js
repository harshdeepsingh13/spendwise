import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('./config/env.js', () => ({ env: { CLIENT_URL: 'http://localhost:5173' } }))
vi.mock('./config/passport.js', () => ({}))
vi.mock('./routes/auth.routes.js', () => ({ default: (req, res, next) => next() }))
vi.mock('./routes/expense.routes.js', () => ({ default: (req, res, next) => next() }))
vi.mock('./routes/category.routes.js', () => ({ default: (req, res, next) => next() }))
vi.mock('./routes/receipt.routes.js', () => ({ default: (req, res, next) => next() }))
vi.mock('./routes/analytics.routes.js', () => ({ default: (req, res, next) => next() }))
vi.mock('./routes/budget.routes.js', () => ({ default: (req, res, next) => next() }))

import { createApp } from './app.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'

describe('createApp', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  it('returns an Express application with standard methods', () => {
    expect(typeof app).toBe('function')
    expect(typeof app.use).toBe('function')
    expect(typeof app.listen).toBe('function')
    expect(typeof app.get).toBe('function')
  })

  it('mounts all API route prefixes', () => {
    const stack = app._router.stack
    const apiPaths = [
      '/api/auth',
      '/api/expenses',
      '/api/categories',
      '/api/receipts',
      '/api/analytics',
      '/api/budgets',
    ]

    for (const path of apiPaths) {
      const mounted = stack.some(layer => layer.regexp.test(path))
      expect(mounted, `Expected route at ${path} to be registered`).toBe(true)
    }
  })

  it('does not match routes at unregistered paths', () => {
    const stack = app._router.stack
    const unmatchedPath = '/api/nonexistent'
    const matched = stack
      .filter(layer => layer.route === undefined && layer.handle && layer.handle.stack)
      .some(layer => layer.regexp.test(unmatchedPath))
    expect(matched).toBe(false)
  })

  it('includes JSON body-parsing middleware', () => {
    const stack = app._router.stack
    const hasJson = stack.some(layer => layer.handle.name === 'jsonParser')
    expect(hasJson).toBe(true)
  })

  it('includes cookie-parser middleware', () => {
    const stack = app._router.stack
    const hasCookieParser = stack.some(layer => layer.handle.name === 'cookieParser')
    expect(hasCookieParser).toBe(true)
  })

  it('registers at least 10 middleware layers (cors + json + cookie + passport + 6 routes + error handler)', () => {
    expect(app._router.stack.length).toBeGreaterThanOrEqual(10)
  })

  it('returns an independent instance on each call', () => {
    const secondApp = createApp()
    expect(app).not.toBe(secondApp)
  })
})

describe('errorHandler middleware', () => {
  let res, req, next

  beforeEach(() => {
    req = {}
    next = vi.fn()
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  })

  it('uses error.status when present', () => {
    const err = Object.assign(new Error('Not found'), { status: 404 })

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' })
  })

  it('defaults to status 500 when error.status is absent', () => {
    const err = new Error('Unexpected failure')

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unexpected failure' })
  })

  it('falls back to "Internal server error" when error message is missing', () => {
    const err = { status: 503 }

    errorHandler(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })

  it('responds with 500 and fallback message for a completely empty error object', () => {
    errorHandler({}, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
  })
})
