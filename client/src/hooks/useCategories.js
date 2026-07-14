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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: invalidate
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.update(id, data),
    onSuccess: invalidate
  })

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: invalidate
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation
  }
}
