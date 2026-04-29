import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as budgetService from '../services/budget.service.js'
import { listBudgets, createBudget, updateBudget, deleteBudget } from './budget.controller.js'

vi.mock('../services/budget.service.js')

const makeReqResMocks = (overrides = {}) => {
  const req = {
    user: { _id: 'user123' },
    body: {},
    params: {},
    query: {},
    ...overrides
  }
  const res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn()
  }
  const next = vi.fn()
  return { req, res, next }
}

beforeEach(() => vi.clearAllMocks())

describe('listBudgets', () => {
  it('returns budgets as json', async () => {
    const mockBudgets = [{ _id: 'b1', amount: '100' }]
    budgetService.listBudgets.mockResolvedValue(mockBudgets)

    const { req, res, next } = makeReqResMocks()
    await listBudgets(req, res, next)

    expect(budgetService.listBudgets).toHaveBeenCalledWith('user123')
    expect(res.json).toHaveBeenCalledWith(mockBudgets)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with error on service failure', async () => {
    const err = new Error('DB error')
    budgetService.listBudgets.mockRejectedValue(err)

    const { req, res, next } = makeReqResMocks()
    await listBudgets(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('createBudget', () => {
  it('returns 201 with created budget', async () => {
    const mockBudget = { _id: 'b2', amount: '200' }
    budgetService.upsertBudget.mockResolvedValue(mockBudget)

    const { req, res, next } = makeReqResMocks({
      body: { categoryId: 'cat1', amount: 200, effectiveFrom: '2024-01-01' }
    })
    await createBudget(req, res, next)

    expect(budgetService.upsertBudget).toHaveBeenCalledWith('user123', req.body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(mockBudget)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 error when category not found', async () => {
    const err = Object.assign(new Error('Category not found'), { status: 404 })
    budgetService.upsertBudget.mockRejectedValue(err)

    const { req, res, next } = makeReqResMocks({
      body: { categoryId: 'missing', amount: 100, effectiveFrom: '2024-01-01' }
    })
    await createBudget(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('updateBudget', () => {
  it('returns updated budget as json', async () => {
    const mockBudget = { _id: 'b3', amount: '300' }
    budgetService.upsertBudget.mockResolvedValue(mockBudget)

    const { req, res, next } = makeReqResMocks({
      body: { categoryId: 'cat2', amount: 300, effectiveFrom: '2024-06-01', extraField: 'ignored' }
    })
    await updateBudget(req, res, next)

    expect(budgetService.upsertBudget).toHaveBeenCalledWith('user123', {
      categoryId: 'cat2',
      amount: 300,
      effectiveFrom: '2024-06-01'
    })
    expect(res.json).toHaveBeenCalledWith(mockBudget)
    expect(next).not.toHaveBeenCalled()
  })

  it('only passes categoryId, amount, effectiveFrom to service (strips extra fields)', async () => {
    budgetService.upsertBudget.mockResolvedValue({})

    const { req, res, next } = makeReqResMocks({
      body: { categoryId: 'cat3', amount: 50, effectiveFrom: '2024-01-15', user: 'hacked' }
    })
    await updateBudget(req, res, next)

    const callArg = budgetService.upsertBudget.mock.calls[0][1]
    expect(callArg).not.toHaveProperty('user')
    expect(Object.keys(callArg)).toEqual(['categoryId', 'amount', 'effectiveFrom'])
  })

  it('calls next with error on service failure', async () => {
    const err = Object.assign(new Error('Amount must be a positive number'), { status: 400 })
    budgetService.upsertBudget.mockRejectedValue(err)

    const { req, res, next } = makeReqResMocks({
      body: { categoryId: 'cat2', amount: -5, effectiveFrom: '2024-06-01' }
    })
    await updateBudget(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
  })
})

describe('deleteBudget', () => {
  it('responds with 204 on successful deletion', async () => {
    budgetService.deleteBudget.mockResolvedValue(undefined)

    const { req, res, next } = makeReqResMocks({ params: { id: 'b4' } })
    await deleteBudget(req, res, next)

    expect(budgetService.deleteBudget).toHaveBeenCalledWith('user123', 'b4')
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.send).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next with 404 error when budget not found', async () => {
    const err = Object.assign(new Error('Budget not found'), { status: 404 })
    budgetService.deleteBudget.mockRejectedValue(err)

    const { req, res, next } = makeReqResMocks({ params: { id: 'missing' } })
    await deleteBudget(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})
