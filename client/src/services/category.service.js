import { api } from '../lib/axios.js'

export const categoryService = {
  list: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/categories', data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }
}
