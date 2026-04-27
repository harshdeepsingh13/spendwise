import mongoose from 'mongoose'
import { Expense } from './Expense.model.js'

const validObjectId = () => new mongoose.Types.ObjectId()

describe('Expense model schema', () => {
  describe('required fields', () => {
    it('fails validation when user is missing', () => {
      const doc = new Expense({
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
      })
      const err = doc.validateSync()
      expect(err.errors.user).toBeDefined()
    })

    it('fails validation when category is missing', () => {
      const doc = new Expense({
        user: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
      })
      const err = doc.validateSync()
      expect(err.errors.category).toBeDefined()
    })

    it('fails validation when amount is missing', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        date: new Date(),
      })
      const err = doc.validateSync()
      expect(err.errors.amount).toBeDefined()
    })

    it('fails validation when date is missing', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
      })
      const err = doc.validateSync()
      expect(err.errors.date).toBeDefined()
    })

    it('passes validation with all required fields', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('99.99'),
        date: new Date(),
      })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })
  })

  describe('default values', () => {
    it('defaults currency to USD', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
      })
      expect(doc.currency).toBe('USD')
    })

    it('defaults isRecurring to false', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
      })
      expect(doc.isRecurring).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts notes', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
        notes: 'Lunch with client',
      })
      expect(doc.notes).toBe('Lunch with client')
    })

    it('accepts receipt reference', () => {
      const receiptId = validObjectId()
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
        receipt: receiptId,
      })
      expect(doc.receipt.toString()).toBe(receiptId.toString())
    })

    it('accepts recurringGroupId', () => {
      const groupId = validObjectId()
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
        isRecurring: true,
        recurringGroupId: groupId,
      })
      expect(doc.recurringGroupId.toString()).toBe(groupId.toString())
    })

    it('accepts custom currency', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
        currency: 'EUR',
      })
      expect(doc.currency).toBe('EUR')
    })
  })

  describe('field types', () => {
    it('stores amount as Decimal128', () => {
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('123.45'),
        date: new Date(),
      })
      expect(doc.amount).toBeInstanceOf(mongoose.Types.Decimal128)
      expect(doc.amount.toString()).toBe('123.45')
    })

    it('stores user as ObjectId', () => {
      const userId = validObjectId()
      const doc = new Expense({
        user: userId,
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: new Date(),
      })
      expect(doc.user.toString()).toBe(userId.toString())
    })

    it('stores date as Date', () => {
      const now = new Date()
      const doc = new Expense({
        user: validObjectId(),
        category: validObjectId(),
        amount: mongoose.Types.Decimal128.fromString('10.00'),
        date: now,
      })
      expect(doc.date).toBeInstanceOf(Date)
    })
  })

  describe('schema indexes', () => {
    it('has compound index on user + date', () => {
      const indexes = Expense.schema.indexes()
      const hasUserDate = indexes.some(([fields]) => fields.user === 1 && fields.date === -1)
      expect(hasUserDate).toBe(true)
    })

    it('has compound index on user + category + date', () => {
      const indexes = Expense.schema.indexes()
      const hasUserCategoryDate = indexes.some(
        ([fields]) => fields.user === 1 && fields.category === 1 && fields.date === -1
      )
      expect(hasUserCategoryDate).toBe(true)
    })
  })

  describe('timestamps', () => {
    it('schema has timestamps enabled', () => {
      const paths = Expense.schema.paths
      expect(paths.createdAt).toBeDefined()
      expect(paths.updatedAt).toBeDefined()
    })
  })

  describe('model registration', () => {
    it('is registered under the name Expense', () => {
      expect(Expense.modelName).toBe('Expense')
    })
  })
})
