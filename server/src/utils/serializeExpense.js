/**
 * Serializes an Expense Mongoose document into the clean JSON shape the client expects.
 * Normalizes the Decimal128 `amount` to a string and maps `_id` to `id`; flattens a
 * populated `category` to `{ id, name, icon, color }`.
 *
 * Shared across the expense and analytics controllers so every endpoint that returns
 * expenses emits an identical shape (avoids the raw-Decimal128 `$NaN` bug on the dashboard).
 *
 * @param {import('mongoose').Document} e - Expense document (optionally with `category` populated).
 * @returns {object} Serialized expense.
 */
export const serializeExpense = (e) => ({
  id: e._id,
  amount: e.amount ? e.amount.toString() : null,
  currency: e.currency || 'USD',
  category: e.category
    ? { id: e.category._id, name: e.category.name, icon: e.category.icon || null, color: e.category.color || null }
    : null,
  date: e.date,
  notes: e.notes || null,
  receiptId: e.receipt ? e.receipt.toString() : null,
  isRecurring: Boolean(e.isRecurring),
  frequency: e.frequency || null,
  interval: e.interval || null,
  recurrenceEndDate: e.recurrenceEndDate || null,
  createdAt: e.createdAt
})
