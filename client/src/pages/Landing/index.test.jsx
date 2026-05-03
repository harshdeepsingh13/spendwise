import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './index.jsx'

vi.mock('react-helmet-async', () => ({
  Helmet: () => null,
  HelmetProvider: ({ children }) => <>{children}</>,
}))

vi.mock('@mui/material', () => ({
  Box: ({ children, sx, ...rest }) => <div {...rest}>{children}</div>,
  Divider: () => <hr />,
  useTheme: () => ({
    palette: {
      background: { default: '#ffffff' },
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  }),
}))

vi.mock('@mui/material/styles', () => ({
  alpha: (color) => color,
}))

vi.mock('./components/LandingNav', () => ({
  default: ({ onOpenAuth }) => (
    <nav>
      <button onClick={() => onOpenAuth('signup')}>Nav Sign Up</button>
      <button onClick={() => onOpenAuth('login')}>Nav Login</button>
    </nav>
  ),
}))

vi.mock('./components/AuthModal', () => ({
  default: ({ open, defaultTab, onClose }) =>
    open ? (
      <div data-testid="auth-modal" data-tab={defaultTab}>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}))

vi.mock('./sections/Hero', () => ({
  default: ({ onOpenAuth }) => (
    <section data-testid="hero">
      <button onClick={() => onOpenAuth('signup')}>Hero Get Started</button>
    </section>
  ),
}))

vi.mock('./sections/SocialProof', () => ({
  default: () => <section data-testid="social-proof" />,
}))

vi.mock('./sections/Features', () => ({
  default: () => <section data-testid="features" />,
}))

vi.mock('./sections/HowItWorks', () => ({
  default: () => <section data-testid="how-it-works" />,
}))

vi.mock('./sections/Testimonials', () => ({
  default: () => <section data-testid="testimonials" />,
}))

vi.mock('./sections/FAQ', () => ({
  default: () => <section data-testid="faq" />,
}))

vi.mock('./sections/FinalCTA', () => ({
  default: ({ onOpenAuth }) => (
    <section data-testid="final-cta">
      <button onClick={() => onOpenAuth('signup')}>CTA Sign Up</button>
    </section>
  ),
}))

const renderInRouter = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <LandingPage />
    </MemoryRouter>
  )

describe('LandingPage', () => {
  it('renders without crashing', () => {
    renderInRouter()
  })

  it('renders all major sections', () => {
    renderInRouter()
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('social-proof')).toBeInTheDocument()
    expect(screen.getByTestId('features')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument()
    expect(screen.getByTestId('testimonials')).toBeInTheDocument()
    expect(screen.getByTestId('faq')).toBeInTheDocument()
    expect(screen.getByTestId('final-cta')).toBeInTheDocument()
  })

  it('auth modal is closed by default', () => {
    renderInRouter()
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
  })

  it('opens auth modal with signup tab from nav', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('Nav Sign Up'))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'signup')
  })

  it('opens auth modal with login tab from nav', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('Nav Login'))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'login')
  })

  it('closes auth modal when onClose is called', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('Nav Sign Up'))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close Modal'))
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
  })

  it('opens auth modal with signup tab from Hero section', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('Hero Get Started'))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'signup')
  })

  it('opens auth modal with signup tab from FinalCTA section', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('CTA Sign Up'))
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'signup')
  })

  it('switches auth tab correctly between calls', () => {
    renderInRouter()
    fireEvent.click(screen.getByText('Nav Login'))
    expect(screen.getByTestId('auth-modal')).toHaveAttribute('data-tab', 'login')
    fireEvent.click(screen.getByText('Close Modal'))
    fireEvent.click(screen.getByText('Nav Sign Up'))
    expect(screen.getByTestId('auth-modal')).toHaveAttribute('data-tab', 'signup')
  })

  it('auto-opens modal with login tab when ?auth=login in URL', () => {
    renderInRouter(['/?auth=login'])
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'login')
  })

  it('auto-opens modal with signup tab when ?auth=signup in URL', () => {
    renderInRouter(['/?auth=signup'])
    const modal = screen.getByTestId('auth-modal')
    expect(modal).toBeInTheDocument()
    expect(modal).toHaveAttribute('data-tab', 'signup')
  })

  it('does not auto-open modal for unrecognised ?auth= values', () => {
    renderInRouter(['/?auth=register'])
    expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
  })
})
