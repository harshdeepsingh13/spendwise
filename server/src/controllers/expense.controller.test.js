import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expense.controller.js'

vi.mock('../services/expense.service.js', () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

import * as expenseService from '../services/expense.service.js'

const makeCategory = (overrides = {}) => ({
  _id: 'cat1',
  name: 'Food',
  icon: '🍕',
  color: '#FF5733',
  ...overrides
})

const makeMockExpense = (overrides = {}) => ({
  _id: 'e1',
  amount: { toString: () => '42.50' },
  currency: 'USD',
  category: makeCategory(),
  date: new Date('2024-01-15'),
  notes: 'Lunch',
  createdAt: new Date('2024-01-15'),
  ...overrides
})

const serialized = (e) => ({
  id: e._id,
  amount: e.amount ? e.amount.toString() : null,
  currency: e.currency || 'USD',
  category: e.category
    ? { id: e.category._id, name: e.category.name, icon: e.category.icon || null, color: e.category.color || null }
    : null,
  date: e.date,
  notes: e.notes || null,
  receiptId: e.receipt ? e.receipt.toString() : null,
  isRecurring: Boolean(e.isRecurring),
  frequency: e.frequency || null,
  interval: e.interval || null,
  recurrenceEndDate: e.recurrenceEndDate || null,
  createdAt: e.createdAt
})

function makeReqResNext(overrides = {}) {
  const req = {
    user: { _id: 'user123' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  }
  const res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  }
  const next = vi.fn()
  return { req, res, next }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listExpenses', () => {
  it('returns serialized expenses for the authenticated user', async () => {
    const expense = makeMockExpense()
    expenseService.listExpenses.mockResolvedValue([expense])

    const { req, res, next } = makeReqResNext()
    await listExpenses(req, res, next)

    expect(expenseService.listExpenses).toHaveBeenCalledWith('user123', { startDate: undefined, endDate: undefined, categoryId: undefined })
    expect(res.json).toHaveBeenCalledWith([serialized(expense)])
    expect(next).not.toHaveBeenCalled()
  })

  it('passes date and category query params to service', async () => {
    expenseService.listExpenses.mockResolvedValue([])
    const { req, res, next } = makeReqResNext({ query: { startDate: '2024-01-01', endDate: '2024-01-31', categoryId: 'cat1' } })

    await listExpenses(req, res, next)

    expect(expenseService.listExpenses).toHaveBeenCalledWith('user123', { startDate: '2024-01-01', endDate: '2024-01-31', categoryId: 'cat1' })
  })

  it('serializes null amount as null', async () => {
    const expense = makeMockExpense({ amount: null })
    expenseService.listExpenses.mockResolvedValue([expense])

    const { req, res, next } = makeReqResNext()
    await listExpenses(req, res, next)

    const [result] = res.json.mock.calls[0][0]
    expect(result.amount).toBeNull()
  })

  it('serializes null category as null', async () => {
    const expense = makeMockExpense({ category: null })
    expenseService.listExpenses.mockResolvedValue([expense])

    const { req, res, next } = makeReqResNext()
    await listExpenses(req, res, next)

    const [result] = res.json.mock.calls[0][0]
    expect(result.category).toBeNull()
  })

  it('serializes a linked receipt id to a string', async () => {
    const expense = makeMockExpense({ receipt: { toString: () => 'r99' } })
    expenseService.listExpenses.mockResolvedValue([expense])

    const { req, res, next } = makeReqResNext()
    await listExpenses(req, res, next)

    const [result] = res.json.mock.calls[0][0]
    expect(result.receiptId).toBe('r99')
  })

  it('calls next(err) on service error', async () => {
    const err = new Error('DB error')
    expenseService.listExpenses.mockRejectedValue(err)

    const { req, res, next } = makeReqResNext()
    await listExpenses(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('getExpense', () => {
  it('returns a serialized expense on success', async () => {
    const expense = makeMockExpense()
    expenseService.getExpense.mockResolvedValue(expense)

    const { req, res, next } = makeReqResNext({ params: { id: 'e1' } })
    await getExpense(req, res, next)

    expect(expenseService.getExpense).toHaveBeenCalledWith('e1', 'user123')
    expect(res.json).toHaveBeenCalledWith(serialized(expense))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 error when expense not found', async () => {
    const err = Object.assign(new Error('Expense not found'), { status: 404 })
    expenseService.getExpense.mockRejectedValue(err)

    const { req, res, next } = makeReqResNext({ params: { id: 'missing' } })
    await getExpense(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('createExpense', () => {
  it('creates an expense and responds with 201 + serialized JSON', async () => {
    const body = { amount: '50.00', category: 'cat1', date: '2024-01-15', notes: 'Lunch' }
    const expense = makeMockExpense()
    expenseService.createExpense.mockResolvedValue(expense)

    const { req, res, next } = makeReqResNext({ body })
    await createExpense(req, res, next)

    expect(expenseService.createExpense).toHaveBeenCalledWith(body, 'user123')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(serialized(expense))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with error when service throws', async () => {
    const err = new Error('Validation error')
    expenseService.createExpense.mockRejectedValue(err)

    const { req, res, next } = makeReqResNext({ body: { amount: -1 } })
    await createExpense(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('updateExpense', () => {
  it('updates an expense and responds with serialized JSON on success', async () => {
    const body = { amount: '75.00' }
    const expense = makeMockExpense({ amount: { toString: () => '75.00' } })
    expenseService.updateExpense.mockResolvedValue(expense)

    const { req, res, next } = makeReqResNext({ params: { id: 'e3' }, body })
    await updateExpense(req, res, next)

    expect(expenseService.updateExpense).toHaveBeenCalledWith('e3', 'user123', body)
    expect(res.json).toHaveBeenCalledWith(serialized(expense))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 error when expense not found', async () => {
    const err = Object.assign(new Error('Expense not found'), { status: 404 })
    expenseService.updateExpense.mockRejectedValue(err)

    const { req, res, next } = makeReqResNext({ params: { id: 'missing' }, body: { amount: '10.00' } })
    await updateExpense(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('deleteExpense', () => {
  it('deletes an expense and responds with success message', async () => {
    expenseService.deleteExpense.mockResolvedValue(undefined)

    const { req, res, next } = makeReqResNext({ params: { id: 'e4' } })
    await deleteExpense(req, res, next)

    expect(expenseService.deleteExpense).toHaveBeenCalledWith('e4', 'user123')
    expect(res.json).toHaveBeenCalledWith({ message: 'Expense deleted' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 error when expense not found', async () => {
    const err = Object.assign(new Error('Expense not found'), { status: 404 })
    expenseService.deleteExpense.mockRejectedValue(err)

    const { req, res, next } = makeReqResNext({ params: { id: 'missing' } })
    await deleteExpense(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})
