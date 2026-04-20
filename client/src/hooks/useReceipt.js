import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { receiptService } from '../services/receipt.service'
import { queryKeys } from '../lib/queryKeys'

export const useReceipts = (params) => {
  return useQuery({
    queryKey: queryKeys.receipts.list(params),
    queryFn: () => receiptService.getAll(params)
  })
}

export const useReceiptUpload = () => {
  return useMutation({
    mutationFn: receiptService.upload,
    retry: false
  })
}

export const useDeleteReceipt = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: receiptService.deleteReceipt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all })
  })
}

export const useUpdateReceipt = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: receiptService.updateReceipt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all })
  })
}

export const useOcrStatus = (receiptId) => {
  return useQuery({
    queryKey: queryKeys.receipts.ocrStatus(receiptId),
    queryFn: () => receiptService.getOcrStatus(receiptId),
    enabled: !!receiptId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000
      return data.ocrStatus === 'done' || data.ocrStatus === 'failed' ? false : 2000
    }
  })
}
