import { api } from '../lib/axios.js'

export const receiptService = {
  upload: async (file) => {
    const formData = new FormData()
    formData.append('receipt', file)
    const response = await api.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  getOcrStatus: async (id) => {
    const response = await api.get(`/receipts/${id}/ocr-status`)
    return response.data
  },

  getAll: async (params) => {
    const response = await api.get('/receipts', { params })
    return response.data
  },

  deleteReceipt: async (id) => {
    const response = await api.delete(`/receipts/${id}`)
    return response.data
  },

  updateReceipt: async ({ id, amount, name, tags, submitted }) => {
    const response = await api.patch(`/receipts/${id}`, { amount, name, tags, submitted })
    return response.data
  }
}
