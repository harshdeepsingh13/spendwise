import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { advanceDate, generateDueRecurrences, runDueRecurrencesThrottled } from './recurrence.service.js'
import { Expense } from '../models/Expense.model.js'
import { User } from '../models/User.model.js'

vi.mock('../models/Expense.model.js')
vi.mock('../models/User.model.js')

const DAY = 24 * 60 * 60 * 1000

/** Builds a mock recurring template with sensible defaults and a spyable save(). */
function makeTemplate(overrides = {}) {
  return {
    _id: 'tmpl1',
    user: 'user123',
    category: 'cat1',
    amount: 42,
    currency: 'USD',
    notes: 'Rent',
    frequency: 'daily',
    interval: 1,
    nextRunAt: undefined,
    recurrenceEndDate: undefined,
    isRecurring: true,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // insertMany echoes the docs it was given so `created` reflects the input length
  Expense.insertMany = vi.fn().mockImplementation(async (docs) => docs)
})

describe('advanceDate', () => {
  it('advances by whole days for daily frequency', () => {
    const result = advanceDate(new Date('2026-01-10T00:00:00Z'), 'daily')
    expect(result.toISOString()).toBe('2026-01-11T00:00:00.000Z')
  })

  it('advances by interval days for daily frequency', () => {
    const result = advanceDate(new Date('2026-01-10T00:00:00Z'), 'daily', 3)
    expect(result.toISOString()).toBe('2026-01-13T00:00:00.000Z')
  })

  it('advances by 7 days per interval for weekly frequency', () => {
    const result = advanceDate(new Date('2026-01-10T00:00:00Z'), 'weekly', 2)
    expect(result.toISOString()).toBe('2026-01-24T00:00:00.000Z')
  })

  it('advances by months for monthly frequency', () => {
    const result = advanceDate(new Date('2026-01-10T00:00:00Z'), 'monthly')
    expect(result.getUTCMonth()).toBe(1) // February
  })

  it('advances by years for yearly frequency', () => {
    const result = advanceDate(new Date('2026-01-10T00:00:00Z'), 'yearly')
    expect(result.getUTCFullYear()).toBe(2027)
  })

  it('does not mutate the input date', () => {
    const input = new Date('2026-01-10T00:00:00Z')
    advanceDate(input, 'daily')
    expect(input.toISOString()).toBe('2026-01-10T00:00:00.000Z')
  })

  it('throws on an unknown frequency', () => {
    expect(() => advanceDate(new Date(), 'hourly')).toThrow('Unknown recurrence frequency: hourly')
  })
})

describe('generateDueRecurrences', () => {
  const NOW = new Date('2026-07-13T00:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 and inserts nothing when there are no due templates', async () => {
    Expense.find.mockResolvedValue([])

    const created = await generateDueRecurrences('user123')

    expect(created).toBe(0)
    expect(Expense.insertMany).not.toHaveBeenCalled()
  })

  it('queries due recurring templates for the user', async () => {
    Expense.find.mockResolvedValue([])

    await generateDueRecurrences('user123')

    expect(Expense.find).toHaveBeenCalledWith({
      user: 'user123',
      isRecurring: true,
      nextRunAt: { $lte: NOW },
    })
  })

  it('materializes every past-due occurrence up to now and advances nextRunAt', async () => {
    const template = makeTemplate({ nextRunAt: new Date(NOW.getTime() - 3 * DAY) })
    Expense.find.mockResolvedValue([template])

    const created = await generateDueRecurrences('user123')

    // now-3d, now-2d, now-1d, now → 4 occurrences; next (now+1d) is in the future
    expect(created).toBe(4)
    const docs = Expense.insertMany.mock.calls[0][0]
    expect(docs).toHaveLength(4)
    expect(template.save).toHaveBeenCalled()
    expect(template.nextRunAt).toEqual(new Date(NOW.getTime() + DAY))
  })

  it('copies template fields onto generated occurrences and tags the group', async () => {
    const template = makeTemplate({ nextRunAt: new Date(NOW.getTime() - DAY) })
    Expense.find.mockResolvedValue([template])

    await generateDueRecurrences('user123')

    const [firstDoc] = Expense.insertMany.mock.calls[0][0]
    expect(firstDoc).toMatchObject({
      user: 'user123',
      category: 'cat1',
      amount: 42,
      currency: 'USD',
      notes: 'Rent',
      isRecurring: false,
      recurringGroupId: 'tmpl1',
    })
  })

  it('stops at recurrenceEndDate and clears nextRunAt to end the series', async () => {
    const template = makeTemplate({
      nextRunAt: new Date(NOW.getTime() - 3 * DAY),
      recurrenceEndDate: new Date(NOW.getTime() - DAY),
    })
    Expense.find.mockResolvedValue([template])

    const created = await generateDueRecurrences('user123')

    // now-3d, now-2d, now-1d are <= endDate; now exceeds endDate → 3 occurrences
    expect(created).toBe(3)
    expect(template.nextRunAt).toBeUndefined()
  })

  it('respects the interval when advancing', async () => {
    const template = makeTemplate({
      frequency: 'daily',
      interval: 2,
      nextRunAt: new Date(NOW.getTime() - 3 * DAY),
    })
    Expense.find.mockResolvedValue([template])

    const created = await generateDueRecurrences('user123')

    // now-3d, now-1d are due; next = now+1d is in future → 2 occurrences
    expect(created).toBe(2)
  })

  it('defaults interval to 1 when it is falsy', async () => {
    const template = makeTemplate({ interval: 0, nextRunAt: new Date(NOW.getTime() - 2 * DAY) })
    Expense.find.mockResolvedValue([template])

    const created = await generateDueRecurrences('user123')

    expect(created).toBe(3) // now-2d, now-1d, now
  })

  it('swallows duplicate-key races (error code 11000)', async () => {
    const template = makeTemplate({ nextRunAt: new Date(NOW.getTime() - DAY) })
    Expense.find.mockResolvedValue([template])
    Expense.insertMany.mockRejectedValue({ code: 11000 })

    const created = await generateDueRecurrences('user123')

    expect(created).toBe(0)
    expect(template.save).toHaveBeenCalled()
  })

  it('swallows partial bulk-write races (writeErrors present)', async () => {
    const template = makeTemplate({ nextRunAt: new Date(NOW.getTime() - DAY) })
    Expense.find.mockResolvedValue([template])
    Expense.insertMany.mockRejectedValue({ writeErrors: [{ code: 11000 }] })

    const created = await generateDueRecurrences('user123')

    expect(created).toBe(0)
    expect(template.save).toHaveBeenCalled()
  })

  it('rethrows non-duplicate insert errors', async () => {
    const template = makeTemplate({ nextRunAt: new Date(NOW.getTime() - DAY) })
    Expense.find.mockResolvedValue([template])
    Expense.insertMany.mockRejectedValue(new Error('connection lost'))

    await expect(generateDueRecurrences('user123')).rejects.toThrow('connection lost')
  })

  it('processes multiple templates independently', async () => {
    const t1 = makeTemplate({ _id: 'a', nextRunAt: new Date(NOW.getTime() - DAY) })
    const t2 = makeTemplate({ _id: 'b', nextRunAt: new Date(NOW.getTime() - 2 * DAY) })
    Expense.find.mockResolvedValue([t1, t2])

    const created = await generateDueRecurrences('user123')

    // t1: now-1d, now (2) + t2: now-2d, now-1d, now (3) = 5
    expect(created).toBe(5)
    expect(t1.save).toHaveBeenCalled()
    expect(t2.save).toHaveBeenCalled()
  })
})

describe('runDueRecurrencesThrottled', () => {
  beforeEach(() => {
    Expense.find.mockResolvedValue([])
  })

  it('claims the sweep atomically and runs generation when the claim succeeds', async () => {
    User.findOneAndUpdate.mockResolvedValue({ _id: 'user123' })

    await runDueRecurrencesThrottled('user123')

    expect(User.findOneAndUpdate).toHaveBeenCalledTimes(1)
    const [query, update] = User.findOneAndUpdate.mock.calls[0]
    expect(query._id).toBe('user123')
    expect(query.$or).toBeDefined()
    expect(update.$set.lastRecurrenceCheckAt).toBeInstanceOf(Date)
    expect(Expense.find).toHaveBeenCalled()
  })

  it('no-ops when the claim is not acquired (throttled)', async () => {
    User.findOneAndUpdate.mockResolvedValue(null)

    await runDueRecurrencesThrottled('user123')

    expect(Expense.find).not.toHaveBeenCalled()
  })

  it('propagates errors from the claim query', async () => {
    User.findOneAndUpdate.mockRejectedValue(new Error('DB error'))

    await expect(runDueRecurrencesThrottled('user123')).rejects.toThrow('DB error')
  })
})
