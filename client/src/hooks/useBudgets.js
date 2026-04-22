import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '../services/budget.service.js'
import { queryKeys } from '../lib/queryKeys.js'

export const useBudgets = () => {
  return useQuery({
    queryKey: queryKeys.budgets.list,
    queryFn: budgetService.list
  })
}

export const useBudgetMutations = () => {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  }

  const create = useMutation({
    mutationFn: budgetService.create,
    onSuccess: invalidate
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => budgetService.update(id, data),
    onSuccess: invalidate
  })

  const remove = useMutation({
    mutationFn: budgetService.delete,
    onSuccess: invalidate
  })

  return { create, update, remove }
}
