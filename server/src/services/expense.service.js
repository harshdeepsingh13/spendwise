import { Expense } from '../models/Expense.model.js'
import { advanceDate, generateDueRecurrences } from './recurrence.service.js'

function notFound() {
  const err = new Error('Expense not found')
  err.status = 404
  return err
}

/**
 * Keeps recurrence bookkeeping consistent after a create/update: when the expense is a
 * recurring template, ensures a frequency and computes the next occurrence date; when it's
 * not recurring, clears the schedule so no occurrences are generated.
 * @param {import('mongoose').Document} expense - Expense being saved.
 */
function applyRecurrenceSchedule(expense) {
  if (expense.isRecurring) {
    if (!expense.frequency) {
      const err = new Error('A recurring expense requires a frequency')
      err.status = 400
      throw err
    }
    expense.interval = expense.interval || 1
    expense.nextRunAt = advanceDate(expense.date, expense.frequency, expense.interval)
  } else {
    expense.nextRunAt = undefined
  }
}

/**
 * Immediately materializes any already-due occurrences for a just-saved recurring template
 * (e.g. one created/edited with a past start date), so backfill is instant instead of waiting
 * for the throttled per-request sweep. No-op for non-recurring or future-dated templates.
 * @param {import('mongoose').Document} expense - The saved expense.
 * @param {string} userId - Owner id.
 */
async function backfillIfDue(expense, userId) {
  if (expense.isRecurring && expense.nextRunAt && expense.nextRunAt <= new Date()) {
    await generateDueRecurrences(userId)
  }
}

export async function listExpenses(userId, { startDate, endDate, categoryId } = {}) {
  const filter = { user: userId }
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)
  }
  if (categoryId) filter.category = categoryId
  return Expense.find(filter).populate('category').sort({ date: -1 })
}

export async function getExpense(expenseId, userId) {
  const expense = await Expense.findById(expenseId).populate('category').populate('receipt')
  if (!expense || expense.user.toString() !== userId.toString()) throw notFound()
  return expense
}

export async function createExpense(data, userId) {
  const expense = new Expense({ ...data, user: userId })
  applyRecurrenceSchedule(expense)
  await expense.save()
  await backfillIfDue(expense, userId)
  await expense.populate('category')
  return expense
}

export async function updateExpense(expenseId, userId, data) {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.user.toString() !== userId.toString()) throw notFound()
  Object.assign(expense, data)
  // Recompute the schedule only when a recurrence-affecting field changed
  if (['isRecurring', 'frequency', 'interval', 'date'].some((k) => k in data)) {
    applyRecurrenceSchedule(expense)
  }
  await expense.save()
  await backfillIfDue(expense, userId)
  await expense.populate('category')
  return expense
}

export async function deleteExpense(expenseId, userId) {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.user.toString() !== userId.toString()) throw notFound()
  await expense.deleteOne()
}
