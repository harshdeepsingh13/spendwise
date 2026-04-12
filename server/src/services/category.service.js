import { Category } from '../models/Category.model.js'

export async function listCategories(userId) {
  return Category.find({ $or: [{ user: userId }, { isDefault: true }] })
}

export async function createCategory(data, userId) {
  const category = new Category({ ...data, user: userId })
  await category.save()
  return category
}

export async function deleteCategory(categoryId, userId) {
  const category = await Category.findById(categoryId)
  if (!category || (category.user && category.user.toString() !== userId.toString())) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }
  await category.deleteOne()
}
