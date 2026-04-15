import * as budgetService from '../services/budget.service.js'

export const listBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetService.listBudgets(req.user._id)
    res.json(budgets)
  } catch (err) {
    next(err)
  }
}

export const createBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.upsertBudget(req.user._id, req.body)
    res.status(201).json(budget)
  } catch (err) {
    next(err)
  }
}

export const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.upsertBudget(req.user._id, {
      categoryId: req.body.categoryId,
      amount: req.body.amount,
      effectiveFrom: req.body.effectiveFrom
    })
    res.json(budget)
  } catch (err) {
    next(err)
  }
}

export const deleteBudget = async (req, res, next) => {
  try {
    await budgetService.deleteBudget(req.user._id, req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
