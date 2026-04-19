import { useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '../services/expense.service'
import { queryKeys } from '../lib/queryKeys'

export const useExpenseMutations = () => {
  const queryClient = useQueryClient()

  const invalidateExpensesAndAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  }

  const createMutation = useMutation({
    mutationFn: expenseService.create,
    onSuccess: invalidateExpensesAndAnalytics
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseService.update(id, data),
    onSuccess: invalidateExpensesAndAnalytics
  })

  const deleteMutation = useMutation({
    mutationFn: expenseService.delete,
    onSuccess: invalidateExpensesAndAnalytics
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation
  }
}
