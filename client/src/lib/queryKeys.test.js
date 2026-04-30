import { describe, it, expect } from 'vitest'
import { queryKeys } from './queryKeys.js'

describe('queryKeys.auth', () => {
  it('all is a static array', () => {
    expect(queryKeys.auth.all).toEqual(['auth'])
  })

  it('me is a static array', () => {
    expect(queryKeys.auth.me).toEqual(['auth', 'me'])
  })
})

describe('queryKeys.expenses', () => {
  it('all is a static array', () => {
    expect(queryKeys.expenses.all).toEqual(['expenses'])
  })

  it('list includes filters', () => {
    const filters = { category: 'food', month: '2025-01' }
    expect(queryKeys.expenses.list(filters)).toEqual(['expenses', filters])
  })

  it('list with undefined filters', () => {
    expect(queryKeys.expenses.list(undefined)).toEqual(['expenses', undefined])
  })

  it('detail includes id', () => {
    expect(queryKeys.expenses.detail('abc123')).toEqual(['expenses', 'abc123'])
  })
})

describe('queryKeys.categories', () => {
  it('all is a static array', () => {
    expect(queryKeys.categories.all).toEqual(['categories'])
  })
})

describe('queryKeys.receipts', () => {
  it('all is a static array', () => {
    expect(queryKeys.receipts.all).toEqual(['receipts'])
  })

  it('list includes params', () => {
    const params = { page: 1 }
    expect(queryKeys.receipts.list(params)).toEqual(['receipts', 'list', params])
  })

  it('list with no params', () => {
    expect(queryKeys.receipts.list(undefined)).toEqual(['receipts', 'list', undefined])
  })

  it('detail includes id', () => {
    expect(queryKeys.receipts.detail('r1')).toEqual(['receipts', 'r1'])
  })

  it('ocrStatus includes id and suffix', () => {
    expect(queryKeys.receipts.ocrStatus('r1')).toEqual(['receipts', 'r1', 'ocr-status'])
  })
})

describe('queryKeys.analytics', () => {
  it('all is a static array', () => {
    expect(queryKeys.analytics.all).toEqual(['analytics'])
  })

  it('dashboard is a static array', () => {
    expect(queryKeys.analytics.dashboard).toEqual(['analytics', 'dashboard'])
  })

  it('monthly includes year and month', () => {
    expect(queryKeys.analytics.monthly(2025, 3)).toEqual(['analytics', 'monthly', 2025, 3])
  })

  it('yearly includes year', () => {
    expect(queryKeys.analytics.yearly(2025)).toEqual(['analytics', 'yearly', 2025])
  })

  it('summary includes startDate, endDate, and groupBy', () => {
    expect(queryKeys.analytics.summary('2025-01-01', '2025-01-31', 'month')).toEqual([
      'analytics', 'summary', '2025-01-01', '2025-01-31', 'month'
    ])
  })

  it('summary with undefined args', () => {
    expect(queryKeys.analytics.summary(undefined, undefined, undefined)).toEqual([
      'analytics', 'summary', undefined, undefined, undefined
    ])
  })

  it('kpi includes year and month', () => {
    expect(queryKeys.analytics.kpi(2025, 4)).toEqual(['analytics', 'kpi', 2025, 4])
  })

  it('budgetVsActual includes year and month', () => {
    expect(queryKeys.analytics.budgetVsActual(2025, 4)).toEqual(['analytics', 'budgetVsActual', 2025, 4])
  })
})

describe('queryKeys.budgets', () => {
  it('all is a static array', () => {
    expect(queryKeys.budgets.all).toEqual(['budgets'])
  })

  it('list is a static array', () => {
    expect(queryKeys.budgets.list).toEqual(['budgets', 'list'])
  })
})

describe('queryKeys cache invalidation compatibility', () => {
  it('expenses.list key starts with expenses.all[0]', () => {
    const allKey = queryKeys.expenses.all[0]
    const listKey = queryKeys.expenses.list({ cat: 'x' })
    expect(listKey[0]).toBe(allKey)
  })

  it('expenses.detail key starts with expenses.all[0]', () => {
    expect(queryKeys.expenses.detail('id')[0]).toBe(queryKeys.expenses.all[0])
  })

  it('receipts.list key starts with receipts.all[0]', () => {
    expect(queryKeys.receipts.list({})[0]).toBe(queryKeys.receipts.all[0])
  })

  it('receipts.detail key starts with receipts.all[0]', () => {
    expect(queryKeys.receipts.detail('id')[0]).toBe(queryKeys.receipts.all[0])
  })

  it('receipts.ocrStatus key starts with receipts.all[0]', () => {
    expect(queryKeys.receipts.ocrStatus('id')[0]).toBe(queryKeys.receipts.all[0])
  })

  it('analytics.monthly key starts with analytics.all[0]', () => {
    expect(queryKeys.analytics.monthly(2025, 1)[0]).toBe(queryKeys.analytics.all[0])
  })

  it('analytics.yearly key starts with analytics.all[0]', () => {
    expect(queryKeys.analytics.yearly(2025)[0]).toBe(queryKeys.analytics.all[0])
  })

  it('analytics.summary key starts with analytics.all[0]', () => {
    expect(queryKeys.analytics.summary('2025-01-01', '2025-01-31', 'month')[0]).toBe(queryKeys.analytics.all[0])
  })

  it('analytics.kpi key starts with analytics.all[0]', () => {
    expect(queryKeys.analytics.kpi(2025, 1)[0]).toBe(queryKeys.analytics.all[0])
  })

  it('analytics.budgetVsActual key starts with analytics.all[0]', () => {
    expect(queryKeys.analytics.budgetVsActual(2025, 1)[0]).toBe(queryKeys.analytics.all[0])
  })

  it('budgets.list key starts with budgets.all[0]', () => {
    expect(queryKeys.budgets.list[0]).toBe(queryKeys.budgets.all[0])
  })
})
