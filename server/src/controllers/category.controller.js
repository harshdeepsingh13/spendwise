import * as categoryService from '../services/category.service.js'

export const listCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.listCategories(req.user._id)
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body, req.user._id)
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body, req.user._id)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

export const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id, req.user._id)
    res.json({ message: 'Category deleted' })
  } catch (err) {
    next(err)
  }
}
