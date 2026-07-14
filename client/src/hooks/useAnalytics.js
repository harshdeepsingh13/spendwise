import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analytics.service'
import { queryKeys } from '../lib/queryKeys'

export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: analyticsService.getDashboard
  })
}

export const useSummary = (startDate, endDate, groupBy = 'category') => {
  return useQuery({
    queryKey: queryKeys.analytics.summary(startDate, endDate, groupBy),
    queryFn: () => analyticsService.getSummary(startDate, endDate, groupBy),
    enabled: !!startDate && !!endDate
  })
}

export const useKpi = (year, month) => {
  return useQuery({
    queryKey: queryKeys.analytics.kpi(year, month),
    queryFn: () => analyticsService.getKpi(year, month),
    enabled: !!year && !!month
  })
}

export const useBudgetVsActual = (year, month) => {
  return useQuery({
    queryKey: queryKeys.analytics.budgetVsActual(year, month),
    queryFn: () => analyticsService.getBudgetVsActual(year, month),
    enabled: !!year && !!month
  })
}

