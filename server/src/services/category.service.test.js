import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listCategories, createCategory, deleteCategory } from './category.service.js'
import { Category } from '../models/Category.model.js'

vi.mock('../models/Category.model.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listCategories', () => {
  it('queries categories belonging to userId or marked as default', async () => {
    const mockCategories = [{ name: 'Food' }, { name: 'Travel', isDefault: true }]
    Category.find.mockResolvedValue(mockCategories)

    const result = await listCategories('user123')

    expect(Category.find).toHaveBeenCalledWith({
      $or: [{ user: 'user123' }, { isDefault: true }]
    })
    expect(result).toEqual(mockCategories)
  })

  it('propagates DB errors', async () => {
    Category.find.mockRejectedValue(new Error('DB error'))
    await expect(listCategories('user123')).rejects.toThrow('DB error')
  })
})

describe('createCategory', () => {
  it('merges data with userId, saves, and returns the new category', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined)
    const mockCategory = { name: 'Food', icon: '🍔', user: 'user123', save: mockSave }
    Category.mockImplementation(function () {
      return mockCategory
    })

    const result = await createCategory({ name: 'Food', icon: '🍔' }, 'user123')

    expect(Category).toHaveBeenCalledWith({ name: 'Food', icon: '🍔', user: 'user123' })
    expect(mockSave).toHaveBeenCalled()
    expect(result).toBe(mockCategory)
  })

  it('propagates save errors', async () => {
    const mockSave = vi.fn().mockRejectedValue(new Error('Validation failed'))
    Category.mockImplementation(function () {
      return { save: mockSave }
    })

    await expect(createCategory({ name: 'Food' }, 'user123')).rejects.toThrow('Validation failed')
  })
})

describe('deleteCategory', () => {
  it('deletes a category owned by the requesting user', async () => {
    const mockDeleteOne = vi.fn().mockResolvedValue(undefined)
    const mockCategory = {
      user: { toString: () => 'user123' },
      deleteOne: mockDeleteOne
    }
    Category.findById.mockResolvedValue(mockCategory)

    await deleteCategory('cat123', 'user123')

    expect(Category.findById).toHaveBeenCalledWith('cat123')
    expect(mockDeleteOne).toHaveBeenCalled()
  })

  it('throws 404 when category does not exist', async () => {
    Category.findById.mockResolvedValue(null)

    await expect(deleteCategory('cat123', 'user123')).rejects.toMatchObject({
      message: 'Category not found',
      status: 404
    })
  })

  it('throws 404 when category belongs to a different user', async () => {
    const mockCategory = {
      user: { toString: () => 'otherUser' },
      deleteOne: vi.fn()
    }
    Category.findById.mockResolvedValue(mockCategory)

    await expect(deleteCategory('cat123', 'user123')).rejects.toMatchObject({
      message: 'Category not found',
      status: 404
    })
  })

  it('allows deletion of default categories (no user field)', async () => {
    // Default categories have no user field; the ownership check short-circuits to false
    const mockDeleteOne = vi.fn().mockResolvedValue(undefined)
    Category.findById.mockResolvedValue({ user: null, deleteOne: mockDeleteOne })

    await deleteCategory('defaultCat', 'anyUser')

    expect(mockDeleteOne).toHaveBeenCalled()
  })

  it('propagates DB errors from findById', async () => {
    Category.findById.mockRejectedValue(new Error('DB error'))

    await expect(deleteCategory('cat123', 'user123')).rejects.toThrow('DB error')
  })
})
