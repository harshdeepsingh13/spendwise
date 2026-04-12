import { Router } from 'express'
import { listCategories, createCategory, deleteCategory } from '../controllers/category.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listCategories)
router.post('/', createCategory)
router.delete('/:id', deleteCategory)

export default router
