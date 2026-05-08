import { Expense } from '../models/Expense.model.js'
import { Budget } from '../models/Budget.model.js'
import { assertHistoryAccess } from '../utils/tierGate.js'

export async function getDashboardData(userId) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const currentMonth = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startOfMonth } } },
    { $group: { _id: '$category', total: { $sum: { $toDouble: '$amount' } } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } }
  ])

  const lastMonth = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
    { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
  ])

  const recent = await Expense.find({ user: userId }).populate('category').sort({ date: -1 }).limit(5)

  const currentTotal = currentMonth.reduce((sum, cat) => sum + cat.total, 0)
  const lastTotal = lastMonth[0]?.total || 0
  const momPercent = lastTotal ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

  return { currentMonth: currentTotal, lastMonth: lastTotal, momPercent, byCategory: currentMonth, recent }
}

export async function getMonthlyData(userId, { year, month }) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const expenses = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { category: '$category', day: { $dayOfMonth: '$date' } },
        total: { $sum: { $toDouble: '$amount' } }
      }
    },
    { $lookup: { from: 'categories', localField: '_id.category', foreignField: '_id', as: 'categoryInfo' } },
    { $sort: { '_id.day': 1 } }
  ])

  return { expenses, year, month }
}

export async function getYearlyData(userId, { year }) {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const expenses = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { month: { $month: '$date' }, category: '$category' },
        total: { $sum: { $toDouble: '$amount' } }
      }
    },
    { $lookup: { from: 'categories', localField: '_id.category', foreignField: '_id', as: 'categoryInfo' } },
    { $sort: { '_id.month': 1 } }
  ])

  return { expenses, year }
}

export async function getSummary(user, { startDate, endDate, groupBy = 'category' }) {
  assertHistoryAccess(user, startDate)

  const groupStage = {
    category: { _id: '$category', total: { $sum: { $toDouble: '$amount' } } },
    day: { _id: { day: { $dayOfMonth: '$date' }, month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: { $toDouble: '$amount' } } },
    month: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: { $toDouble: '$amount' } } }
  }

  const pipeline = [
    { $match: { user: user._id, date: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
    { $group: groupStage[groupBy] || groupStage.category }
  ]

  if (groupBy === 'category') {
    pipeline.push({ $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } })
  }

  const sortStage = groupBy === 'category' ? { total: -1 } : { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
  pipeline.push({ $sort: sortStage })

  const totals = await Expense.aggregate(pipeline)
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0)

  return { totals, grandTotal, period: { startDate, endDate } }
}

export async function getKpiData(user, { year, month }) {
  const now = new Date()
  const y = parseInt(year) || now.getFullYear()
  const m = parseInt(month) || now.getMonth() + 1

  const periodStart = new Date(y, m - 1, 1)
  const periodEnd = new Date(y, m, 0, 23, 59, 59)
  const lastMonthStart = new Date(y, m - 2, 1)
  const lastMonthEnd = new Date(y, m - 1, 0, 23, 59, 59)

  const [currentMonthAgg, lastMonthAgg, budgets] = await Promise.all([
    Expense.aggregate([
      { $match: { user: user._id, date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: '$category', total: { $sum: { $toDouble: '$amount' } } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $sort: { total: -1 } }
    ]),
    Expense.aggregate([
      { $match: { user: user._id, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
    ]),
    Budget.find({ user: user._id, effectiveTo: null }).lean()
  ])

  const currentTotal = currentMonthAgg.reduce((sum, c) => sum + c.total, 0)
  const lastTotal = lastMonthAgg[0]?.total || 0
  const momPctChange = lastTotal ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0

  const topCategory = currentMonthAgg[0]
    ? { name: currentMonthAgg[0].categoryInfo[0]?.name || 'Unknown', total: currentMonthAgg[0].total }
    : null

  let budgetHealthScore = null
  if (budgets.length > 0) {
    const actuals = await Expense.aggregate([
      { $match: { user: user._id, date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: '$category', actual: { $sum: { $toDouble: '$amount' } } } }
    ])
    const actualMap = Object.fromEntries(actuals.map(a => [a._id.toString(), a.actual]))
    const healthy = budgets.filter(b => {
      const actual = actualMap[b.category.toString()] || 0
      const budgetAmt = parseFloat(b.amount.toString())
      return actual / budgetAmt < 0.8
    })
    budgetHealthScore = Math.round((healthy.length / budgets.length) * 100)
  }

  return { currentMonthTotal: currentTotal, momPctChange, topCategory, budgetHealthScore }
}

export async function getBudgetVsActual(user, { year, month }) {
  const now = new Date()
  const y = parseInt(year) || now.getFullYear()
  const m = parseInt(month) || now.getMonth() + 1

  const periodStart = new Date(y, m - 1, 1)
  const periodEnd = new Date(y, m, 0, 23, 59, 59)

  const [budgets, actuals] = await Promise.all([
    Budget.find({
      user: user._id,
      effectiveFrom: { $lte: periodEnd },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: periodStart } }]
    }).populate('category'),
    Expense.aggregate([
      { $match: { user: user._id, date: { $gte: periodStart, $lte: periodEnd } } },
      { $group: { _id: '$category', actual: { $sum: { $toDouble: '$amount' } } } }
    ])
  ])

  const actualMap = Object.fromEntries(actuals.map(a => [a._id.toString(), a.actual]))

  return budgets.map(b => {
    const budgetAmt = parseFloat(b.amount.toString())
    const actual = actualMap[b.category._id.toString()] || 0
    const pct = budgetAmt > 0 ? (actual / budgetAmt) * 100 : 0
    const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
    return { budget: { id: b._id, category: b.category, amount: budgetAmt }, actual, pct, status }
  })
}
