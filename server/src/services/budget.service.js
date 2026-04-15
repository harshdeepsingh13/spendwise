import mongoose from 'mongoose'
import { Budget } from '../models/Budget.model.js'
import { Category } from '../models/Category.model.js'

export async function listBudgets(userId) {
  return Budget.find({ user: userId, effectiveTo: null })
    .populate('category')
    .sort({ createdAt: -1 })
}

export async function upsertBudget(userId, { categoryId, amount, effectiveFrom }) {
  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ user: userId }, { isDefault: true }]
  })
  if (!category) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }

  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    const err = new Error('Amount must be a positive number')
    err.status = 400
    throw err
  }

  const existing = await Budget.findOne({ user: userId, category: categoryId, effectiveTo: null })
  if (existing) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    existing.effectiveTo = yesterday
    await existing.save()
  }

  const budget = await Budget.create({
    user: userId,
    category: categoryId,
    amount: mongoose.Types.Decimal128.fromString(String(amount)),
    effectiveFrom: new Date(effectiveFrom),
    currency: 'USD'
  })

  return Budget.findById(budget._id).populate('category')
}

export async function deleteBudget(userId, budgetId) {
  const budget = await Budget.findOne({ _id: budgetId, user: userId })
  if (!budget) {
    const err = new Error('Budget not found')
    err.status = 404
    throw err
  }
  budget.effectiveTo = new Date()
  await budget.save()
}
