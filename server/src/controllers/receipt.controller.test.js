vi.mock('../services/receipt.service.js', () => ({
  listReceipts: vi.fn(),
  uploadReceipt: vi.fn(),
  getOcrStatus: vi.fn(),
  deleteReceipt: vi.fn(),
  updateReceipt: vi.fn()
}))

import * as receiptService from '../services/receipt.service.js'
import { listReceipts, uploadReceipt, getOcrStatus, deleteReceipt, updateReceipt } from './receipt.controller.js'

const makeMockReceipt = (overrides = {}) => ({
  _id: 'receipt123',
  name: null,
  cloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/receipt123.jpg',
  fileType: 'image',
  ocrStatus: 'done',
  ocrExtractedAmount: { toString: () => '42.50' },
  tags: ['food'],
  createdAt: new Date('2024-01-15T12:00:00Z'),
  ...overrides
})

const makeReq = (overrides = {}) => ({
  user: { _id: 'user123' },
  body: {},
  params: {},
  query: {},
  file: null,
  ...overrides
})

const makeRes = () => {
  const res = { json: vi.fn(), status: vi.fn() }
  res.status.mockReturnValue(res)
  return res
}

const makeNext = () => vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listReceipts', () => {
  it('returns serialized receipts for the authenticated user', async () => {
    const receipt = makeMockReceipt()
    receiptService.listReceipts.mockResolvedValue([receipt])
    const req = makeReq({ query: { tag: 'food' } })
    const res = makeRes()
    const next = makeNext()

    await listReceipts(req, res, next)

    expect(receiptService.listReceipts).toHaveBeenCalledWith('user123', { tag: 'food' })
    expect(res.json).toHaveBeenCalledWith([{
      id: 'receipt123',
      name: null,
      cloudinaryUrl: receipt.cloudinaryUrl,
      fileType: 'image',
      ocrStatus: 'done',
      ocrExtractedAmount: '42.50',
      tags: ['food'],
      createdAt: receipt.createdAt,
    }])
    expect(next).not.toHaveBeenCalled()
  })

  it('serializes null ocrExtractedAmount as null', async () => {
    const receipt = makeMockReceipt({ ocrExtractedAmount: null })
    receiptService.listReceipts.mockResolvedValue([receipt])
    const req = makeReq()
    const res = makeRes()

    await listReceipts(req, res, makeNext())

    const [result] = res.json.mock.calls[0][0]
    expect(result.ocrExtractedAmount).toBeNull()
  })

  it('uses fileType "image" as default when undefined', async () => {
    const receipt = makeMockReceipt({ fileType: undefined })
    receiptService.listReceipts.mockResolvedValue([receipt])
    const req = makeReq()
    const res = makeRes()

    await listReceipts(req, res, makeNext())

    const [result] = res.json.mock.calls[0][0]
    expect(result.fileType).toBe('image')
  })

  it('uses empty array as default tags when undefined', async () => {
    const receipt = makeMockReceipt({ tags: undefined })
    receiptService.listReceipts.mockResolvedValue([receipt])
    const req = makeReq()
    const res = makeRes()

    await listReceipts(req, res, makeNext())

    const [result] = res.json.mock.calls[0][0]
    expect(result.tags).toEqual([])
  })

  it('calls next(err) on service error', async () => {
    const err = new Error('DB error')
    receiptService.listReceipts.mockRejectedValue(err)
    const req = makeReq()
    const res = makeRes()
    const next = makeNext()

    await listReceipts(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('uploadReceipt', () => {
  it('returns 400 when no file is provided', async () => {
    const req = makeReq({ file: null })
    const res = makeRes()
    const next = makeNext()

    await uploadReceipt(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'No file provided' })
    expect(receiptService.uploadReceipt).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('calls service with userId, buffer, and file metadata and returns 201', async () => {
    const serviceResult = { id: 'newReceipt1', status: 'pending', cloudinaryUrl: 'https://cdn.example.com/img.jpg', fileType: 'image' }
    receiptService.uploadReceipt.mockResolvedValue(serviceResult)
    const file = { buffer: Buffer.from('fake-image'), originalname: 'photo.jpg', mimetype: 'image/jpeg' }
    const req = makeReq({ file })
    const res = makeRes()
    const next = makeNext()

    await uploadReceipt(req, res, next)

    expect(receiptService.uploadReceipt).toHaveBeenCalledWith('user123', file.buffer, {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg'
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(serviceResult)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) on service error', async () => {
    const err = new Error('Cloudinary failed')
    receiptService.uploadReceipt.mockRejectedValue(err)
    const req = makeReq({ file: { buffer: Buffer.from('data'), originalname: 'x.jpg', mimetype: 'image/jpeg' } })
    const res = makeRes()
    const next = makeNext()

    await uploadReceipt(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('getOcrStatus', () => {
  it('returns OCR status from service', async () => {
    const serviceResult = { id: 'receipt123', ocrStatus: 'done', ocrExtractedAmount: '42.50', cloudinaryUrl: 'https://cdn.example.com/img.jpg' }
    receiptService.getOcrStatus.mockResolvedValue(serviceResult)
    const req = makeReq({ params: { id: 'receipt123' } })
    const res = makeRes()
    const next = makeNext()

    await getOcrStatus(req, res, next)

    expect(receiptService.getOcrStatus).toHaveBeenCalledWith('receipt123', 'user123')
    expect(res.json).toHaveBeenCalledWith(serviceResult)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) on service error', async () => {
    const err = Object.assign(new Error('Receipt not found'), { status: 404 })
    receiptService.getOcrStatus.mockRejectedValue(err)
    const req = makeReq({ params: { id: 'nonexistent' } })
    const res = makeRes()
    const next = makeNext()

    await getOcrStatus(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('deleteReceipt', () => {
  it('calls service and returns success true', async () => {
    receiptService.deleteReceipt.mockResolvedValue(undefined)
    const req = makeReq({ params: { id: 'receipt123' } })
    const res = makeRes()
    const next = makeNext()

    await deleteReceipt(req, res, next)

    expect(receiptService.deleteReceipt).toHaveBeenCalledWith('receipt123', 'user123')
    expect(res.json).toHaveBeenCalledWith({ success: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) on service error', async () => {
    const err = Object.assign(new Error('Receipt not found'), { status: 404 })
    receiptService.deleteReceipt.mockRejectedValue(err)
    const req = makeReq({ params: { id: 'nonexistent' } })
    const res = makeRes()
    const next = makeNext()

    await deleteReceipt(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})

describe('updateReceipt', () => {
  it('calls service and returns serialized receipt', async () => {
    const receipt = makeMockReceipt()
    receiptService.updateReceipt.mockResolvedValue(receipt)
    const req = makeReq({ params: { id: 'receipt123' }, body: { amount: 99.99, tags: ['food'] } })
    const res = makeRes()
    const next = makeNext()

    await updateReceipt(req, res, next)

    expect(receiptService.updateReceipt).toHaveBeenCalledWith('receipt123', 'user123', { amount: 99.99, tags: ['food'] })
    const [payload] = res.json.mock.calls[0]
    expect(payload).toMatchObject({
      id: 'receipt123',
      ocrStatus: 'done',
      ocrExtractedAmount: '42.50',
      cloudinaryUrl: receipt.cloudinaryUrl,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('serializes the updated receipt with serializeReceipt shape', async () => {
    const receipt = makeMockReceipt({ name: 'Grocery Run', tags: ['groceries'], fileType: 'pdf', ocrExtractedAmount: null })
    receiptService.updateReceipt.mockResolvedValue(receipt)
    const req = makeReq({ params: { id: 'receipt123' }, body: {} })
    const res = makeRes()

    await updateReceipt(req, res, makeNext())

    const [payload] = res.json.mock.calls[0]
    expect(payload).toEqual({
      id: 'receipt123',
      name: 'Grocery Run',
      cloudinaryUrl: receipt.cloudinaryUrl,
      fileType: 'pdf',
      ocrStatus: 'done',
      ocrExtractedAmount: null,
      tags: ['groceries'],
      createdAt: receipt.createdAt,
    })
  })

  it('calls next(err) on service error', async () => {
    const err = Object.assign(new Error('Receipt not found'), { status: 404 })
    receiptService.updateReceipt.mockRejectedValue(err)
    const req = makeReq({ params: { id: 'nonexistent' }, body: { amount: 10 } })
    const res = makeRes()
    const next = makeNext()

    await updateReceipt(req, res, next)

    expect(next).toHaveBeenCalledWith(err)
    expect(res.json).not.toHaveBeenCalled()
  })
})
