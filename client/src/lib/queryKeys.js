export const queryKeys = {
  auth: {
    all: ['auth'],
    me: ['auth', 'me']
  },
  expenses: {
    all: ['expenses'],
    list: (filters) => ['expenses', filters],
    detail: (id) => ['expenses', id]
  },
  categories: {
    all: ['categories']
  },
  receipts: {
    all: ['receipts'],
    list: (params) => ['receipts', 'list', params],
    detail: (id) => ['receipts', id],
    ocrStatus: (id) => ['receipts', id, 'ocr-status']
  },
  analytics: {
    all: ['analytics'],
    dashboard: ['analytics', 'dashboard'],
    monthly: (year, month) => ['analytics', 'monthly', year, month],
    yearly: (year) => ['analytics', 'yearly', year],
    summary: (startDate, endDate, groupBy) => ['analytics', 'summary', startDate, endDate, groupBy],
    kpi: (year, month) => ['analytics', 'kpi', year, month],
    budgetVsActual: (year, month) => ['analytics', 'budgetVsActual', year, month]
  },
  budgets: {
    all: ['budgets'],
    list: ['budgets', 'list']
  }
}
