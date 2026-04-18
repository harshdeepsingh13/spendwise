import { api } from '../lib/axios.js'

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard')
    return response.data
  },

  getMonthly: async (year, month) => {
    const response = await api.get('/analytics/monthly', {
      params: { year, month }
    })
    return response.data
  },

  getYearly: async (year) => {
    const response = await api.get('/analytics/yearly', {
      params: { year }
    })
    return response.data
  },

  getSummary: async (startDate, endDate, groupBy = 'category') => {
    const response = await api.get('/analytics/summary', {
      params: { startDate, endDate, groupBy }
    })
    return response.data
  },

  getKpi: async (year, month) => {
    const response = await api.get('/analytics/kpi', {
      params: { year, month }
    })
    return response.data
  },

  getBudgetVsActual: async (year, month) => {
    const response = await api.get('/analytics/budget-vs-actual', {
      params: { year, month }
    })
    return response.data
  }
}
