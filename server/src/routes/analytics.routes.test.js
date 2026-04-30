import { describe, it, expect, vi } from 'vitest'

vi.mock('../controllers/analytics.controller.js', () => ({
  getDashboard: vi.fn(),
  getMonthly: vi.fn(),
  getYearly: vi.fn(),
  getSummary: vi.fn(),
  getKpi: vi.fn(),
  getBudgetVsActual: vi.fn(),
}))

vi.mock('../middleware/auth.middleware.js', () => ({
  authMiddleware: vi.fn((req, res, next) => next()),
}))

import router from './analytics.routes.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import {
  getDashboard,
  getMonthly,
  getYearly,
  getSummary,
  getKpi,
  getBudgetVsActual,
} from '../controllers/analytics.controller.js'

describe('analytics.routes', () => {
  it('applies authMiddleware to all routes via router.use()', () => {
    const useLayer = router.stack.find((l) => !l.route && l.handle === authMiddleware)
    expect(useLayer).toBeDefined()
  })

  it('registers GET /dashboard → getDashboard', () => {
    const layer = router.stack.find((l) => l.route?.path === '/dashboard' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getDashboard)
  })

  it('registers GET /monthly → getMonthly', () => {
    const layer = router.stack.find((l) => l.route?.path === '/monthly' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getMonthly)
  })

  it('registers GET /yearly → getYearly', () => {
    const layer = router.stack.find((l) => l.route?.path === '/yearly' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getYearly)
  })

  it('registers GET /summary → getSummary', () => {
    const layer = router.stack.find((l) => l.route?.path === '/summary' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getSummary)
  })

  it('registers GET /kpi → getKpi', () => {
    const layer = router.stack.find((l) => l.route?.path === '/kpi' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getKpi)
  })

  it('registers GET /budget-vs-actual → getBudgetVsActual', () => {
    const layer = router.stack.find(
      (l) => l.route?.path === '/budget-vs-actual' && l.route.methods.get
    )
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getBudgetVsActual)
  })

  it('has exactly 6 route definitions (no extra or missing routes)', () => {
    const routeLayers = router.stack.filter((l) => l.route)
    expect(routeLayers).toHaveLength(6)
  })
})
