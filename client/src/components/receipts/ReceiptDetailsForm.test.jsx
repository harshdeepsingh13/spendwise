import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { theme } from '../../theme/theme'
import { ReceiptDetailsForm } from './ReceiptDetailsForm'

const wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

const renderForm = (props = {}) => {
  const defaults = {
    amount: '',
    onAmountChange: vi.fn(),
    tags: [],
    onTagsChange: vi.fn(),
    existingTags: [],
  }
  return render(<ReceiptDetailsForm {...defaults} {...props} />, { wrapper })
}

describe('ReceiptDetailsForm', () => {
  it('renders amount field', () => {
    renderForm()
    expect(screen.getByLabelText(/total amount/i)).toBeInTheDocument()
  })

  it('renders tags field', () => {
    renderForm()
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
  })

  it('calls onAmountChange when amount input changes', async () => {
    const onAmountChange = vi.fn()
    renderForm({ onAmountChange })
    await userEvent.type(screen.getByLabelText(/total amount/i), '42.50')
    expect(onAmountChange).toHaveBeenCalled()
  })

  it('displays the current amount value', () => {
    renderForm({ amount: '99.99' })
    expect(screen.getByLabelText(/total amount/i)).toHaveValue(99.99)
  })

  it('adds a tag on Enter key and calls onTagsChange', async () => {
    const onTagsChange = vi.fn()
    renderForm({ onTagsChange })
    const input = screen.getByPlaceholderText(/business expense/i)
    await userEvent.type(input, 'groceries{Enter}')
    expect(onTagsChange).toHaveBeenCalledWith(['groceries'])
  })

  it('adds a tag on comma key and strips the comma', async () => {
    const onTagsChange = vi.fn()
    renderForm({ onTagsChange })
    const input = screen.getByPlaceholderText(/business expense/i)
    await userEvent.type(input, 'travel,')
    expect(onTagsChange).toHaveBeenCalledWith(['travel'])
  })

  it('does not add a duplicate tag', async () => {
    const onTagsChange = vi.fn()
    renderForm({ tags: ['groceries'], onTagsChange })
    const input = screen.getByPlaceholderText(/business expense/i)
    await userEvent.type(input, 'groceries{Enter}')
    expect(onTagsChange).not.toHaveBeenCalled()
  })

  it('does not add a whitespace-only tag', async () => {
    const onTagsChange = vi.fn()
    renderForm({ tags: [], onTagsChange })
    const input = screen.getByPlaceholderText(/business expense/i)
    await userEvent.type(input, '   {Enter}')
    // MUI may call onChange internally; verify no whitespace tag was added
    const lastCall = onTagsChange.mock.lastCall
    if (lastCall) expect(lastCall[0]).toEqual([])
  })

  it('renders existing tags as chips', () => {
    renderForm({ tags: ['food', 'work'] })
    expect(screen.getByText('food')).toBeInTheDocument()
    expect(screen.getByText('work')).toBeInTheDocument()
  })

  it('shows helper text', () => {
    renderForm()
    expect(screen.getByText(/press enter or comma/i)).toBeInTheDocument()
  })
})
