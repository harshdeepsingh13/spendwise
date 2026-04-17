import { api } from '../lib/axios.js'

export const authService = {
  signup: async (email, password, displayName) => {
    const response = await api.post('/auth/signup', { email, password, displayName })
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  setupMfa: async () => {
    const response = await api.post('/auth/mfa/setup')
    return response.data
  },

  verifyMfaSetup: async (token) => {
    const response = await api.post('/auth/mfa/verify-setup', { token })
    return response.data
  },

  validateMfa: async (mfaChallengeToken, totpCode) => {
    const response = await api.post('/auth/mfa/validate', { mfaChallengeToken, totpCode })
    return response.data
  },

  disableMfa: async (token) => {
    const response = await api.delete('/auth/mfa', { data: { token } })
    return response.data
  },
}
