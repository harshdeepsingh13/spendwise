import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDashboard,
  getMonthly,
  getYearly,
  getSummary,
  getKpi,
  getBudgetVsActual,
} from './analytics.controller.js'

vi.mock('../services/analytics.service.js', () => ({
  getDashboardData: vi.fn(),
  getMonthlyData: vi.fn(),
  getYearlyData: vi.fn(),
  getSummary: vi.fn(),
  getKpiData: vi.fn(),
  getBudgetVsActual: vi.fn(),
}))

import * as analyticsService from '../services/analytics.service.js'

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

describe('getDashboard', () => {
  it('calls getDashboardData with userId and responds with result', async () => {
    const data = {
      currentMonth: 500,
      lastMonth: 400,
      momPercent: 25,
      byCategory: [],
      recent: [],
    }
    analyticsService.getDashboardData.mockResolvedValue(data)

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await getDashboard(req, res, next)

    expect(analyticsService.getDashboardData).toHaveBeenCalledWith('user123')
    expect(res.json).toHaveBeenCalledWith(data)
    expect(next).not.toHaveBeenCalled()
  })

  it('serializes each recent expense before responding', async () => {
    const data = {
      currentMonth: 500,
      byCategory: [],
      recent: [
        { _id: 'exp1', amount: { toString: () => '12.50' }, date: new Date('2026-05-01') },
      ],
    }
    analyticsService.getDashboardData.mockResolvedValue(data)

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await getDashboard(req, res, next)

    const payload = res.json.mock.calls[0][0]
    expect(payload.recent).toEqual([
      expect.objectContaining({ id: 'exp1', amount: '12.50', currency: 'USD', category: null }),
    ])
    expect(payload.currentMonth).toBe(500)
  })

  it('defaults recent to an empty array when service omits it', async () => {
    analyticsService.getDashboardData.mockResolvedValue({ currentMonth: 0 })

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await getDashboard(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ currentMonth: 0, recent: [] })
  })

  it('passes error to next on service failure', async () => {
    const err = new Error('DB error')
    analyticsService.getDashboardData.mockRejectedValue(err)

    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await getDashboard(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('getMonthly', () => {
  it('calls getMonthlyData with userId and query, responds with result', async () => {
    const data = { expenses: [], year: '2026', month: '5' }
    analyticsService.getMonthlyData.mockResolvedValue(data)

    const req = makeReq({ query: { year: '2026', month: '5' } })
    const res = makeRes()
    const next = vi.fn()

    await getMonthly(req, res, next)

    expect(analyticsService.getMonthlyData).toHaveBeenCalledWith('user123', { year: '2026', month: '5' })
    expect(res.json).toHaveBeenCalledWith(data)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next on service failure', async () => {
    const err = new Error('Aggregation failed')
    analyticsService.getMonthlyData.mockRejectedValue(err)

    const req = makeReq({ query: { year: '2026', month: '5' } })
    const res = makeRes()
    const next = vi.fn()

    await getMonthly(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('getYearly', () => {
  it('calls getYearlyData with userId and query, responds with result', async () => {
    const data = { expenses: [], year: '2026' }
    analyticsService.getYearlyData.mockResolvedValue(data)

    const req = makeReq({ query: { year: '2026' } })
    const res = makeRes()
    const next = vi.fn()

    await getYearly(req, res, next)

    expect(analyticsService.getYearlyData).toHaveBeenCalledWith('user123', { year: '2026' })
    expect(res.json).toHaveBeenCalledWith(data)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes error to next on service failure', async () => {
    const err = new Error('Yearly aggregation failed')
    analyticsService.getYearlyData.mockRejectedValue(err)

    const req = makeReq({ query: { year: '2026' } })
    const res = makeRes()
    const next = vi.fn()

    await getYearly(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})
