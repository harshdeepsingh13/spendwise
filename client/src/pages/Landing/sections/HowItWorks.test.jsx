import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material'
import { theme } from '../../../theme/theme'
import HowItWorks from './HowItWorks'

// useScrollReveal uses IntersectionObserver which is unavailable in jsdom.
// Don't fire the callback in the constructor — the hook's callback closes over
// `observer` (a const) which isn't assigned yet at constructor call time (TDZ).
// DOM text content is still present at opacity:0 so getByText assertions work fine.
class IntersectionObserverMock {
  constructor() {
    this.observe = vi.fn()
    this.disconnect = vi.fn()
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

describe('HowItWorks', () => {
  it('renders without crashing', () => {
    render(<HowItWorks />, { wrapper })
  })

  it('renders the section with id="how"', () => {
    const { container } = render(<HowItWorks />, { wrapper })
    expect(container.querySelector('#how')).toBeInTheDocument()
  })

  it('displays the "How it works" overline label', () => {
    render(<HowItWorks />, { wrapper })
    expect(screen.getByText('How it works')).toBeInTheDocument()
  })

  it('displays the main heading', () => {
    render(<HowItWorks />, { wrapper })
    expect(screen.getByText('How SpendWise & Receipt Scanner Works')).toBeInTheDocument()
  })

  it('displays the subheading description', () => {
    render(<HowItWorks />, { wrapper })
    expect(
      screen.getByText('No setup, no complex onboarding. Sign up and start tracking immediately.')
    ).toBeInTheDocument()
  })

  it('renders all three step titles', () => {
    render(<HowItWorks />, { wrapper })
    expect(screen.getByText('1. Sign up free')).toBeInTheDocument()
    expect(screen.getByText('2. Log expenses')).toBeInTheDocument()
    expect(screen.getByText('3. See the picture')).toBeInTheDocument()
  })

  it('renders all three step icons', () => {
    render(<HowItWorks />, { wrapper })
    expect(screen.getByText('🔑')).toBeInTheDocument()
    expect(screen.getByText('💸')).toBeInTheDocument()
    expect(screen.getByText('📊')).toBeInTheDocument()
  })

  it('renders step descriptions', () => {
    render(<HowItWorks />, { wrapper })
    expect(screen.getByText(/Create your account with email or Google OAuth/)).toBeInTheDocument()
    expect(screen.getByText(/Add expenses manually or scan receipts/)).toBeInTheDocument()
    expect(screen.getByText(/Your dashboard updates in real time/)).toBeInTheDocument()
  })
})
