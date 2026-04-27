import mongoose from 'mongoose'
import { Budget } from './Budget.model.js'

const validUserId = new mongoose.Types.ObjectId()
const validCategoryId = new mongoose.Types.ObjectId()
const validAmount = mongoose.Types.Decimal128.fromString('500.00')
const validEffectiveFrom = new Date('2025-01-01')

const validBudget = {
  user: validUserId,
  category: validCategoryId,
  amount: validAmount,
  effectiveFrom: validEffectiveFrom,
}

describe('Budget model', () => {
  describe('required fields', () => {
    it('passes validation with all required fields', () => {
      const doc = new Budget(validBudget)
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })

    it('fails validation when user is missing', () => {
      const { user: _, ...rest } = validBudget
      const doc = new Budget(rest)
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.user).toBeDefined()
    })

    it('fails validation when category is missing', () => {
      const { category: _, ...rest } = validBudget
      const doc = new Budget(rest)
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.category).toBeDefined()
    })

    it('fails validation when amount is missing', () => {
      const { amount: _, ...rest } = validBudget
      const doc = new Budget(rest)
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.amount).toBeDefined()
    })

    it('fails validation when effectiveFrom is missing', () => {
      const { effectiveFrom: _, ...rest } = validBudget
      const doc = new Budget(rest)
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.effectiveFrom).toBeDefined()
    })
  })

  describe('period', () => {
    it('defaults to "monthly"', () => {
      const doc = new Budget(validBudget)
      expect(doc.period).toBe('monthly')
    })

    it('accepts "monthly" as a valid enum value', () => {
      const doc = new Budget({ ...validBudget, period: 'monthly' })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
    })

    it('rejects an invalid enum value', () => {
      const doc = new Budget({ ...validBudget, period: 'weekly' })
      const err = doc.validateSync()
      expect(err).toBeDefined()
      expect(err.errors.period).toBeDefined()
    })
  })

  describe('effectiveTo', () => {
    it('defaults to null', () => {
      const doc = new Budget(validBudget)
      expect(doc.effectiveTo).toBeNull()
    })

    it('accepts a valid Date value', () => {
      const doc = new Budget({ ...validBudget, effectiveTo: new Date('2025-12-31') })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
      expect(doc.effectiveTo).toBeInstanceOf(Date)
    })
  })

  describe('currency', () => {
    it('defaults to "USD"', () => {
      const doc = new Budget(validBudget)
      expect(doc.currency).toBe('USD')
    })

    it('accepts a custom currency string', () => {
      const doc = new Budget({ ...validBudget, currency: 'EUR' })
      const err = doc.validateSync()
      expect(err).toBeUndefined()
      expect(doc.currency).toBe('EUR')
    })
  })

  describe('amount', () => {
    it('stores amount as Decimal128', () => {
      const doc = new Budget(validBudget)
      expect(doc.amount).toBeInstanceOf(mongoose.Types.Decimal128)
      expect(doc.amount.toString()).toBe('500.00')
    })

    it('preserves decimal precision', () => {
      const doc = new Budget({ ...validBudget, amount: mongoose.Types.Decimal128.fromString('99.99') })
      expect(doc.amount.toString()).toBe('99.99')
    })
  })

  describe('references', () => {
    it('stores user as an ObjectId reference', () => {
      const doc = new Budget(validBudget)
      expect(doc.user.toString()).toBe(validUserId.toString())
    })

    it('stores category as an ObjectId reference', () => {
      const doc = new Budget(validBudget)
      expect(doc.category.toString()).toBe(validCategoryId.toString())
    })
  })

  describe('timestamps', () => {
    it('includes createdAt and updatedAt in the schema paths', () => {
      const paths = Budget.schema.paths
      expect(paths.createdAt).toBeDefined()
      expect(paths.updatedAt).toBeDefined()
    })
  })

  describe('indexes', () => {
    it('defines an index on user + category', () => {
      const indexes = Budget.schema.indexes()
      const hasUserCategory = indexes.some(
        ([fields]) => fields.user === 1 && fields.category === 1
      )
      expect(hasUserCategory).toBe(true)
    })

    it('defines an index on user + effectiveFrom (descending)', () => {
      const indexes = Budget.schema.indexes()
      const hasUserEffectiveFrom = indexes.some(
        ([fields]) => fields.user === 1 && fields.effectiveFrom === -1
      )
      expect(hasUserEffectiveFrom).toBe(true)
    })
  })
})
