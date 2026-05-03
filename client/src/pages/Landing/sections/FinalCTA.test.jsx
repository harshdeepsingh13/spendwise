import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { MemoryRouter } from 'react-router-dom'
import { theme } from '../../../theme/theme'
import FinalCTA from './FinalCTA'

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => [{ current: null }, true],
}))

const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter>{children}</MemoryRouter>
  </ThemeProvider>
)

describe('FinalCTA', () => {
  it('renders without crashing', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
  })

  it('renders main heading text', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText('Start tracking your money')).toBeInTheDocument()
    expect(screen.getByText('for free, right now.')).toBeInTheDocument()
  })

  it('renders subheading text', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText(/Join thousands of people/)).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /Create free account/i })).toBeInTheDocument()
  })

  it('calls onOpenAuth("signup") when CTA button is clicked', async () => {
    const onOpenAuth = vi.fn()
    const user = userEvent.setup()
    render(<FinalCTA onOpenAuth={onOpenAuth} />, { wrapper: Wrapper })
    await user.click(screen.getByRole('button', { name: /Create free account/i }))
    expect(onOpenAuth).toHaveBeenCalledOnce()
    expect(onOpenAuth).toHaveBeenCalledWith('signup')
  })

  it('renders footer copyright text', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText(/Spendwise © 2026/)).toBeInTheDocument()
  })

  it('renders Privacy Policy link pointing to /privacy', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    const link = screen.getByText('Privacy Policy')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('renders Terms of Service link pointing to /terms', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    const link = screen.getByText('Terms of Service')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/terms')
  })

  it('renders Portfolio social link with correct href', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    const link = screen.getByText('Portfolio').closest('a')
    expect(link).toHaveAttribute('href', 'https://theharshdeepsingh.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders GitHub social link with correct href', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    const link = screen.getByText('GitHub').closest('a')
    expect(link).toHaveAttribute('href', 'https://github.com/harshdeepsingh13')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders author attribution', () => {
    render(<FinalCTA onOpenAuth={vi.fn()} />, { wrapper: Wrapper })
    expect(screen.getByText('Harshdeep Singh')).toBeInTheDocument()
  })
})
