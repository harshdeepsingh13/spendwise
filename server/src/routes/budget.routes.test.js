import { describe, it, expect, vi } from 'vitest'

vi.mock('../controllers/budget.controller.js', () => ({
  listBudgets: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
}))

vi.mock('../middleware/auth.middleware.js', () => ({
  authMiddleware: vi.fn((req, res, next) => next()),
}))

import router from './budget.routes.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import {
  listBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller.js'

describe('budget.routes', () => {
  it('applies authMiddleware to all routes via router.use()', () => {
    const useLayer = router.stack.find((l) => !l.route && l.handle === authMiddleware)
    expect(useLayer).toBeDefined()
  })

  it('registers GET / → listBudgets', () => {
    const layer = router.stack.find((l) => l.route?.path === '/' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(listBudgets)
  })

  it('registers POST / → createBudget', () => {
    const layer = router.stack.find((l) => l.route?.path === '/' && l.route.methods.post)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(createBudget)
  })

  it('registers PUT /:id → updateBudget', () => {
    const layer = router.stack.find((l) => l.route?.path === '/:id' && l.route.methods.put)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(updateBudget)
  })

  it('registers DELETE /:id → deleteBudget', () => {
    const layer = router.stack.find((l) => l.route?.path === '/:id' && l.route.methods.delete)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(deleteBudget)
  })

  it('has exactly 4 route definitions (no extra or missing routes)', () => {
    const routeLayers = router.stack.filter((l) => l.route)
    expect(routeLayers).toHaveLength(4)
  })
})
