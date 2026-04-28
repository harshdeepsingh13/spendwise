import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as cloudinaryService from './cloudinary.service.js'
import { ocrService } from './ocr.service.js'
import {
  listReceipts,
  uploadReceipt,
  getOcrStatus,
  deleteReceipt,
  updateReceipt
} from './receipt.service.js'

const { mockFind, mockFindById, MockReceipt } = vi.hoisted(() => {
  const mockFind = vi.fn()
  const mockFindById = vi.fn()
  const MockReceipt = vi.fn()
  MockReceipt.find = mockFind
  MockReceipt.findById = mockFindById
  return { mockFind, mockFindById, MockReceipt }
})

vi.mock('../models/Receipt.model.js', () => ({ Receipt: MockReceipt }))
vi.mock('./cloudinary.service.js', () => ({
  uploadToCloudinary: vi.fn(),
  destroyCloudinaryAsset: vi.fn()
}))
vi.mock('./ocr.service.js', () => ({
  ocrService: { processReceipt: vi.fn() }
}))

const USER_ID = 'user123'
const RECEIPT_ID = 'receipt123'

beforeEach(() => vi.clearAllMocks())

// ─── listReceipts ────────────────────────────────────────────────────────────

describe('listReceipts', () => {
  beforeEach(() => {
    mockFind.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
  })

  it('filters by userId and submitted=true with no date/tag options', async () => {
    await listReceipts(USER_ID)
    expect(mockFind).toHaveBeenCalledWith({ user: USER_ID, submitted: true })
  })

  it('adds $gte when startDate is provided', async () => {
    await listReceipts(USER_ID, { startDate: '2024-01-01' })
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: expect.objectContaining({ $gte: new Date('2024-01-01') }) })
    )
  })

  it('adds $lte when endDate is provided', async () => {
    await listReceipts(USER_ID, { endDate: '2024-12-31' })
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: expect.objectContaining({ $lte: new Date('2024-12-31') }) })
    )
  })

  it('adds both $gte and $lte when both dates are provided', async () => {
    await listReceipts(USER_ID, { startDate: '2024-01-01', endDate: '2024-12-31' })
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        createdAt: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      })
    )
  })

  it('adds tag filter when tag is provided', async () => {
    await listReceipts(USER_ID, { tag: 'food' })
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ tags: 'food' }))
  })

  it('sorts results by createdAt descending', async () => {
    const mockSort = vi.fn().mockResolvedValue([])
    mockFind.mockReturnValue({ sort: mockSort })
    await listReceipts(USER_ID)
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 })
  })
})

// ─── uploadReceipt ───────────────────────────────────────────────────────────

describe('uploadReceipt', () => {
  const mockUploadResult = {
    public_id: 'pub_id_123',
    secure_url: 'https://cloudinary.com/receipt.jpg',
    resource_type: 'image',
    pages: 1
  }
  const mockReceiptInstance = {
    _id: RECEIPT_ID,
    ocrStatus: 'pending',
    cloudinaryUrl: mockUploadResult.secure_url,
    fileType: 'image',
    save: vi.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    cloudinaryService.uploadToCloudinary.mockResolvedValue(mockUploadResult)
    MockReceipt.mockImplementation(function() { return mockReceiptInstance })
    ocrService.processReceipt.mockResolvedValue(undefined)
    mockReceiptInstance.save.mockClear()
  })

  it('uploads to Cloudinary with the receipts folder and auto resource_type', async () => {
    const buf = Buffer.from('data')
    await uploadReceipt(USER_ID, buf, { originalname: 'receipt.jpg', mimetype: 'image/jpeg' })
    expect(cloudinaryService.uploadToCloudinary).toHaveBeenCalledWith(
      buf,
      { folder: 'spendwise/receipts', resource_type: 'auto' }
    )
  })

  it('creates a Receipt document with correct fields and saves it', async () => {
    await uploadReceipt(USER_ID, Buffer.from('data'), { originalname: 'receipt.jpg', mimetype: 'image/jpeg' })
    expect(MockReceipt).toHaveBeenCalledWith(expect.objectContaining({
      user: USER_ID,
      name: 'receipt.jpg',
      cloudinaryPublicId: mockUploadResult.public_id,
      cloudinaryUrl: mockUploadResult.secure_url,
      fileType: 'image',
      ocrStatus: 'pending'
    }))
    expect(mockReceiptInstance.save).toHaveBeenCalled()
  })

  it('returns id, ocrStatus, cloudinaryUrl, and fileType', async () => {
    const result = await uploadReceipt(USER_ID, Buffer.from('data'), { originalname: 'receipt.jpg', mimetype: 'image/jpeg' })
    expect(result).toEqual({
      id: RECEIPT_ID,
      ocrStatus: 'pending',
      cloudinaryUrl: mockUploadResult.secure_url,
      fileType: 'image'
    })
  })

  it('triggers OCR processing in the background with correct args', async () => {
    await uploadReceipt(USER_ID, Buffer.from('data'), { originalname: 'receipt.jpg', mimetype: 'image/jpeg' })
    expect(ocrService.processReceipt).toHaveBeenCalledWith(RECEIPT_ID, mockUploadResult.secure_url, 1)
  })

  it('converts PDF URL to .jpg for OCR and passes page count', async () => {
    const pdfUpload = {
      public_id: 'pub_pdf',
      secure_url: 'https://cloudinary.com/receipt.pdf',
      resource_type: 'raw',
      pages: 3
    }
    const pdfInstance = { _id: 'pdf_id', ocrStatus: 'pending', cloudinaryUrl: pdfUpload.secure_url, fileType: 'pdf', save: vi.fn().mockResolvedValue(undefined) }
    cloudinaryService.uploadToCloudinary.mockResolvedValue(pdfUpload)
    MockReceipt.mockImplementation(function() { return pdfInstance })

    await uploadReceipt(USER_ID, Buffer.from('data'), { originalname: 'receipt.pdf', mimetype: 'application/pdf' })

    expect(MockReceipt).toHaveBeenCalledWith(expect.objectContaining({ fileType: 'pdf' }))
    expect(ocrService.processReceipt).toHaveBeenCalledWith('pdf_id', 'https://cloudinary.com/receipt.jpg', 3)
  })

  it('resolves successfully even when OCR processing fails', async () => {
    ocrService.processReceipt.mockRejectedValue(new Error('OCR failed'))
    await expect(
      uploadReceipt(USER_ID, Buffer.from('data'), { originalname: 'receipt.jpg', mimetype: 'image/jpeg' })
    ).resolves.toBeDefined()
  })
})

// ─── getOcrStatus ────────────────────────────────────────────────────────────

describe('getOcrStatus', () => {
  const mockReceipt = {
    _id: RECEIPT_ID,
    user: { toString: () => USER_ID },
    ocrStatus: 'done',
    ocrExtractedAmount: { toString: () => '42.50' },
    cloudinaryUrl: 'https://cloudinary.com/receipt.jpg'
  }

  beforeEach(() => {
    mockFindById.mockResolvedValue(mockReceipt)
  })

  it('returns OCR status with extracted amount as string', async () => {
    const result = await getOcrStatus(RECEIPT_ID, USER_ID)
    expect(result).toEqual({
      id: RECEIPT_ID,
      ocrStatus: 'done',
      ocrExtractedAmount: '42.50',
      cloudinaryUrl: 'https://cloudinary.com/receipt.jpg'
    })
  })

  it('returns null for ocrExtractedAmount when not set', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, ocrExtractedAmount: null })
    const result = await getOcrStatus(RECEIPT_ID, USER_ID)
    expect(result.ocrExtractedAmount).toBeNull()
  })

  it('throws 404 when receipt is not found', async () => {
    mockFindById.mockResolvedValue(null)
    const err = await getOcrStatus(RECEIPT_ID, USER_ID).catch(e => e)
    expect(err.status).toBe(404)
    expect(err.message).toBe('Receipt not found')
  })

  it('throws 404 when receipt belongs to a different user', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, user: { toString: () => 'other_user' } })
    const err = await getOcrStatus(RECEIPT_ID, USER_ID).catch(e => e)
    expect(err.status).toBe(404)
  })
})

// ─── deleteReceipt ───────────────────────────────────────────────────────────

describe('deleteReceipt', () => {
  const deleteOne = vi.fn().mockResolvedValue(undefined)
  const mockReceipt = {
    _id: RECEIPT_ID,
    user: { toString: () => USER_ID },
    cloudinaryPublicId: 'pub_id_123',
    cloudinaryResourceType: 'image',
    deleteOne
  }

  beforeEach(() => {
    mockFindById.mockResolvedValue(mockReceipt)
    cloudinaryService.destroyCloudinaryAsset.mockResolvedValue(undefined)
    deleteOne.mockClear()
  })

  it('destroys Cloudinary asset then deletes the receipt document', async () => {
    await deleteReceipt(RECEIPT_ID, USER_ID)
    expect(cloudinaryService.destroyCloudinaryAsset).toHaveBeenCalledWith('pub_id_123', 'image')
    expect(deleteOne).toHaveBeenCalled()
  })

  it('skips Cloudinary deletion when cloudinaryPublicId is absent', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, cloudinaryPublicId: null })
    await deleteReceipt(RECEIPT_ID, USER_ID)
    expect(cloudinaryService.destroyCloudinaryAsset).not.toHaveBeenCalled()
    expect(deleteOne).toHaveBeenCalled()
  })

  it('defaults resource_type to "image" when cloudinaryResourceType is undefined', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, cloudinaryResourceType: undefined })
    await deleteReceipt(RECEIPT_ID, USER_ID)
    expect(cloudinaryService.destroyCloudinaryAsset).toHaveBeenCalledWith('pub_id_123', 'image')
  })

  it('throws 404 when receipt is not found', async () => {
    mockFindById.mockResolvedValue(null)
    const err = await deleteReceipt(RECEIPT_ID, USER_ID).catch(e => e)
    expect(err.status).toBe(404)
  })

  it('throws 404 when receipt belongs to a different user', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, user: { toString: () => 'other_user' } })
    const err = await deleteReceipt(RECEIPT_ID, USER_ID).catch(e => e)
    expect(err.status).toBe(404)
  })
})

// ─── updateReceipt ───────────────────────────────────────────────────────────

describe('updateReceipt', () => {
  const save = vi.fn().mockResolvedValue(undefined)
  let mockReceipt

  beforeEach(() => {
    mockReceipt = {
      _id: RECEIPT_ID,
      user: { toString: () => USER_ID },
      ocrExtractedAmount: null,
      name: 'old-name.jpg',
      tags: [],
      submitted: false,
      save
    }
    mockFindById.mockResolvedValue(mockReceipt)
    save.mockClear()
  })

  it('updates amount and saves', async () => {
    await updateReceipt(RECEIPT_ID, USER_ID, { amount: '99.99' })
    expect(mockReceipt.ocrExtractedAmount).toBe('99.99')
    expect(save).toHaveBeenCalled()
  })

  it('updates name and saves', async () => {
    await updateReceipt(RECEIPT_ID, USER_ID, { name: 'new-name.jpg' })
    expect(mockReceipt.name).toBe('new-name.jpg')
    expect(save).toHaveBeenCalled()
  })

  it('updates tags and saves', async () => {
    await updateReceipt(RECEIPT_ID, USER_ID, { tags: ['food', 'travel'] })
    expect(mockReceipt.tags).toEqual(['food', 'travel'])
    expect(save).toHaveBeenCalled()
  })

  it('updates submitted status and saves', async () => {
    await updateReceipt(RECEIPT_ID, USER_ID, { submitted: true })
    expect(mockReceipt.submitted).toBe(true)
    expect(save).toHaveBeenCalled()
  })

  it('does not overwrite fields when values are undefined', async () => {
    await updateReceipt(RECEIPT_ID, USER_ID, {})
    expect(mockReceipt.name).toBe('old-name.jpg')
    expect(mockReceipt.tags).toEqual([])
    expect(mockReceipt.submitted).toBe(false)
    expect(mockReceipt.ocrExtractedAmount).toBeNull()
  })

  it('returns the updated receipt', async () => {
    const result = await updateReceipt(RECEIPT_ID, USER_ID, { name: 'updated.jpg' })
    expect(result).toBe(mockReceipt)
  })

  it('throws 404 when receipt is not found', async () => {
    mockFindById.mockResolvedValue(null)
    const err = await updateReceipt(RECEIPT_ID, USER_ID, {}).catch(e => e)
    expect(err.status).toBe(404)
  })

  it('throws 404 when receipt belongs to a different user', async () => {
    mockFindById.mockResolvedValue({ ...mockReceipt, user: { toString: () => 'other_user' } })
    const err = await updateReceipt(RECEIPT_ID, USER_ID, {}).catch(e => e)
    expect(err.status).toBe(404)
  })
})
