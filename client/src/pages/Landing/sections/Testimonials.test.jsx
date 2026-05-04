import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { HelmetProvider } from 'react-helmet-async'
import { vi } from 'vitest'
import Testimonials from './Testimonials'

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => [{ current: null }, true],
}))

const theme = createTheme()
const wrapper = ({ children }) => (
  <HelmetProvider>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </HelmetProvider>
)

describe('Testimonials', () => {
  it('renders without crashing', () => {
    render(<Testimonials />, { wrapper })
  })

  it('shows the section heading', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText('What SpendWise Users Are Saying')).toBeInTheDocument()
  })

  it('shows the overline label', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText('Testimonials')).toBeInTheDocument()
  })

  it('renders all three testimonial names', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText('Alex M.')).toBeInTheDocument()
    expect(screen.getByText('Sarah K.')).toBeInTheDocument()
    expect(screen.getByText('James R.')).toBeInTheDocument()
  })

  it('renders all three reviewer roles', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText('Freelance designer')).toBeInTheDocument()
    expect(screen.getByText('Product manager')).toBeInTheDocument()
    expect(screen.getByText('Software engineer')).toBeInTheDocument()
  })

  it('renders three 5-star ratings', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getAllByText('★★★★★')).toHaveLength(3)
  })

  it('renders avatar initials for each reviewer', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders testimonial quote text', () => {
    render(<Testimonials />, { wrapper })
    expect(screen.getByText(/OCR is scarily accurate/)).toBeInTheDocument()
    expect(screen.getByText(/cut dining spend by 30%/)).toBeInTheDocument()
    expect(screen.getByText(/Set up in 2 minutes/)).toBeInTheDocument()
  })
})
