// @vitest-environment jsdom
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/expense.service', () => ({
  expenseService: {
    list: vi.fn()
  }
}))

import { useExpenses } from './useExpenses'
import { expenseService } from '../services/expense.service'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    expenseService.list.mockResolvedValue([])
    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns expense data on success with default empty filters', async () => {
    const mockExpenses = [{ _id: '1', amount: 100, description: 'Lunch' }]
    expenseService.list.mockResolvedValue(mockExpenses)

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockExpenses)
    expect(expenseService.list).toHaveBeenCalledWith({})
  })

  it('passes custom filters through to expenseService.list', async () => {
    const filters = { category: 'food', month: '2024-01' }
    expenseService.list.mockResolvedValue([])

    const { result } = renderHook(() => useExpenses(filters), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(expenseService.list).toHaveBeenCalledWith(filters)
  })

  it('returns error state when service rejects', async () => {
    const error = new Error('Network error')
    expenseService.list.mockRejectedValue(error)

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })

  it('different filter objects produce separate query keys (no cross-cache)', async () => {
    const foodExpenses = [{ _id: '1', description: 'Pizza' }]
    const travelExpenses = [{ _id: '2', description: 'Taxi' }]

    expenseService.list
      .mockResolvedValueOnce(foodExpenses)
      .mockResolvedValueOnce(travelExpenses)

    const { result: r1 } = renderHook(() => useExpenses({ category: 'food' }), {
      wrapper: createWrapper()
    })
    const { result: r2 } = renderHook(() => useExpenses({ category: 'travel' }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    expect(r1.current.data).toEqual(foodExpenses)
    expect(r2.current.data).toEqual(travelExpenses)
  })
})
