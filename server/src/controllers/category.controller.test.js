import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listCategories, createCategory, updateCategory, deleteCategory } from './category.controller.js'

vi.mock('../services/category.service.js', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import * as categoryService from '../services/category.service.js'

const makeReq = (overrides = {}) => ({
  user: { _id: 'user123' },
  body: {},
  params: {},
  query: {},
  ...overrides,
})

const makeRes = () => {
  const res = { json: vi.fn(), status: vi.fn() }
  res.status.mockReturnValue(res)
  return res
}

beforeEach(() => vi.clearAllMocks())

describe('listCategories', () => {
  it('responds with categories from service', async () => {
    const data = [{ name: 'Food' }, { name: 'Transport' }]
    categoryService.listCategories.mockResolvedValue(data)

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await listCategories(req, res, next)

    expect(categoryService.listCategories).toHaveBeenCalledWith('user123')
    expect(res.json).toHaveBeenCalledWith(data)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next on service failure', async () => {
    const err = new Error('DB error')
    categoryService.listCategories.mockRejectedValue(err)

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await listCategories(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('createCategory', () => {
  it('responds 201 with created category', async () => {
    const body = { name: 'Groceries' }
    const created = { _id: 'cat1', name: 'Groceries' }
    categoryService.createCategory.mockResolvedValue(created)

    const req = makeReq({ body })
    const res = makeRes()
    const next = vi.fn()

    await createCategory(req, res, next)

    expect(categoryService.createCategory).toHaveBeenCalledWith(body, 'user123')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(created)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next on service failure', async () => {
    const err = Object.assign(new Error('Conflict'), { status: 409 })
    categoryService.createCategory.mockRejectedValue(err)

    const req = makeReq({ body: { name: 'Duplicate' } })
    const res = makeRes()
    const next = vi.fn()

    await createCategory(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('updateCategory', () => {
  it('responds with the updated category', async () => {
    const updated = { _id: 'cat1', name: 'Renamed', color: '#fff' }
    categoryService.updateCategory.mockResolvedValue(updated)

    const req = makeReq({ params: { id: 'cat1' }, body: { name: 'Renamed', color: '#fff' } })
    const res = makeRes()
    const next = vi.fn()

    await updateCategory(req, res, next)

    expect(categoryService.updateCategory).toHaveBeenCalledWith('cat1', req.body, 'user123')
    expect(res.json).toHaveBeenCalledWith(updated)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next on service failure', async () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 })
    categoryService.updateCategory.mockRejectedValue(err)

    const req = makeReq({ params: { id: 'cat1' }, body: { name: 'X' } })
    const res = makeRes()
    const next = vi.fn()

    await updateCategory(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('deleteCategory', () => {
  it('responds with confirmation message', async () => {
    categoryService.deleteCategory.mockResolvedValue(undefined)

    const req = makeReq({ params: { id: 'cat1' } })
    const res = makeRes()
    const next = vi.fn()

    await deleteCategory(req, res, next)

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat1', 'user123')
    expect(res.json).toHaveBeenCalledWith({ message: 'Category deleted' })
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next when category not found', async () => {
    const err = Object.assign(new Error('Not found'), { status: 404 })
    categoryService.deleteCategory.mockRejectedValue(err)

    const req = makeReq({ params: { id: 'nonexistent' } })
    const res = makeRes()
    const next = vi.fn()

    await deleteCategory(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})
