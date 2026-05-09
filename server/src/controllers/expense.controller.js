import * as expenseService from '../services/expense.service.js'

const serializeExpense = (e) => ({
  id: e._id,
  amount: e.amount ? e.amount.toString() : null,
  currency: e.currency || 'USD',
  category: e.category
    ? { id: e.category._id, name: e.category.name, icon: e.category.icon || null, color: e.category.color || null }
    : null,
  date: e.date,
  notes: e.notes || null,
  receiptId: e.receipt ? e.receipt.toString() : null,
  createdAt: e.createdAt
})

export const listExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId } = req.query
    const expenses = await expenseService.listExpenses(req.user._id, { startDate, endDate, categoryId })
    res.json(expenses.map(serializeExpense))
  } catch (err) {
    next(err)
  }
}

export const getExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpense(req.params.id, req.user._id)
    res.json(serializeExpense(expense))
  } catch (err) {
    next(err)
  }
}

export const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user._id)
    res.status(201).json(serializeExpense(expense))
  } catch (err) {
    next(err)
  }
}

export const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.user._id, req.body)
    res.json(serializeExpense(expense))
  } catch (err) {
    next(err)
  }
}

export const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.user._id)
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    next(err)
  }
}

