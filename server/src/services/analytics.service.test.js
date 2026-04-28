import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getDashboardData, getMonthlyData, getYearlyData } from './analytics.service.js'
import { Expense } from '../models/Expense.model.js'

vi.mock('../models/Expense.model.js', () => ({
  Expense: {
    aggregate: vi.fn(),
    find: vi.fn(),
  },
}))

const makeChainableFindMock = (resolvedValue) => {
  const chain = {
    populate: vi.fn(),
    sort: vi.fn(),
    limit: vi.fn(),
  }
  chain.populate.mockReturnValue(chain)
  chain.sort.mockReturnValue(chain)
  chain.limit.mockResolvedValue(resolvedValue)
  return chain
}

describe('getDashboardData', () => {
  const userId = 'user123'

  const byCategory = [
    { _id: 'cat1', total: 150, categoryInfo: [{ name: 'Food' }] },
    { _id: 'cat2', total: 50, categoryInfo: [{ name: 'Transport' }] },
  ]
  const lastMonthAgg = [{ _id: null, total: 100 }]
  const recentExpenses = [{ _id: 'e1', amount: 50 }, { _id: 'e2', amount: 30 }]

  beforeEach(() => {
    vi.clearAllMocks()
    Expense.aggregate
      .mockResolvedValueOnce(byCategory)
      .mockResolvedValueOnce(lastMonthAgg)
    Expense.find.mockReturnValue(makeChainableFindMock(recentExpenses))
  })

  it('returns correct shape', async () => {
    const result = await getDashboardData(userId)
    expect(result).toEqual({
      currentMonth: 200,
      lastMonth: 100,
      momPercent: 100,
      byCategory,
      recent: recentExpenses,
    })
  })

  it('calculates MoM percent correctly', async () => {
    const result = await getDashboardData(userId)
    // (200 - 100) / 100 * 100 = 100%
    expect(result.momPercent).toBe(100)
  })

  it('returns momPercent 0 when lastMonth total is 0', async () => {
    Expense.aggregate
      .mockReset()
      .mockResolvedValueOnce([{ _id: 'cat1', total: 80 }])
      .mockResolvedValueOnce([{ _id: null, total: 0 }])
    Expense.find.mockReturnValue(makeChainableFindMock([]))

    const result = await getDashboardData(userId)
    expect(result.momPercent).toBe(0)
  })

  it('returns momPercent 0 when lastMonth aggregate is empty', async () => {
    Expense.aggregate
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    Expense.find.mockReturnValue(makeChainableFindMock([]))

    const result = await getDashboardData(userId)
    expect(result.currentMonth).toBe(0)
    expect(result.lastMonth).toBe(0)
    expect(result.momPercent).toBe(0)
  })

  it('sums byCategory totals for currentMonth', async () => {
    const result = await getDashboardData(userId)
    expect(result.currentMonth).toBe(200)
  })

  it('calls Expense.aggregate twice and Expense.find once', async () => {
    await getDashboardData(userId)
    expect(Expense.aggregate).toHaveBeenCalledTimes(2)
    expect(Expense.find).toHaveBeenCalledTimes(1)
  })

  it('fetches recent expenses limited to 5 sorted by date desc', async () => {
    const findChain = makeChainableFindMock(recentExpenses)
    Expense.find.mockReturnValue(findChain)

    await getDashboardData(userId)

    expect(Expense.find).toHaveBeenCalledWith({ user: userId })
    expect(findChain.sort).toHaveBeenCalledWith({ date: -1 })
    expect(findChain.limit).toHaveBeenCalledWith(5)
  })

  it('calculates negative MoM percent when current < last', async () => {
    Expense.aggregate
      .mockReset()
      .mockResolvedValueOnce([{ _id: 'cat1', total: 50 }])
      .mockResolvedValueOnce([{ _id: null, total: 100 }])
    Expense.find.mockReturnValue(makeChainableFindMock([]))

    const result = await getDashboardData(userId)
    // (50 - 100) / 100 * 100 = -50%
    expect(result.momPercent).toBe(-50)
  })

  it('propagates aggregate errors', async () => {
    Expense.aggregate.mockReset().mockRejectedValue(new Error('DB failure'))

    await expect(getDashboardData(userId)).rejects.toThrow('DB failure')
  })

  it('passes userId in both aggregate match stages', async () => {
    await getDashboardData(userId)
    const [firstCall, secondCall] = Expense.aggregate.mock.calls
    expect(firstCall[0][0].$match.user).toBe(userId)
    expect(secondCall[0][0].$match.user).toBe(userId)
  })
})

describe('getMonthlyData', () => {
  const userId = 'user456'
  const mockExpenses = [
    { _id: { category: 'cat1', day: 5 }, total: 60, categoryInfo: [{ name: 'Food' }] },
    { _id: { category: 'cat2', day: 12 }, total: 30, categoryInfo: [{ name: 'Transport' }] },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    Expense.aggregate.mockResolvedValue(mockExpenses)
  })

  it('returns expenses, year, and month', async () => {
    const result = await getMonthlyData(userId, { year: 2025, month: 3 })
    expect(result).toEqual({ expenses: mockExpenses, year: 2025, month: 3 })
  })

  it('calls Expense.aggregate once', async () => {
    await getMonthlyData(userId, { year: 2025, month: 3 })
    expect(Expense.aggregate).toHaveBeenCalledTimes(1)
  })

  it('passes correct date range matching March 2025', async () => {
    await getMonthlyData(userId, { year: 2025, month: 3 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    const matchStage = pipeline[0].$match
    expect(matchStage.date.$gte).toEqual(new Date(2025, 2, 1))
    expect(matchStage.date.$lte).toEqual(new Date(2025, 3, 0, 23, 59, 59))
  })

  it('handles December correctly (month 12)', async () => {
    await getMonthlyData(userId, { year: 2025, month: 12 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    const matchStage = pipeline[0].$match
    expect(matchStage.date.$gte).toEqual(new Date(2025, 11, 1))
    expect(matchStage.date.$lte).toEqual(new Date(2025, 12, 0, 23, 59, 59))
  })

  it('passes userId in aggregate match stage', async () => {
    await getMonthlyData(userId, { year: 2025, month: 6 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    expect(pipeline[0].$match.user).toBe(userId)
  })

  it('propagates aggregate errors', async () => {
    Expense.aggregate.mockRejectedValue(new Error('DB failure'))
    await expect(getMonthlyData(userId, { year: 2025, month: 1 })).rejects.toThrow('DB failure')
  })
})

describe('getYearlyData', () => {
  const userId = 'user789'
  const mockExpenses = [
    { _id: { month: 1, category: 'cat1' }, total: 300, categoryInfo: [{ name: 'Food' }] },
    { _id: { month: 2, category: 'cat1' }, total: 150, categoryInfo: [{ name: 'Food' }] },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    Expense.aggregate.mockResolvedValue(mockExpenses)
  })

  it('returns expenses and year', async () => {
    const result = await getYearlyData(userId, { year: 2025 })
    expect(result).toEqual({ expenses: mockExpenses, year: 2025 })
  })

  it('calls Expense.aggregate once', async () => {
    await getYearlyData(userId, { year: 2025 })
    expect(Expense.aggregate).toHaveBeenCalledTimes(1)
  })

  it('passes correct date range for full year 2025', async () => {
    await getYearlyData(userId, { year: 2025 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    const matchStage = pipeline[0].$match
    expect(matchStage.date.$gte).toEqual(new Date(2025, 0, 1))
    expect(matchStage.date.$lte).toEqual(new Date(2025, 11, 31, 23, 59, 59))
  })

  it('groups by month and category', async () => {
    await getYearlyData(userId, { year: 2025 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    const groupStage = pipeline[1].$group
    expect(groupStage._id).toMatchObject({ month: { $month: '$date' }, category: '$category' })
  })

  it('passes userId in aggregate match stage', async () => {
    await getYearlyData(userId, { year: 2025 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    expect(pipeline[0].$match.user).toBe(userId)
  })

  it('propagates aggregate errors', async () => {
    Expense.aggregate.mockRejectedValue(new Error('DB failure'))
    await expect(getYearlyData(userId, { year: 2025 })).rejects.toThrow('DB failure')
  })

  it('includes a lookup stage for category info', async () => {
    await getYearlyData(userId, { year: 2025 })
    const pipeline = Expense.aggregate.mock.calls[0][0]
    const lookupStage = pipeline[2].$lookup
    expect(lookupStage.from).toBe('categories')
    expect(lookupStage.as).toBe('categoryInfo')
  })
})
