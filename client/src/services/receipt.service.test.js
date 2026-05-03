import { describe, it, expect, vi, beforeEach } from 'vitest'
import { receiptService } from './receipt.service.js'

vi.mock('../lib/axios.js', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}))

import { api } from '../lib/axios.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('receiptService.upload', () => {
  it('posts to /receipts/upload with FormData and returns response data', async () => {
    const mockFile = new File(['content'], 'receipt.png', { type: 'image/png' })
    const mockData = { receiptId: 'abc123' }
    api.post.mockResolvedValue({ data: mockData })

    const result = await receiptService.upload(mockFile)

    expect(api.post).toHaveBeenCalledOnce()
    const [url, body, config] = api.post.mock.calls[0]
    expect(url).toBe('/receipts/upload')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('receipt')).toBe(mockFile)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
    expect(result).toEqual(mockData)
  })

  it('propagates errors from the api call', async () => {
    api.post.mockRejectedValue(new Error('Network error'))
    await expect(receiptService.upload(new File([], 'f.png'))).rejects.toThrow('Network error')
  })
})

describe('receiptService.getOcrStatus', () => {
  it('calls GET /receipts/:id/ocr-status and returns data', async () => {
    const mockData = { ocrStatus: 'done', ocrExtractedAmount: '42.50' }
    api.get.mockResolvedValue({ data: mockData })

    const result = await receiptService.getOcrStatus('receipt-1')

    expect(api.get).toHaveBeenCalledWith('/receipts/receipt-1/ocr-status')
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Not found'))
    await expect(receiptService.getOcrStatus('bad-id')).rejects.toThrow('Not found')
  })
})

describe('receiptService.getAll', () => {
  it('calls GET /receipts with params and returns data', async () => {
    const params = { page: 1, limit: 10 }
    const mockData = [{ _id: '1' }, { _id: '2' }]
    api.get.mockResolvedValue({ data: mockData })

    const result = await receiptService.getAll(params)

    expect(api.get).toHaveBeenCalledWith('/receipts', { params })
    expect(result).toEqual(mockData)
  })

  it('calls GET /receipts with undefined params when none provided', async () => {
    api.get.mockResolvedValue({ data: [] })
    await receiptService.getAll()
    expect(api.get).toHaveBeenCalledWith('/receipts', { params: undefined })
  })

  it('propagates errors', async () => {
    api.get.mockRejectedValue(new Error('Server error'))
    await expect(receiptService.getAll()).rejects.toThrow('Server error')
  })
})

describe('receiptService.deleteReceipt', () => {
  it('calls DELETE /receipts/:id and returns data', async () => {
    const mockData = { message: 'Deleted' }
    api.delete.mockResolvedValue({ data: mockData })

    const result = await receiptService.deleteReceipt('receipt-99')

    expect(api.delete).toHaveBeenCalledWith('/receipts/receipt-99')
    expect(result).toEqual(mockData)
  })

  it('propagates errors', async () => {
    api.delete.mockRejectedValue(new Error('Forbidden'))
    await expect(receiptService.deleteReceipt('x')).rejects.toThrow('Forbidden')
  })
})

describe('receiptService.updateReceipt', () => {
  it('calls PATCH /receipts/:id with amount, tags, and submitted, returns data', async () => {
    const mockData = { _id: 'r1', amount: '25.00', tags: ['food'] }
    api.patch.mockResolvedValue({ data: mockData })

    const result = await receiptService.updateReceipt({ id: 'r1', amount: '25.00', tags: ['food'], submitted: true })

    expect(api.patch).toHaveBeenCalledWith('/receipts/r1', { amount: '25.00', tags: ['food'], submitted: true })
    expect(result).toEqual(mockData)
  })

  it('sends undefined for omitted fields', async () => {
    api.patch.mockResolvedValue({ data: {} })
    await receiptService.updateReceipt({ id: 'r2' })
    expect(api.patch).toHaveBeenCalledWith('/receipts/r2', { amount: undefined, tags: undefined, submitted: undefined })
  })

  it('propagates errors', async () => {
    api.patch.mockRejectedValue(new Error('Validation failed'))
    await expect(receiptService.updateReceipt({ id: 'r3', amount: '-1' })).rejects.toThrow('Validation failed')
  })
})
