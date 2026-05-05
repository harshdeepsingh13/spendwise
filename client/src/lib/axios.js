import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        localStorage.setItem('token', data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('token')
        window.location.href = '/?auth=login'
      }
    }
    // 402 passes through so TanStack Query error handlers can trigger ProGate UI
    return Promise.reject(error)
  }
)

