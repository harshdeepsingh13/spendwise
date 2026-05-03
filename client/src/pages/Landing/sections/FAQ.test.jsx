import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider, createTheme } from '@mui/material'
import { vi } from 'vitest'
import FAQ from './FAQ'

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => [{ current: null }, true],
}))

const theme = createTheme()
const wrapper = ({ children }) => (
  <HelmetProvider>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </HelmetProvider>
)

describe('FAQ', () => {
  it('renders without crashing', () => {
    render(<FAQ />, { wrapper })
  })

  it('shows section heading and subtitle', () => {
    render(<FAQ />, { wrapper })
    expect(screen.getByText('SpendWise FAQ')).toBeInTheDocument()
    expect(screen.getByText('Everything you need to know about Spendwise.')).toBeInTheDocument()
  })

  it('renders all 6 FAQ questions', () => {
    render(<FAQ />, { wrapper })
    expect(screen.getByText('Is Spendwise really free to use?')).toBeInTheDocument()
    expect(screen.getByText('How does OCR receipt scanning work?')).toBeInTheDocument()
    expect(screen.getByText('Is my financial data secure?')).toBeInTheDocument()
    expect(screen.getByText('Can I sign up with Google?')).toBeInTheDocument()
    expect(screen.getByText('What expense categories are supported?')).toBeInTheDocument()
    expect(screen.getByText('How does budget tracking work?')).toBeInTheDocument()
  })

  it('renders all 6 FAQ answers in the DOM', () => {
    render(<FAQ />, { wrapper })
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument()
    expect(screen.getByText(/Tesseract-powered OCR/i)).toBeInTheDocument()
    expect(screen.getByText(/bcrypt/i)).toBeInTheDocument()
    expect(screen.getByText(/one-click Google OAuth/i)).toBeInTheDocument()
    expect(screen.getByText(/custom categories/i)).toBeInTheDocument()
    expect(screen.getByText(/monthly spending limit/i)).toBeInTheDocument()
  })

  it('all accordion items start collapsed', () => {
    render(<FAQ />, { wrapper })
    const accordionButtons = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-expanded'))
    accordionButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('expands an accordion item when its header is clicked', async () => {
    const user = userEvent.setup()
    render(<FAQ />, { wrapper })

    const questionText = screen.getByText('Is Spendwise really free to use?')
    await user.click(questionText)

    const accordionBtn = questionText.closest('[role="button"]')
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses an expanded item when clicked again', async () => {
    const user = userEvent.setup()
    render(<FAQ />, { wrapper })

    const questionText = screen.getByText('Is Spendwise really free to use?')
    await user.click(questionText)
    await user.click(questionText)

    const accordionBtn = questionText.closest('[role="button"]')
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('only one accordion is expanded at a time', async () => {
    const user = userEvent.setup()
    render(<FAQ />, { wrapper })

    await user.click(screen.getByText('Is Spendwise really free to use?'))
    await user.click(screen.getByText('Is my financial data secure?'))

    const accordionButtons = screen.getAllByRole('button').filter(b => b.hasAttribute('aria-expanded'))
    const expandedButtons = accordionButtons.filter(b => b.getAttribute('aria-expanded') === 'true')
    expect(expandedButtons).toHaveLength(1)
  })

  it('renders a section element with id="faq"', () => {
    render(<FAQ />, { wrapper })
    expect(document.getElementById('faq')).toBeInTheDocument()
  })
})
