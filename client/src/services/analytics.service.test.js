import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyticsService } from './analytics.service.js'

vi.mock('../lib/axios.js', () => ({
  api: {
    get: vi.fn()
  }
}))

import { api } from '../lib/axios.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('analyticsService.getDashboard', () => {
  it('calls GET /analytics/dashboard and returns response data', async () => {
    const mockData = { totalExpenses: 500, monthOverMonth: 10 }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getDashboard()

    expect(api.get).toHaveBeenCalledWith('/analytics/dashboard')
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Network error'))
    await expect(analyticsService.getDashboard()).rejects.toThrow('Network error')
  })
})

describe('analyticsService.getMonthly', () => {
  it('calls GET /analytics/monthly with year and month params', async () => {
    const mockData = { expenses: [], total: 0 }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getMonthly(2024, 3)

    expect(api.get).toHaveBeenCalledWith('/analytics/monthly', { params: { year: 2024, month: 3 } })
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(analyticsService.getMonthly(2024, 3)).rejects.toThrow('Server error')
  })
})

describe('analyticsService.getYearly', () => {
  it('calls GET /analytics/yearly with year param', async () => {
    const mockData = { months: [], total: 1200 }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getYearly(2024)

    expect(api.get).toHaveBeenCalledWith('/analytics/yearly', { params: { year: 2024 } })
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(analyticsService.getYearly(2024)).rejects.toThrow('Server error')
  })
})

describe('analyticsService.getSummary', () => {
  it('calls GET /analytics/summary with startDate, endDate, and default groupBy=category', async () => {
    const mockData = { summary: [] }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getSummary('2024-01-01', '2024-03-31')

    expect(api.get).toHaveBeenCalledWith('/analytics/summary', {
      params: { startDate: '2024-01-01', endDate: '2024-03-31', groupBy: 'category' }
    })
    expect(result).toEqual(mockData)
  })

  it('calls GET /analytics/summary with explicit groupBy param', async () => {
    const mockData = { summary: [] }
    api.get.mockResolvedValue({ data: mockData })

    await analyticsService.getSummary('2024-01-01', '2024-03-31', 'month')

    expect(api.get).toHaveBeenCalledWith('/analytics/summary', {
      params: { startDate: '2024-01-01', endDate: '2024-03-31', groupBy: 'month' }
    })
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(analyticsService.getSummary('2024-01-01', '2024-03-31')).rejects.toThrow('Server error')
  })
})

describe('analyticsService.getKpi', () => {
  it('calls GET /analytics/kpi with year and month params', async () => {
    const mockData = { avgDailySpend: 25, topCategory: 'Food' }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getKpi(2024, 5)

    expect(api.get).toHaveBeenCalledWith('/analytics/kpi', { params: { year: 2024, month: 5 } })
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(analyticsService.getKpi(2024, 5)).rejects.toThrow('Server error')
  })
})

describe('analyticsService.getBudgetVsActual', () => {
  it('calls GET /analytics/budget-vs-actual with year and month params', async () => {
    const mockData = { budget: 1000, actual: 750 }
    api.get.mockResolvedValue({ data: mockData })

    const result = await analyticsService.getBudgetVsActual(2024, 5)

    expect(api.get).toHaveBeenCalledWith('/analytics/budget-vs-actual', { params: { year: 2024, month: 5 } })
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(analyticsService.getBudgetVsActual(2024, 5)).rejects.toThrow('Server error')
  })
})
