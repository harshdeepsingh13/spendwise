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

  describe('recurrence fields', () => {
    const baseRecurring = () => ({
      user: validObjectId(),
      category: validObjectId(),
      amount: mongoose.Types.Decimal128.fromString('10.00'),
      date: new Date(),
    })

    it('defaults interval to 1', () => {
      const doc = new Expense(baseRecurring())
      expect(doc.interval).toBe(1)
    })

    it.each(['daily', 'weekly', 'monthly', 'yearly'])(
      'accepts "%s" as a valid frequency',
      (frequency) => {
        const doc = new Expense({ ...baseRecurring(), isRecurring: true, frequency })
        const err = doc.validateSync()
        expect(err).toBeUndefined()
        expect(doc.frequency).toBe(frequency)
      }
    )

    it('rejects an invalid frequency enum value', () => {
      const doc = new Expense({ ...baseRecurring(), isRecurring: true, frequency: 'hourly' })
      const err = doc.validateSync()
      expect(err.errors.frequency).toBeDefined()
    })

    it('does not require frequency for a non-recurring expense', () => {
      const doc = new Expense(baseRecurring())
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })

    it('accepts a custom interval', () => {
      const doc = new Expense({ ...baseRecurring(), interval: 3 })
      expect(doc.interval).toBe(3)
    })

    it('accepts nextRunAt as a Date', () => {
      const nextRunAt = new Date('2026-08-01')
      const doc = new Expense({ ...baseRecurring(), isRecurring: true, nextRunAt })
      expect(doc.nextRunAt).toBeInstanceOf(Date)
      expect(doc.nextRunAt.getTime()).toBe(nextRunAt.getTime())
    })

    it('accepts recurrenceEndDate as a Date', () => {
      const recurrenceEndDate = new Date('2026-12-31')
      const doc = new Expense({ ...baseRecurring(), isRecurring: true, recurrenceEndDate })
      expect(doc.recurrenceEndDate).toBeInstanceOf(Date)
      expect(doc.recurrenceEndDate.getTime()).toBe(recurrenceEndDate.getTime())
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

    it('has compound index on user + isRecurring + nextRunAt for due-template lookups', () => {
      const indexes = Expense.schema.indexes()
      const hasDueTemplateIndex = indexes.some(
        ([fields]) => fields.user === 1 && fields.isRecurring === 1 && fields.nextRunAt === 1
      )
      expect(hasDueTemplateIndex).toBe(true)
    })

    it('has a unique partial index on recurringGroupId + date to dedupe generated occurrences', () => {
      const indexes = Expense.schema.indexes()
      const dedupeIndex = indexes.find(
        ([fields]) => fields.recurringGroupId === 1 && fields.date === 1
      )
      expect(dedupeIndex).toBeDefined()
      const [, options] = dedupeIndex
      expect(options.unique).toBe(true)
      expect(options.partialFilterExpression).toEqual({ recurringGroupId: { $exists: true } })
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
