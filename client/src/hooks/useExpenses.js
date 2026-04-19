import { useQuery } from '@tanstack/react-query'
import { expenseService } from '../services/expense.service'
import { queryKeys } from '../lib/queryKeys'

export const useExpenses = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => expenseService.list(filters)
  })
}
