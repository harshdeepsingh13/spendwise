// @vitest-environment jsdom
import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/receipt.service', () => ({
  receiptService: {
    getAll: vi.fn(),
    upload: vi.fn(),
    deleteReceipt: vi.fn(),
    updateReceipt: vi.fn(),
    getOcrStatus: vi.fn(),
  }
}))

import { useReceipts, useReceiptUpload, useDeleteReceipt, useUpdateReceipt, useOcrStatus } from './useReceipt'
import { receiptService } from '../services/receipt.service'

let queryClient

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    receiptService.getAll.mockResolvedValue([])
    const { result } = renderHook(() => useReceipts(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns receipt data on success', async () => {
    const mockReceipts = [{ _id: 'r1', ocrStatus: 'done', ocrExtractedAmount: '25.50' }]
    receiptService.getAll.mockResolvedValue(mockReceipts)

    const { result } = renderHook(() => useReceipts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockReceipts)
  })

  it('passes params to receiptService.getAll', async () => {
    const params = { page: 1, limit: 10 }
    receiptService.getAll.mockResolvedValue([])

    const { result } = renderHook(() => useReceipts(params), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receiptService.getAll).toHaveBeenCalledWith(params)
  })

  it('returns error state when service rejects', async () => {
    receiptService.getAll.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useReceipts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error.message).toBe('Network error')
  })
})

describe('useReceiptUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes mutate and mutateAsync functions', () => {
    const { result } = renderHook(() => useReceiptUpload(), { wrapper: createWrapper() })
    expect(result.current.mutate).toBeTypeOf('function')
    expect(result.current.mutateAsync).toBeTypeOf('function')
  })

  it('calls receiptService.upload with the provided file', async () => {
    const mockFile = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' })
    receiptService.upload.mockResolvedValue({ receiptId: 'r123' })

    const { result } = renderHook(() => useReceiptUpload(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync(mockFile)
    })

    expect(receiptService.upload).toHaveBeenCalledWith(mockFile, expect.any(Object))
  })

  it('exposes error state on upload failure', async () => {
    receiptService.upload.mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useReceiptUpload(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync(new File([''], 'f.jpg')).catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls receiptService.deleteReceipt with the receipt id', async () => {
    receiptService.deleteReceipt.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useDeleteReceipt(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync('receipt-id-1')
    })

    expect(receiptService.deleteReceipt).toHaveBeenCalledWith('receipt-id-1', expect.any(Object))
  })

  it('invalidates receipts queries on success', async () => {
    receiptService.deleteReceipt.mockResolvedValue({ success: true })
    const wrapper = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteReceipt(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('receipt-id-1')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['receipts'] })
  })

  it('exposes error state on delete failure', async () => {
    receiptService.deleteReceipt.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteReceipt(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync('r1').catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls receiptService.updateReceipt with the payload', async () => {
    const payload = { id: 'r1', amount: '30.00', tags: ['food'] }
    receiptService.updateReceipt.mockResolvedValue({ _id: 'r1', amount: '30.00' })

    const { result } = renderHook(() => useUpdateReceipt(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync(payload)
    })

    expect(receiptService.updateReceipt).toHaveBeenCalledWith(payload, expect.any(Object))
  })

  it('invalidates receipts queries on success', async () => {
    receiptService.updateReceipt.mockResolvedValue({})
    const wrapper = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateReceipt(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 'r1', amount: '10.00' })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['receipts'] })
  })

  it('exposes error state on update failure', async () => {
    receiptService.updateReceipt.mockRejectedValue(new Error('Update failed'))

    const { result } = renderHook(() => useUpdateReceipt(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.mutateAsync({ id: 'r1' }).catch(() => {})
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useOcrStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is disabled and idle when receiptId is null', () => {
    receiptService.getOcrStatus.mockResolvedValue({ ocrStatus: 'pending' })
    const { result } = renderHook(() => useOcrStatus(null), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(receiptService.getOcrStatus).not.toHaveBeenCalled()
  })

  it('is disabled and idle when receiptId is undefined', () => {
    receiptService.getOcrStatus.mockResolvedValue({ ocrStatus: 'pending' })
    const { result } = renderHook(() => useOcrStatus(undefined), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
    expect(receiptService.getOcrStatus).not.toHaveBeenCalled()
  })

  it('fetches OCR status when receiptId is provided', async () => {
    const mockStatus = { ocrStatus: 'done', ocrExtractedAmount: '42.00' }
    receiptService.getOcrStatus.mockResolvedValue(mockStatus)

    const { result } = renderHook(() => useOcrStatus('r123'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStatus)
    expect(receiptService.getOcrStatus).toHaveBeenCalledWith('r123')
  })

  it('returns error state when OCR status fetch fails', async () => {
    receiptService.getOcrStatus.mockRejectedValue(new Error('OCR fetch failed'))

    const { result } = renderHook(() => useOcrStatus('r123'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
