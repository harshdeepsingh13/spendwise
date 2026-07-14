import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listCategories, createCategory, updateCategory, deleteCategory } from './category.service.js'
import { Category } from '../models/Category.model.js'
import { Expense } from '../models/Expense.model.js'
import { Budget } from '../models/Budget.model.js'

vi.mock('../models/Category.model.js')
vi.mock('../models/Expense.model.js')
vi.mock('../models/Budget.model.js')

beforeEach(() => {
  vi.clearAllMocks()
  // Default: category is not referenced by any expense or budget
  Expense.exists = vi.fn().mockResolvedValue(null)
  Budget.exists = vi.fn().mockResolvedValue(null)
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

  it('blocks deletion of default categories (shared, no user field)', async () => {
    const mockDeleteOne = vi.fn().mockResolvedValue(undefined)
    Category.findById.mockResolvedValue({ user: null, isDefault: true, deleteOne: mockDeleteOne })

    await expect(deleteCategory('defaultCat', 'anyUser')).rejects.toMatchObject({ status: 403 })
    expect(mockDeleteOne).not.toHaveBeenCalled()
  })

  it('throws 409 when the category is referenced by an expense', async () => {
    const mockDeleteOne = vi.fn().mockResolvedValue(undefined)
    Category.findById.mockResolvedValue({ user: { toString: () => 'user123' }, deleteOne: mockDeleteOne })
    Expense.exists.mockResolvedValue({ _id: 'exp1' })

    await expect(deleteCategory('cat123', 'user123')).rejects.toMatchObject({ status: 409 })
    expect(mockDeleteOne).not.toHaveBeenCalled()
  })

  it('throws 409 when the category is referenced by a budget', async () => {
    const mockDeleteOne = vi.fn().mockResolvedValue(undefined)
    Category.findById.mockResolvedValue({ user: { toString: () => 'user123' }, deleteOne: mockDeleteOne })
    Budget.exists.mockResolvedValue({ _id: 'bud1' })

    await expect(deleteCategory('cat123', 'user123')).rejects.toMatchObject({ status: 409 })
    expect(mockDeleteOne).not.toHaveBeenCalled()
  })

  it('propagates DB errors from findById', async () => {
    Category.findById.mockRejectedValue(new Error('DB error'))

    await expect(deleteCategory('cat123', 'user123')).rejects.toThrow('DB error')
  })
})

describe('updateCategory', () => {
  it('updates name, color, and icon on an owned category', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined)
    const category = { user: { toString: () => 'user123' }, name: 'Old', color: '#000', icon: '🍔', save: mockSave }
    Category.findById.mockResolvedValue(category)

    const result = await updateCategory('cat123', { name: 'New', color: '#fff', icon: '🍕' }, 'user123')

    expect(category.name).toBe('New')
    expect(category.color).toBe('#fff')
    expect(category.icon).toBe('🍕')
    expect(mockSave).toHaveBeenCalled()
    expect(result).toBe(category)
  })

  it('leaves fields untouched when not provided', async () => {
    const category = { user: { toString: () => 'user123' }, name: 'Keep', color: '#abc', save: vi.fn().mockResolvedValue(undefined) }
    Category.findById.mockResolvedValue(category)

    await updateCategory('cat123', { color: '#def' }, 'user123')

    expect(category.name).toBe('Keep')
    expect(category.color).toBe('#def')
  })

  it('throws 404 when the category belongs to another user', async () => {
    Category.findById.mockResolvedValue({ user: { toString: () => 'otherUser' }, save: vi.fn() })

    await expect(updateCategory('cat123', { name: 'X' }, 'user123')).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 when trying to modify a default category', async () => {
    Category.findById.mockResolvedValue({ user: null, isDefault: true, save: vi.fn() })

    await expect(updateCategory('defaultCat', { name: 'X' }, 'user123')).rejects.toMatchObject({ status: 403 })
  })
})
