import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from './App'

vi.mock('./pages/Landing', () => ({ default: () => <div>Landing Page</div> }))
vi.mock('./pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('./pages/Expenses', () => ({ default: () => <div>Expenses Page</div> }))
vi.mock('./pages/Analytics', () => ({ default: () => <div>Analytics Page</div> }))
vi.mock('./pages/Receipts', () => ({ default: () => <div>Receipts Page</div> }))
vi.mock('./pages/Privacy', () => ({ default: () => <div>Privacy Page</div> }))
vi.mock('./pages/Terms', () => ({ default: () => <div>Terms Page</div> }))
vi.mock('./pages/NotFound', () => ({ default: () => <div>Not Found Page</div> }))
vi.mock('./components/layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}))

const mockSetToken = vi.fn()
let mockToken = null

vi.mock('./context/AuthContext', () => ({
  useAuthContext: () => ({ token: mockToken, setToken: mockSetToken }),
}))

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken = null
    sessionStorage.clear()
  })

  describe('GuestRoute', () => {
    it('renders Landing page when unauthenticated at /', async () => {
      window.history.pushState({}, '', '/')
      render(<App />)
      expect(await screen.findByText('Landing Page')).toBeInTheDocument()
    })

    it('redirects authenticated user from / to /dashboard', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/')
      render(<App />)
      expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    })
  })

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated user from /dashboard to landing page', async () => {
      window.history.pushState({}, '', '/dashboard')
      render(<App />)
      expect(await screen.findByText('Landing Page')).toBeInTheDocument()
    })

    it('renders Dashboard when authenticated at /dashboard', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/dashboard')
      render(<App />)
      expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    })

    it('redirects unauthenticated user from /expenses to landing page', async () => {
      window.history.pushState({}, '', '/expenses')
      render(<App />)
      expect(await screen.findByText('Landing Page')).toBeInTheDocument()
    })

    it('renders Expenses page when authenticated', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/expenses')
      render(<App />)
      expect(await screen.findByText('Expenses Page')).toBeInTheDocument()
    })

    it('renders Analytics page when authenticated', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/analytics')
      render(<App />)
      expect(await screen.findByText('Analytics Page')).toBeInTheDocument()
    })

    it('renders Receipts page when authenticated', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/receipts')
      render(<App />)
      expect(await screen.findByText('Receipts Page')).toBeInTheDocument()
    })

    it('wraps protected content in Layout', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/dashboard')
      render(<App />)
      expect(await screen.findByTestId('layout')).toBeInTheDocument()
    })
  })

  describe('AuthCallback', () => {
    it('calls setToken with token from URL search params', async () => {
      window.history.pushState({}, '', '/auth/callback?token=abc123')
      render(<App />)
      await screen.findByText('Landing Page')
      expect(mockSetToken).toHaveBeenCalledWith('abc123')
    })

    it('does not call setToken when no token in URL', async () => {
      window.history.pushState({}, '', '/auth/callback')
      render(<App />)
      await screen.findByText('Landing Page')
      expect(mockSetToken).not.toHaveBeenCalled()
    })

    it('stores mfaChallengeToken in sessionStorage', async () => {
      window.history.pushState({}, '', '/auth/callback?mfaChallengeToken=xyz789')
      render(<App />)
      await screen.findByText('Landing Page')
      expect(sessionStorage.getItem('mfaChallengeToken')).toBe('xyz789')
    })

    it('navigates to landing page when mfaChallengeToken is present', async () => {
      window.history.pushState({}, '', '/auth/callback?mfaChallengeToken=xyz789')
      render(<App />)
      expect(await screen.findByText('Landing Page')).toBeInTheDocument()
    })

    it('navigates to /dashboard after token callback when authenticated', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/auth/callback?token=abc123')
      render(<App />)
      expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    })
  })

  describe('public routes', () => {
    it('renders Privacy page at /privacy', async () => {
      window.history.pushState({}, '', '/privacy')
      render(<App />)
      expect(await screen.findByText('Privacy Page')).toBeInTheDocument()
    })

    it('renders Terms page at /terms', async () => {
      window.history.pushState({}, '', '/terms')
      render(<App />)
      expect(await screen.findByText('Terms Page')).toBeInTheDocument()
    })
  })

  describe('catch-all route', () => {
    it('renders Not Found page for unknown paths when unauthenticated', async () => {
      window.history.pushState({}, '', '/unknown-route')
      render(<App />)
      expect(await screen.findByText('Not Found Page')).toBeInTheDocument()
    })

    it('renders Not Found page for unknown paths when authenticated', async () => {
      mockToken = 'test-token'
      window.history.pushState({}, '', '/unknown-route')
      render(<App />)
      expect(await screen.findByText('Not Found Page')).toBeInTheDocument()
    })
  })
})
