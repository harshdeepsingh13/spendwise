import { Expense } from '../models/Expense.model.js'
import { User } from '../models/User.model.js'

/** Minimum gap between recurrence sweeps for a given user. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000
/** Safety cap on occurrences generated per template per sweep (avoids runaway loops). */
const MAX_OCCURRENCES_PER_TEMPLATE = 1000

/**
 * Advances a date by one recurrence step. Uses native Date arithmetic (server has no dayjs);
 * month/year overflow follows JS `Date` semantics (e.g. Jan 31 + 1 month → early Mar).
 *
 * @param {Date} date - Starting date.
 * @param {'daily'|'weekly'|'monthly'|'yearly'} frequency - Cadence.
 * @param {number} [interval=1] - Number of frequency units to advance.
 * @returns {Date} The advanced date.
 */
export function advanceDate(date, frequency, interval = 1) {
  const d = new Date(date)
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + interval); break
    case 'weekly': d.setDate(d.getDate() + 7 * interval); break
    case 'monthly': d.setMonth(d.getMonth() + interval); break
    case 'yearly': d.setFullYear(d.getFullYear() + interval); break
    default: throw new Error(`Unknown recurrence frequency: ${frequency}`)
  }
  return d
}

/**
 * Materializes all past-due occurrences for a user's recurring templates up to now,
 * then advances each template's `nextRunAt`. Generated occurrences are ordinary Expense
 * docs (so they flow into analytics) tagged with `recurringGroupId` = template id.
 *
 * Idempotent under races: a unique partial index on `{recurringGroupId, date}` means a
 * concurrent duplicate insert fails harmlessly instead of double-charging.
 *
 * @param {string} userId - Owner of the templates.
 * @returns {Promise<number>} Count of occurrences created.
 */
export async function generateDueRecurrences(userId) {
  const now = new Date()
  const templates = await Expense.find({ user: userId, isRecurring: true, nextRunAt: { $lte: now } })

  let created = 0
  for (const t of templates) {
    const occurrences = []
    let next = t.nextRunAt
    let guard = 0
    while (next && next <= now && guard < MAX_OCCURRENCES_PER_TEMPLATE) {
      if (t.recurrenceEndDate && next > t.recurrenceEndDate) break
      occurrences.push({
        user: t.user,
        category: t.category,
        amount: t.amount,
        currency: t.currency,
        date: next,
        notes: t.notes,
        isRecurring: false,
        recurringGroupId: t._id,
      })
      next = advanceDate(next, t.frequency, t.interval || 1)
      guard++
    }

    if (occurrences.length) {
      try {
        const inserted = await Expense.insertMany(occurrences, { ordered: false })
        created += inserted.length
      } catch (err) {
        // Ignore duplicate-key races (another request already generated these); rethrow otherwise
        if (err.code !== 11000 && !err.writeErrors) throw err
      }
    }

    // Stop the series once past its end date; otherwise remember where to resume
    t.nextRunAt = t.recurrenceEndDate && next > t.recurrenceEndDate ? undefined : next
    await t.save()
  }
  return created
}

/**
 * Throttled entry point for recurrence generation, safe to call on every authenticated
 * request. Uses an atomic per-user claim on `lastRecurrenceCheckAt` so only one concurrent
 * request runs a sweep (at most once per {@link CHECK_INTERVAL_MS}); the rest no-op.
 *
 * @param {string} userId - User to sweep.
 * @returns {Promise<void>}
 */
export async function runDueRecurrencesThrottled(userId) {
  const cutoff = new Date(Date.now() - CHECK_INTERVAL_MS)
  const claimed = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [{ lastRecurrenceCheckAt: { $lt: cutoff } }, { lastRecurrenceCheckAt: { $exists: false } }],
    },
    { $set: { lastRecurrenceCheckAt: new Date() } }
  )
  if (claimed) await generateDueRecurrences(userId)
}
