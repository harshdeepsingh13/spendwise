import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../models/Budget.model.js')
vi.mock('../models/Category.model.js')

import { Budget } from '../models/Budget.model.js'
import { Category } from '../models/Category.model.js'
import { listBudgets, upsertBudget, deleteBudget } from './budget.service.js'

const USER_ID = 'user123'
const CATEGORY_ID = 'cat456'
const BUDGET_ID = 'budget789'

function makeCategory(overrides = {}) {
  return { _id: CATEGORY_ID, name: 'Food', ...overrides }
}

function makeBudget(overrides = {}) {
  return {
    _id: BUDGET_ID,
    user: USER_ID,
    category: CATEGORY_ID,
    effectiveTo: null,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listBudgets', () => {
  it('queries active budgets with correct filter, populate, and sort', async () => {
    const mockBudgets = [makeBudget()]
    const sortMock = vi.fn().mockResolvedValue(mockBudgets)
    const populateMock = vi.fn().mockReturnValue({ sort: sortMock })
    Budget.find.mockReturnValue({ populate: populateMock })

    const result = await listBudgets(USER_ID)

    expect(Budget.find).toHaveBeenCalledWith({ user: USER_ID, effectiveTo: null })
    expect(populateMock).toHaveBeenCalledWith('category')
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 })
    expect(result).toBe(mockBudgets)
  })

  it('propagates DB errors', async () => {
    const sortMock = vi.fn().mockRejectedValue(new Error('DB error'))
    Budget.find.mockReturnValue({ populate: vi.fn().mockReturnValue({ sort: sortMock }) })

    await expect(listBudgets(USER_ID)).rejects.toThrow('DB error')
  })
})

describe('upsertBudget', () => {
  it('throws 404 when category is not found', async () => {
    Category.findOne.mockResolvedValue(null)

    const err = await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 100, effectiveFrom: '2024-01-01' }).catch((e) => e)
    expect(err.message).toBe('Category not found')
    expect(err.status).toBe(404)
  })

  it('throws 400 when amount is not a number', async () => {
    Category.findOne.mockResolvedValue(makeCategory())

    const err = await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 'abc', effectiveFrom: '2024-01-01' }).catch((e) => e)
    expect(err.message).toBe('Amount must be a positive number')
    expect(err.status).toBe(400)
  })

  it('throws 400 when amount is zero', async () => {
    Category.findOne.mockResolvedValue(makeCategory())

    const err = await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 0, effectiveFrom: '2024-01-01' }).catch((e) => e)
    expect(err.message).toBe('Amount must be a positive number')
    expect(err.status).toBe(400)
  })

  it('throws 400 when amount is negative', async () => {
    Category.findOne.mockResolvedValue(makeCategory())

    const err = await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: -50, effectiveFrom: '2024-01-01' }).catch((e) => e)
    expect(err.message).toBe('Amount must be a positive number')
    expect(err.status).toBe(400)
  })

  it('closes the existing budget before creating a new one', async () => {
    Category.findOne.mockResolvedValue(makeCategory())

    const existingBudget = makeBudget()
    Budget.findOne.mockResolvedValue(existingBudget)

    const newBudget = makeBudget({ _id: 'newBudget' })
    Budget.create.mockResolvedValue(newBudget)

    const populatedBudget = { ...newBudget, category: makeCategory() }
    const populateMock = vi.fn().mockResolvedValue(populatedBudget)
    Budget.findById.mockReturnValue({ populate: populateMock })

    await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 100, effectiveFrom: '2024-01-01' })

    expect(existingBudget.effectiveTo).not.toBeNull()
    expect(existingBudget.save).toHaveBeenCalled()
  })

  it('creates new budget with correct fields', async () => {
    Category.findOne.mockResolvedValue(makeCategory())
    Budget.findOne.mockResolvedValue(null)

    const newBudget = makeBudget()
    Budget.create.mockResolvedValue(newBudget)

    const populatedBudget = { ...newBudget, category: makeCategory() }
    const populateMock = vi.fn().mockResolvedValue(populatedBudget)
    Budget.findById.mockReturnValue({ populate: populateMock })

    await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 150, effectiveFrom: '2024-03-01' })

    expect(Budget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: USER_ID,
        category: CATEGORY_ID,
        currency: 'USD',
        effectiveFrom: new Date('2024-03-01'),
      })
    )
  })

  it('returns the populated new budget', async () => {
    Category.findOne.mockResolvedValue(makeCategory())
    Budget.findOne.mockResolvedValue(null)

    const newBudget = makeBudget()
    Budget.create.mockResolvedValue(newBudget)

    const populatedBudget = { ...newBudget, category: makeCategory() }
    const populateMock = vi.fn().mockResolvedValue(populatedBudget)
    Budget.findById.mockReturnValue({ populate: populateMock })

    const result = await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 100, effectiveFrom: '2024-01-01' })

    expect(Budget.findById).toHaveBeenCalledWith(newBudget._id)
    expect(populateMock).toHaveBeenCalledWith('category')
    expect(result).toBe(populatedBudget)
  })

  it('looks up category by userId or isDefault', async () => {
    Category.findOne.mockResolvedValue(makeCategory())
    Budget.findOne.mockResolvedValue(null)
    Budget.create.mockResolvedValue(makeBudget())
    Budget.findById.mockReturnValue({ populate: vi.fn().mockResolvedValue({}) })

    await upsertBudget(USER_ID, { categoryId: CATEGORY_ID, amount: 100, effectiveFrom: '2024-01-01' })

    expect(Category.findOne).toHaveBeenCalledWith({
      _id: CATEGORY_ID,
      $or: [{ user: USER_ID }, { isDefault: true }],
    })
  })
})

describe('deleteBudget', () => {
  it('throws 404 when budget is not found', async () => {
    Budget.findOne.mockResolvedValue(null)

    const err = await deleteBudget(USER_ID, BUDGET_ID).catch((e) => e)
    expect(err.message).toBe('Budget not found')
    expect(err.status).toBe(404)
  })

  it('sets effectiveTo to current date and saves the budget', async () => {
    const budget = makeBudget()
    Budget.findOne.mockResolvedValue(budget)

    const before = new Date()
    await deleteBudget(USER_ID, BUDGET_ID)
    const after = new Date()

    expect(Budget.findOne).toHaveBeenCalledWith({ _id: BUDGET_ID, user: USER_ID })
    expect(budget.effectiveTo).toBeInstanceOf(Date)
    expect(budget.effectiveTo.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(budget.effectiveTo.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(budget.save).toHaveBeenCalled()
  })

  it('propagates save errors', async () => {
    const budget = makeBudget({ save: vi.fn().mockRejectedValue(new Error('Save failed')) })
    Budget.findOne.mockResolvedValue(budget)

    await expect(deleteBudget(USER_ID, BUDGET_ID)).rejects.toThrow('Save failed')
  })
})
