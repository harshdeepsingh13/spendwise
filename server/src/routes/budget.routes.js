import { Router } from 'express'
import { listBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budget.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listBudgets)
router.post('/', createBudget)
router.put('/:id', updateBudget)
router.delete('/:id', deleteBudget)

export default router
