import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../models/Expense.model.js')

// Keep advanceDate real; spy only on the backfill trigger
vi.mock('./recurrence.service.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, generateDueRecurrences: vi.fn().mockResolvedValue(0) }
})

import { Expense } from '../models/Expense.model.js'
import { generateDueRecurrences } from './recurrence.service.js'
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expense.service.js'

const USER_ID = 'user123'
const OTHER_USER_ID = 'other456'
const EXPENSE_ID = 'expense789'

function makeExpense(overrides = {}) {
  return {
    _id: EXPENSE_ID,
    user: { toString: () => USER_ID },
    amount: 50,
    category: 'food',
    date: new Date(),
    save: vi.fn().mockResolvedValue(undefined),
    populate: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listExpenses', () => {
  it('returns expenses for the user sorted by date descending', async () => {
    const mockExpenses = [makeExpense(), makeExpense({ _id: 'expense2' })]
    const mockSort = vi.fn().mockResolvedValue(mockExpenses)
    const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort })
    Expense.find.mockReturnValue({ populate: mockPopulate })

    const result = await listExpenses(USER_ID)

    expect(Expense.find).toHaveBeenCalledWith({ user: USER_ID })
    expect(mockPopulate).toHaveBeenCalledWith('category')
    expect(mockSort).toHaveBeenCalledWith({ date: -1 })
    expect(result).toBe(mockExpenses)
  })

  it('adds $gte when startDate is provided', async () => {
    const mockSort = vi.fn().mockResolvedValue([])
    Expense.find.mockReturnValue({ populate: vi.fn().mockReturnValue({ sort: mockSort }) })

    await listExpenses(USER_ID, { startDate: '2024-01-01' })

    expect(Expense.find).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.objectContaining({ $gte: new Date('2024-01-01') }) })
    )
  })

  it('adds $lte when endDate is provided', async () => {
    const mockSort = vi.fn().mockResolvedValue([])
    Expense.find.mockReturnValue({ populate: vi.fn().mockReturnValue({ sort: mockSort }) })

    await listExpenses(USER_ID, { endDate: '2024-12-31' })

    expect(Expense.find).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.objectContaining({ $lte: new Date('2024-12-31') }) })
    )
  })

  it('adds category filter when categoryId is provided', async () => {
    const mockSort = vi.fn().mockResolvedValue([])
    Expense.find.mockReturnValue({ populate: vi.fn().mockReturnValue({ sort: mockSort }) })

    await listExpenses(USER_ID, { categoryId: 'cat1' })

    expect(Expense.find).toHaveBeenCalledWith(expect.objectContaining({ category: 'cat1' }))
  })

  it('propagates DB errors', async () => {
    const mockSort = vi.fn().mockRejectedValue(new Error('DB error'))
    const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort })
    Expense.find.mockReturnValue({ populate: mockPopulate })

    await expect(listExpenses(USER_ID)).rejects.toThrow('DB error')
  })
})

describe('getExpense', () => {
  it('returns the expense when found and owned by user', async () => {
    const expense = makeExpense()
    const mockPopulate2 = vi.fn().mockResolvedValue(expense)
    const mockPopulate1 = vi.fn().mockReturnValue({ populate: mockPopulate2 })
    Expense.findById.mockReturnValue({ populate: mockPopulate1 })

    const result = await getExpense(EXPENSE_ID, USER_ID)

    expect(Expense.findById).toHaveBeenCalledWith(EXPENSE_ID)
    expect(mockPopulate1).toHaveBeenCalledWith('category')
    expect(mockPopulate2).toHaveBeenCalledWith('receipt')
    expect(result).toBe(expense)
  })

  it('throws 404 when expense is not found', async () => {
    const mockPopulate2 = vi.fn().mockResolvedValue(null)
    const mockPopulate1 = vi.fn().mockReturnValue({ populate: mockPopulate2 })
    Expense.findById.mockReturnValue({ populate: mockPopulate1 })

    const err = await getExpense(EXPENSE_ID, USER_ID).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })

  it('throws 404 when expense belongs to a different user', async () => {
    const expense = makeExpense({ user: { toString: () => OTHER_USER_ID } })
    const mockPopulate2 = vi.fn().mockResolvedValue(expense)
    const mockPopulate1 = vi.fn().mockReturnValue({ populate: mockPopulate2 })
    Expense.findById.mockReturnValue({ populate: mockPopulate1 })

    const err = await getExpense(EXPENSE_ID, USER_ID).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })
})

describe('createExpense', () => {
  it('creates, saves, and populates a new expense', async () => {
    const data = { amount: 100, category: 'food', date: new Date() }
    const mockInstance = makeExpense()
    Expense.mockImplementationOnce(function () { return mockInstance })

    const result = await createExpense(data, USER_ID)

    expect(Expense).toHaveBeenCalledWith({ ...data, user: USER_ID })
    expect(mockInstance.save).toHaveBeenCalled()
    expect(mockInstance.populate).toHaveBeenCalledWith('category')
    expect(result).toBe(mockInstance)
  })

  it('propagates save errors', async () => {
    const mockInstance = makeExpense()
    mockInstance.save = vi.fn().mockRejectedValue(new Error('Validation failed'))
    Expense.mockImplementationOnce(function () { return mockInstance })

    await expect(createExpense({}, USER_ID)).rejects.toThrow('Validation failed')
  })

  it('does not backfill for a non-recurring expense', async () => {
    Expense.mockImplementationOnce(function () { return makeExpense() })
    await createExpense({ amount: 10, category: 'food', date: new Date() }, USER_ID)
    expect(generateDueRecurrences).not.toHaveBeenCalled()
  })

  it('schedules and backfills a past-dated recurring template', async () => {
    const past = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    const mockInstance = makeExpense({ isRecurring: true, frequency: 'monthly', date: past })
    Expense.mockImplementationOnce(function () { return mockInstance })

    await createExpense({ isRecurring: true, frequency: 'monthly', date: past }, USER_ID)

    // nextRunAt = start + 1 month, still in the past → due → backfill runs
    expect(mockInstance.nextRunAt).toBeInstanceOf(Date)
    expect(mockInstance.nextRunAt.getTime()).toBeLessThanOrEqual(Date.now())
    expect(generateDueRecurrences).toHaveBeenCalledWith(USER_ID)
  })

  it('does not backfill a future-dated recurring template', async () => {
    const mockInstance = makeExpense({ isRecurring: true, frequency: 'monthly', date: new Date() })
    Expense.mockImplementationOnce(function () { return mockInstance })

    await createExpense({ isRecurring: true, frequency: 'monthly', date: new Date() }, USER_ID)

    expect(generateDueRecurrences).not.toHaveBeenCalled()
  })
})

describe('updateExpense', () => {
  it('updates and returns the expense when owned by user', async () => {
    const expense = makeExpense()
    Expense.findById.mockResolvedValue(expense)
    const patch = { amount: 200, notes: 'updated' }

    const result = await updateExpense(EXPENSE_ID, USER_ID, patch)

    expect(Expense.findById).toHaveBeenCalledWith(EXPENSE_ID)
    expect(expense.amount).toBe(200)
    expect(expense.notes).toBe('updated')
    expect(expense.save).toHaveBeenCalled()
    expect(expense.populate).toHaveBeenCalledWith('category')
    expect(result).toBe(expense)
  })

  it('throws 404 when expense is not found', async () => {
    Expense.findById.mockResolvedValue(null)

    const err = await updateExpense(EXPENSE_ID, USER_ID, {}).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })

  it('throws 404 when expense belongs to a different user', async () => {
    const expense = makeExpense({ user: { toString: () => OTHER_USER_ID } })
    Expense.findById.mockResolvedValue(expense)

    const err = await updateExpense(EXPENSE_ID, USER_ID, {}).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })
})

describe('deleteExpense', () => {
  it('deletes the expense when owned by user', async () => {
    const expense = makeExpense()
    Expense.findById.mockResolvedValue(expense)

    await deleteExpense(EXPENSE_ID, USER_ID)

    expect(Expense.findById).toHaveBeenCalledWith(EXPENSE_ID)
    expect(expense.deleteOne).toHaveBeenCalled()
  })

  it('throws 404 when expense is not found', async () => {
    Expense.findById.mockResolvedValue(null)

    const err = await deleteExpense(EXPENSE_ID, USER_ID).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })

  it('throws 404 when expense belongs to a different user', async () => {
    const expense = makeExpense({ user: { toString: () => OTHER_USER_ID } })
    Expense.findById.mockResolvedValue(expense)

    const err = await deleteExpense(EXPENSE_ID, USER_ID).catch((e) => e)
    expect(err.message).toBe('Expense not found')
    expect(err.status).toBe(404)
  })
})
