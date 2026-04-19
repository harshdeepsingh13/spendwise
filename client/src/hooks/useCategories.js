import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/category.service'
import { queryKeys } from '../lib/queryKeys'

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoryService.list
  })
}

export const useCategoryMutations = () => {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    }
  })

  return {
    create: createMutation,
    delete: deleteMutation
  }
}
