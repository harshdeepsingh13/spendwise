import { describe, it, expect, vi } from 'vitest'

vi.mock('../controllers/receipt.controller.js', () => ({
  uploadReceipt: vi.fn(),
  getOcrStatus: vi.fn(),
  listReceipts: vi.fn(),
  deleteReceipt: vi.fn(),
  updateReceipt: vi.fn(),
}))

vi.mock('../middleware/auth.middleware.js', () => ({
  authMiddleware: vi.fn((req, res, next) => next()),
}))

vi.mock('../middleware/upload.middleware.js', () => ({
  upload: {
    single: vi.fn(() => vi.fn()),
  },
}))

import router from './receipt.routes.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.middleware.js'
import {
  uploadReceipt,
  getOcrStatus,
  listReceipts,
  deleteReceipt,
  updateReceipt,
} from '../controllers/receipt.controller.js'

describe('receipt.routes', () => {
  it('applies authMiddleware to all routes via router.use()', () => {
    const useLayer = router.stack.find((l) => !l.route && l.handle === authMiddleware)
    expect(useLayer).toBeDefined()
  })

  it('registers GET / → listReceipts', () => {
    const layer = router.stack.find((l) => l.route?.path === '/' && l.route.methods.get)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(listReceipts)
  })

  it('registers POST /upload with upload.single("receipt") followed by uploadReceipt', () => {
    const layer = router.stack.find((l) => l.route?.path === '/upload' && l.route.methods.post)
    expect(layer).toBeDefined()
    expect(layer.route.stack).toHaveLength(2)
    expect(layer.route.stack[1].handle).toBe(uploadReceipt)
    expect(upload.single).toHaveBeenCalledWith('receipt')
  })

  it('registers GET /:id/ocr-status → getOcrStatus', () => {
    const layer = router.stack.find(
      (l) => l.route?.path === '/:id/ocr-status' && l.route.methods.get
    )
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(getOcrStatus)
  })

  it('registers DELETE /:id → deleteReceipt', () => {
    const layer = router.stack.find((l) => l.route?.path === '/:id' && l.route.methods.delete)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(deleteReceipt)
  })

  it('registers PATCH /:id → updateReceipt', () => {
    const layer = router.stack.find((l) => l.route?.path === '/:id' && l.route.methods.patch)
    expect(layer).toBeDefined()
    expect(layer.route.stack[0].handle).toBe(updateReceipt)
  })

  it('has exactly 5 route definitions (no extra or missing routes)', () => {
    const routeLayers = router.stack.filter((l) => l.route)
    expect(routeLayers).toHaveLength(5)
  })
})
