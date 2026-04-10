import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import helmet from 'helmet'
import { env } from './config/env.js'
import './config/passport.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import authRoutes from './routes/auth.routes.js'
import expenseRoutes from './routes/expense.routes.js'
import categoryRoutes from './routes/category.routes.js'
import receiptRoutes from './routes/receipt.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import budgetRoutes from './routes/budget.routes.js'

export const createApp = () => {
  const app = express()

  // Middleware
  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())
  app.use(passport.initialize())

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/expenses', expenseRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/receipts', receiptRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/budgets', budgetRoutes)

  // Error handler
  app.use(errorHandler)

  return app
}
