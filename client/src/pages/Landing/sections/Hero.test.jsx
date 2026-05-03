import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../../theme/theme'
import Hero from './Hero'

vi.mock('../hooks/useParallax', () => ({
  useParallax: vi.fn(),
}))

vi.mock('../components/ThreeScene', () => ({
  default: () => <div data-testid="three-scene-mock" />,
}))

const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

describe('Hero', () => {
  const onOpenAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', async () => {
    await act(async () => {
      render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    })
  })

  it('shows the AI-powered insights badge', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByText('Now with AI-powered insights')).toBeInTheDocument()
  })

  it('shows the "Smart money." headline', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByText('Smart money.')).toBeInTheDocument()
  })

  it('shows the "Smarter you." headline', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByText('Smarter you.')).toBeInTheDocument()
  })

  it('shows the feature description', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByText(/Track expenses, scan receipts with OCR/i)).toBeInTheDocument()
  })

  it('shows the CTA button', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByRole('button', { name: /get started free/i })).toBeInTheDocument()
  })

  it('shows the "No credit card required" caption', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument()
  })

  it('calls onOpenAuth("signup") when CTA button is clicked', async () => {
    const user = userEvent.setup()
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /get started free/i }))

    expect(onOpenAuth).toHaveBeenCalledOnce()
    expect(onOpenAuth).toHaveBeenCalledWith('signup')
  })

  it('renders the lazy-loaded ThreeScene once Suspense resolves', async () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('three-scene-mock')).toBeInTheDocument()
    })
  })

  it('includes visually-hidden SEO h2 subtitle', () => {
    render(<Hero onOpenAuth={onOpenAuth} />, { wrapper })
    expect(
      screen.getByText(/SpendWise — Smart Budget App/i)
    ).toBeInTheDocument()
  })
})
