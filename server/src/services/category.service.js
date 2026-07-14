import { Category } from '../models/Category.model.js'
import { Expense } from '../models/Expense.model.js'
import { Budget } from '../models/Budget.model.js'

export async function listCategories(userId) {
  return Category.find({ $or: [{ user: userId }, { isDefault: true }] })
}

export async function createCategory(data, userId) {
  const category = new Category({ ...data, user: userId })
  await category.save()
  return category
}

/**
 * Loads a category and asserts the user is allowed to modify it.
 * Seeded default categories (no `user`) are shared across all users and must not be
 * edited or deleted by anyone; another user's category is treated as not found.
 *
 * @param {string} categoryId - Category id to load.
 * @param {string} userId - Requesting user's id.
 * @returns {Promise<import('mongoose').Document>} The owned category.
 * @throws {Error} 404 when missing or owned by another user; 403 for default categories.
 */
async function findModifiableCategory(categoryId, userId) {
  const category = await Category.findById(categoryId)
  if (!category || (category.user && category.user.toString() !== userId.toString())) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }
  if (category.isDefault || !category.user) {
    const err = new Error('Default categories cannot be modified')
    err.status = 403
    throw err
  }
  return category
}

export async function updateCategory(categoryId, data, userId) {
  const category = await findModifiableCategory(categoryId, userId)
  const { name, color, icon } = data
  if (name !== undefined) category.name = name
  if (color !== undefined) category.color = color
  if (icon !== undefined) category.icon = icon
  await category.save()
  return category
}

export async function deleteCategory(categoryId, userId) {
  const category = await findModifiableCategory(categoryId, userId)
  const inUse =
    (await Expense.exists({ category: categoryId })) || (await Budget.exists({ category: categoryId }))
  if (inUse) {
    const err = new Error('Category is in use by expenses or budgets and cannot be deleted')
    err.status = 409
    throw err
  }
  await category.deleteOne()
}
