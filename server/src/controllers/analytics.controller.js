import * as analyticsService from '../services/analytics.service.js'

export const getDashboard = async (req, res, next) => {
  try {
    const result = await analyticsService.getDashboardData(req.user._id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getMonthly = async (req, res, next) => {
  try {
    const result = await analyticsService.getMonthlyData(req.user._id, req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getYearly = async (req, res, next) => {
  try {
    const result = await analyticsService.getYearlyData(req.user._id, req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query
    const result = await analyticsService.getSummary(req.user, { startDate, endDate, groupBy })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getKpi = async (req, res, next) => {
  try {
    const result = await analyticsService.getKpiData(req.user, req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getBudgetVsActual = async (req, res, next) => {
  try {
    const result = await analyticsService.getBudgetVsActual(req.user, req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
