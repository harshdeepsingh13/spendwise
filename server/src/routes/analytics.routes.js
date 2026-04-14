import { Router } from 'express'
import { getDashboard, getMonthly, getYearly, getSummary, getKpi, getBudgetVsActual } from '../controllers/analytics.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/dashboard', getDashboard)
router.get('/monthly', getMonthly)
router.get('/yearly', getYearly)
router.get('/summary', getSummary)
router.get('/kpi', getKpi)
router.get('/budget-vs-actual', getBudgetVsActual)

export default router
