import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { vi } from 'vitest'
import Features from './Features'

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => [{ current: null }, true],
}))

const theme = createTheme()
const wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

describe('Features', () => {
  it('renders without crashing', () => {
    render(<Features />, { wrapper })
  })

  it('renders section overline and headings', () => {
    render(<Features />, { wrapper })
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Expense Tracking, OCR Receipts & Budget Tools')).toBeInTheDocument()
    expect(screen.getByText(/Built for people who want clarity/)).toBeInTheDocument()
  })

  it('renders all four feature card titles', () => {
    render(<Features />, { wrapper })
    expect(screen.getByText('Expense Tracking')).toBeInTheDocument()
    expect(screen.getByText('OCR Receipt Scanning')).toBeInTheDocument()
    expect(screen.getByText('Smart Analytics')).toBeInTheDocument()
    expect(screen.getByText('Budget Goals')).toBeInTheDocument()
  })

  it('renders all feature descriptions', () => {
    render(<Features />, { wrapper })
    expect(screen.getByText(/Log expenses instantly/)).toBeInTheDocument()
    expect(screen.getByText(/Snap a photo of any receipt/)).toBeInTheDocument()
    expect(screen.getByText(/Monthly trends/)).toBeInTheDocument()
    expect(screen.getByText(/Set monthly budgets per category/)).toBeInTheDocument()
  })

  it('renders all feature tags', () => {
    render(<Features />, { wrapper })
    expect(screen.getByText('Core')).toBeInTheDocument()
    expect(screen.getByText('AI-powered')).toBeInTheDocument()
    expect(screen.getByText('Insights')).toBeInTheDocument()
    expect(screen.getByText('Goals')).toBeInTheDocument()
  })

  it('renders all feature icons', () => {
    render(<Features />, { wrapper })
    expect(screen.getByText('💳')).toBeInTheDocument()
    expect(screen.getByText('📸')).toBeInTheDocument()
    expect(screen.getByText('📈')).toBeInTheDocument()
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('renders the features section with correct id', () => {
    const { container } = render(<Features />, { wrapper })
    expect(container.querySelector('#features')).toBeInTheDocument()
  })
})
