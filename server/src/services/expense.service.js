import { Expense } from '../models/Expense.model.js'

function notFound() {
  const err = new Error('Expense not found')
  err.status = 404
  return err
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
  await expense.save()
  await expense.populate('category')
  return expense
}

export async function updateExpense(expenseId, userId, data) {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.user.toString() !== userId.toString()) throw notFound()
  Object.assign(expense, data)
  await expense.save()
  await expense.populate('category')
  return expense
}

export async function deleteExpense(expenseId, userId) {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.user.toString() !== userId.toString()) throw notFound()
  await expense.deleteOne()
}
