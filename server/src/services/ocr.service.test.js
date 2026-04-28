import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractAmount, ocrService } from './ocr.service.js'
import Tesseract from 'tesseract.js'
import { Receipt } from '../models/Receipt.model.js'

vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn() }
}))

vi.mock('../models/Receipt.model.js', () => ({
  Receipt: { findByIdAndUpdate: vi.fn() }
}))

// ── extractAmount ──────────────────────────────────────────────────────────────

describe('extractAmount', () => {
  describe('high-priority keywords', () => {
    it('extracts amount from "Grand Total" line', () => {
      expect(extractAmount('Subtotal $18.00\nTax $2.00\nGrand Total $20.00')).toBe(20.00)
    })

    it('extracts amount from "Total Amount" line', () => {
      expect(extractAmount('Total Amount $45.67')).toBe(45.67)
    })

    it('extracts amount from "Amount Due" line', () => {
      expect(extractAmount('Amount Due: $89.99')).toBe(89.99)
    })

    it('extracts amount from "Balance Due" line', () => {
      expect(extractAmount('Balance Due $200.00')).toBe(200.00)
    })

    it('extracts amount from "Order Total" line', () => {
      expect(extractAmount('Order Total $50.00')).toBe(50.00)
    })

    it('extracts amount from "Total Due" line', () => {
      expect(extractAmount('Total Due $33.00')).toBe(33.00)
    })

    it('extracts amount from "Amount Payable" line', () => {
      expect(extractAmount('Amount Payable $77.50')).toBe(77.50)
    })
  })

  describe('medium-priority keyword (total)', () => {
    it('extracts amount from "Total" line when no high-priority line exists', () => {
      expect(extractAmount('Item A $10.00\nItem B $5.00\nTotal $15.00')).toBe(15.00)
    })

    it('prefers high-priority line over plain "Total" line', () => {
      expect(extractAmount('Total $15.00\nGrand Total $16.50')).toBe(16.50)
    })
  })

  describe('skip keywords', () => {
    it('ignores "Subtotal" line even though it contains "total"', () => {
      expect(extractAmount('Subtotal $20.00\nTotal $22.00')).toBe(22.00)
    })

    it('ignores "Tax" line', () => {
      expect(extractAmount('Tax $2.00\nTotal $22.00')).toBe(22.00)
    })

    it('ignores tip line', () => {
      expect(extractAmount('Tip $3.00\nTotal $25.00')).toBe(25.00)
    })

    it('falls back to last decimal when only skip-keyword lines contain amounts', () => {
      expect(extractAmount('Total Savings $5.00')).toBe(5.00)
    })
  })

  describe('OCR misread normalization', () => {
    it('matches "T0tal" (0 misread as O) via normalization', () => {
      expect(extractAmount('T0tal $35.00')).toBe(35.00)
    })

    it('matches "Tota1" (1 misread as l) via normalization', () => {
      expect(extractAmount('Tota1 $42.00')).toBe(42.00)
    })
  })

  describe('fallback to last decimal amount', () => {
    it('returns last decimal amount when no keyword lines found', () => {
      expect(extractAmount('Item A $5.00\nItem B $3.00\nFinal $8.50')).toBe(8.50)
    })

    it('returns the last of multiple amounts when no keywords match', () => {
      expect(extractAmount('$10.00 $20.00 $30.00')).toBe(30.00)
    })
  })

  describe('null cases', () => {
    it('returns null when text has no decimal amounts', () => {
      expect(extractAmount('No prices here')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(extractAmount('')).toBeNull()
    })

    it('returns null for whitespace-only string', () => {
      expect(extractAmount('   \n  ')).toBeNull()
    })
  })

  describe('amount parsing', () => {
    it('parses comma-separated thousands', () => {
      expect(extractAmount('Grand Total $1,234.56')).toBe(1234.56)
    })

    it('parses amount without dollar sign', () => {
      expect(extractAmount('Total 99.95')).toBe(99.95)
    })

    it('parses amount with space after dollar sign', () => {
      expect(extractAmount('Total $ 12.00')).toBe(12.00)
    })

    it('picks the last candidate when multiple high-priority lines exist', () => {
      expect(extractAmount('Grand Total $10.00\nOrder Total $11.00')).toBe(11.00)
    })
  })
})

// ── ocrService.processReceipt ──────────────────────────────────────────────────

describe('ocrService.processReceipt', () => {
  const receiptId = 'receipt123'
  const imageUrl = 'https://example.com/receipt.jpg'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    Receipt.findByIdAndUpdate.mockResolvedValue({})
  })

  it('sets status to processing, then done with extracted amount', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: 'Grand Total $42.00' } })

    await ocrService.processReceipt(receiptId, imageUrl)

    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(1, receiptId, { ocrStatus: 'processing' })
    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, {
      ocrStatus: 'done',
      ocrExtractedAmount: '42.00',
      ocrRawText: 'Grand Total $42.00'
    })
  })

  it('stores null ocrExtractedAmount when no amount can be parsed', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: 'no prices here' } })

    await ocrService.processReceipt(receiptId, imageUrl)

    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, {
      ocrStatus: 'done',
      ocrExtractedAmount: null,
      ocrRawText: 'no prices here'
    })
  })

  it('sets status to failed when Tesseract throws', async () => {
    Tesseract.recognize.mockRejectedValue(new Error('OCR engine failure'))

    await ocrService.processReceipt(receiptId, imageUrl)

    expect(Receipt.findByIdAndUpdate).toHaveBeenCalledTimes(2)
    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(1, receiptId, { ocrStatus: 'processing' })
    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, { ocrStatus: 'failed' })
  })

  it('sets status to failed when first DB update throws', async () => {
    Receipt.findByIdAndUpdate
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValue({})

    await ocrService.processReceipt(receiptId, imageUrl)

    expect(Receipt.findByIdAndUpdate).toHaveBeenCalledTimes(2)
    expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, { ocrStatus: 'failed' })
  })

  it('passes imageUrl to Tesseract.recognize with eng language', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: 'Total $10.00' } })

    await ocrService.processReceipt(receiptId, imageUrl)

    expect(Tesseract.recognize).toHaveBeenCalledWith(imageUrl, 'eng')
  })

  it('formats extracted amount to 2 decimal places', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: 'Total $9.50' } })

    await ocrService.processReceipt(receiptId, imageUrl)

    const secondCall = Receipt.findByIdAndUpdate.mock.calls[1]
    expect(secondCall[1].ocrExtractedAmount).toBe('9.50')
  })

  describe('multi-page PDF processing (pageCount > 1)', () => {
    const pdfUrl = 'https://res.cloudinary.com/demo/image/upload/receipt.pdf'

    it('calls Tesseract once per page with page-specific URLs', async () => {
      Tesseract.recognize
        .mockResolvedValueOnce({ data: { text: 'Page 1 items $10.00' } })
        .mockResolvedValueOnce({ data: { text: 'Grand Total $25.00' } })

      await ocrService.processReceipt(receiptId, pdfUrl, 2)

      expect(Tesseract.recognize).toHaveBeenCalledTimes(2)
      expect(Tesseract.recognize).toHaveBeenNthCalledWith(
        1,
        'https://res.cloudinary.com/demo/image/upload/pg_1/receipt.pdf',
        'eng'
      )
      expect(Tesseract.recognize).toHaveBeenNthCalledWith(
        2,
        'https://res.cloudinary.com/demo/image/upload/pg_2/receipt.pdf',
        'eng'
      )
    })

    it('joins page texts and extracts amount from combined text', async () => {
      Tesseract.recognize
        .mockResolvedValueOnce({ data: { text: 'Item A $10.00\nItem B $15.00' } })
        .mockResolvedValueOnce({ data: { text: 'Grand Total $25.00' } })

      await ocrService.processReceipt(receiptId, pdfUrl, 2)

      expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, {
        ocrStatus: 'done',
        ocrExtractedAmount: '25.00',
        ocrRawText: 'Item A $10.00\nItem B $15.00\nGrand Total $25.00'
      })
    })

    it('sets status to failed when any page recognition throws', async () => {
      Tesseract.recognize
        .mockResolvedValueOnce({ data: { text: 'Page 1 text' } })
        .mockRejectedValueOnce(new Error('Page 2 OCR failure'))

      await ocrService.processReceipt(receiptId, pdfUrl, 2)

      expect(Receipt.findByIdAndUpdate).toHaveBeenNthCalledWith(2, receiptId, { ocrStatus: 'failed' })
    })

    it('handles 3-page document calling Tesseract 3 times', async () => {
      Tesseract.recognize.mockResolvedValue({ data: { text: 'Total $5.00' } })

      await ocrService.processReceipt(receiptId, pdfUrl, 3)

      expect(Tesseract.recognize).toHaveBeenCalledTimes(3)
      expect(Tesseract.recognize).toHaveBeenNthCalledWith(
        3,
        'https://res.cloudinary.com/demo/image/upload/pg_3/receipt.pdf',
        'eng'
      )
    })
  })
})
