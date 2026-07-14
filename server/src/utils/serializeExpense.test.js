import { describe, it, expect } from 'vitest'
import { serializeExpense } from './serializeExpense.js'

/** Minimal Decimal128 stand-in: only `toString` matters to the serializer. */
const decimal = (value) => ({ toString: () => value })

const baseExpense = () => ({
  _id: 'exp1',
  amount: decimal('12.50'),
  currency: 'EUR',
  date: new Date('2026-05-01T00:00:00Z'),
  createdAt: new Date('2026-05-02T00:00:00Z'),
  notes: 'Lunch',
  category: null,
  receipt: null
})

describe('serializeExpense', () => {
  it('maps _id to id and passes date/createdAt through unchanged', () => {
    const date = new Date('2026-05-01T00:00:00Z')
    const createdAt = new Date('2026-05-02T00:00:00Z')
    const result = serializeExpense({ ...baseExpense(), _id: 'abc', date, createdAt })

    expect(result.id).toBe('abc')
    expect(result.date).toBe(date)
    expect(result.createdAt).toBe(createdAt)
  })

  it('stringifies a Decimal128 amount', () => {
    const result = serializeExpense({ ...baseExpense(), amount: decimal('99.99') })
    expect(result.amount).toBe('99.99')
  })

  it('returns null amount when amount is missing', () => {
    const result = serializeExpense({ ...baseExpense(), amount: null })
    expect(result.amount).toBeNull()
  })

  it('defaults currency to USD when absent', () => {
    const result = serializeExpense({ ...baseExpense(), currency: undefined })
    expect(result.currency).toBe('USD')
  })

  it('keeps the provided currency', () => {
    const result = serializeExpense({ ...baseExpense(), currency: 'GBP' })
    expect(result.currency).toBe('GBP')
  })

  it('flattens a populated category with all fields', () => {
    const result = serializeExpense({
      ...baseExpense(),
      category: { _id: 'cat1', name: 'Food', icon: '🍔', color: '#fff' }
    })
    expect(result.category).toEqual({ id: 'cat1', name: 'Food', icon: '🍔', color: '#fff' })
  })

  it('defaults missing category icon and color to null', () => {
    const result = serializeExpense({
      ...baseExpense(),
      category: { _id: 'cat1', name: 'Food' }
    })
    expect(result.category).toEqual({ id: 'cat1', name: 'Food', icon: null, color: null })
  })

  it('returns null category when not populated', () => {
    const result = serializeExpense({ ...baseExpense(), category: null })
    expect(result.category).toBeNull()
  })

  it('defaults missing notes to null', () => {
    const result = serializeExpense({ ...baseExpense(), notes: undefined })
    expect(result.notes).toBeNull()
  })

  it('stringifies receiptId when a receipt is attached', () => {
    const result = serializeExpense({ ...baseExpense(), receipt: { toString: () => 'rec1' } })
    expect(result.receiptId).toBe('rec1')
  })

  it('returns null receiptId when no receipt is attached', () => {
    const result = serializeExpense({ ...baseExpense(), receipt: null })
    expect(result.receiptId).toBeNull()
  })
})
