import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('api axios instance', () => {
  let mockInstance
  let createSpy
  let mockPost

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()

    mockInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }

    createSpy = vi.fn(() => mockInstance)
    // The 401 interceptor calls the bare `axios.post('/api/auth/refresh')` for a silent refresh
    mockPost = vi.fn()

    vi.doMock('axios', () => ({
      default: { create: createSpy, post: mockPost }
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates axios instance with baseURL /api and withCredentials true', async () => {
    await import('./axios.js')
    expect(createSpy).toHaveBeenCalledWith({ baseURL: '/api', withCredentials: true })
  })

  it('exports the created instance as api', async () => {
    const { api } = await import('./axios.js')
    expect(api).toBe(mockInstance)
  })

  describe('request interceptor', () => {
    it('adds Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('token', 'test-token-abc')
      await import('./axios.js')
      const interceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptor(config)
      expect(result.headers.Authorization).toBe('Bearer test-token-abc')
    })

    it('does not add Authorization header when no token in localStorage', async () => {
      await import('./axios.js')
      const interceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {} }
      const result = interceptor(config)
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('returns the same config object', async () => {
      await import('./axios.js')
      const interceptor = mockInstance.interceptors.request.use.mock.calls[0][0]
      const config = { headers: {}, method: 'GET', url: '/expenses' }
      expect(interceptor(config)).toBe(config)
    })
  })

  describe('response interceptor', () => {
    it('passes successful responses through unchanged', async () => {
      await import('./axios.js')
      const successFn = mockInstance.interceptors.response.use.mock.calls[0][0]
      const response = { status: 200, data: { id: 1 } }
      expect(successFn(response)).toBe(response)
    })

    it('attempts a silent token refresh on 401', async () => {
      vi.stubGlobal('location', { href: '' })
      mockPost.mockRejectedValue(new Error('refresh failed'))
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      await errorFn({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh', {}, { withCredentials: true })
    })

    it('removes token from localStorage when the refresh fails', async () => {
      localStorage.setItem('token', 'valid-token')
      vi.stubGlobal('location', { href: '' })
      mockPost.mockRejectedValue(new Error('refresh failed'))
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      await errorFn({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(localStorage.getItem('token')).toBeNull()
    })

    it('redirects to /?auth=login when the refresh fails', async () => {
      vi.stubGlobal('location', { href: '' })
      mockPost.mockRejectedValue(new Error('refresh failed'))
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      await errorFn({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(window.location.href).toBe('/?auth=login')
    })

    it('rejects with the original error after a failed 401 refresh', async () => {
      vi.stubGlobal('location', { href: '' })
      mockPost.mockRejectedValue(new Error('refresh failed'))
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      const error = { response: { status: 401 }, config: { headers: {} } }
      await expect(errorFn(error)).rejects.toBe(error)
    })

    it('rejects but does not redirect for non-401 errors', async () => {
      vi.stubGlobal('location', { href: 'http://localhost/' })
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      const error = { response: { status: 500 } }
      await expect(errorFn(error)).rejects.toBe(error)
      expect(window.location.href).toBe('http://localhost/')
    })

    it('does not remove token for non-401 errors', async () => {
      localStorage.setItem('token', 'valid-token')
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      await errorFn({ response: { status: 403 } }).catch(() => {})
      expect(localStorage.getItem('token')).toBe('valid-token')
    })

    it('rejects network errors with no response', async () => {
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      const error = new Error('Network Error')
      await expect(errorFn(error)).rejects.toBe(error)
    })

    it('passes through 402 errors without redirecting', async () => {
      vi.stubGlobal('location', { href: 'http://localhost/' })
      await import('./axios.js')
      const errorFn = mockInstance.interceptors.response.use.mock.calls[0][1]
      const error = { response: { status: 402 } }
      await expect(errorFn(error)).rejects.toBe(error)
      expect(window.location.href).toBe('http://localhost/')
    })
  })
})
