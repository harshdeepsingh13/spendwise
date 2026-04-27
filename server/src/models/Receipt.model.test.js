import mongoose from 'mongoose'
import { Receipt } from './Receipt.model.js'

const validUserId = new mongoose.Types.ObjectId()

describe('Receipt model', () => {
  describe('required fields', () => {
    it('fails validation when user is missing', () => {
      const doc = new Receipt({})
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.user).toBeDefined()
    })

    it('passes validation with only the required user field', () => {
      const doc = new Receipt({ user: validUserId })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })
  })

  describe('ocrStatus', () => {
    it('defaults to "pending"', () => {
      const doc = new Receipt({ user: validUserId })
      expect(doc.ocrStatus).toBe('pending')
    })

    it.each(['pending', 'processing', 'done', 'failed'])(
      'accepts valid enum value "%s"',
      (status) => {
        const doc = new Receipt({ user: validUserId, ocrStatus: status })
        const err = doc.validateSync()
        expect(err).toBeUndefined()
      }
    )

    it('rejects an invalid enum value', () => {
      const doc = new Receipt({ user: validUserId, ocrStatus: 'unknown' })
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.ocrStatus).toBeDefined()
    })
  })

  describe('tags', () => {
    it('stores tags as an array of strings', () => {
      const doc = new Receipt({ user: validUserId, tags: ['food', 'travel'] })
      expect(doc.tags).toEqual(['food', 'travel'])
    })

    it('trims whitespace from individual tags', () => {
      const doc = new Receipt({ user: validUserId, tags: ['  food  ', ' travel '] })
      expect(doc.tags[0]).toBe('food')
      expect(doc.tags[1]).toBe('travel')
    })

    it('defaults tags to an empty array', () => {
      const doc = new Receipt({ user: validUserId })
      expect(doc.tags).toEqual([])
    })
  })

  describe('optional fields', () => {
    it('accepts a valid expense ObjectId reference', () => {
      const expenseId = new mongoose.Types.ObjectId()
      const doc = new Receipt({ user: validUserId, expense: expenseId })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
      expect(doc.expense.toString()).toBe(expenseId.toString())
    })

    it('stores cloudinaryPublicId and cloudinaryUrl as strings', () => {
      const doc = new Receipt({
        user: validUserId,
        cloudinaryPublicId: 'receipts/abc123',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/receipts/abc123.jpg',
      })
      expect(doc.cloudinaryPublicId).toBe('receipts/abc123')
      expect(doc.cloudinaryUrl).toBe('https://res.cloudinary.com/demo/image/upload/receipts/abc123.jpg')
    })

    it('stores ocrRawText as a string', () => {
      const doc = new Receipt({ user: validUserId, ocrRawText: 'Total: $42.00' })
      expect(doc.ocrRawText).toBe('Total: $42.00')
    })

    it('stores ocrExtractedAmount as Decimal128', () => {
      const amount = mongoose.Types.Decimal128.fromString('42.99')
      const doc = new Receipt({ user: validUserId, ocrExtractedAmount: amount })
      expect(doc.ocrExtractedAmount).toBeInstanceOf(mongoose.Types.Decimal128)
      expect(doc.ocrExtractedAmount.toString()).toBe('42.99')
    })
  })

  describe('fileType', () => {
    it('defaults to "image"', () => {
      const doc = new Receipt({ user: validUserId })
      expect(doc.fileType).toBe('image')
    })

    it.each(['image', 'pdf'])('accepts valid enum value "%s"', (type) => {
      const doc = new Receipt({ user: validUserId, fileType: type })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })

    it('rejects an invalid enum value', () => {
      const doc = new Receipt({ user: validUserId, fileType: 'docx' })
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.fileType).toBeDefined()
    })
  })

  describe('cloudinaryResourceType', () => {
    it('defaults to "image"', () => {
      const doc = new Receipt({ user: validUserId })
      expect(doc.cloudinaryResourceType).toBe('image')
    })

    it('accepts an explicit value', () => {
      const doc = new Receipt({ user: validUserId, cloudinaryResourceType: 'raw' })
      expect(doc.cloudinaryResourceType).toBe('raw')
    })
  })

  describe('submitted', () => {
    it('defaults to false', () => {
      const doc = new Receipt({ user: validUserId })
      expect(doc.submitted).toBe(false)
    })

    it('accepts true', () => {
      const doc = new Receipt({ user: validUserId, submitted: true })
      expect(doc.submitted).toBe(true)
    })
  })

  describe('timestamps', () => {
    it('includes createdAt and updatedAt in the schema paths', () => {
      const paths = Receipt.schema.paths
      expect(paths.createdAt).toBeDefined()
      expect(paths.updatedAt).toBeDefined()
    })
  })
})
