import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { theme } from '../../theme/theme'
import { ReceiptEditDialog } from './ReceiptEditDialog'

vi.mock('../../hooks/useReceipt', () => ({
  useUpdateReceipt: vi.fn(),
  useDeleteReceipt: vi.fn(),
}))

import { useDeleteReceipt, useUpdateReceipt } from '../../hooks/useReceipt'

const mockReceipt = {
  id: 'receipt-1',
  cloudinaryUrl: 'https://example.com/receipt.jpg',
  fileType: 'image',
  createdAt: '2024-01-15T10:30:00Z',
  ocrStatus: 'done',
  ocrExtractedAmount: '42.50',
  tags: ['grocery', 'food'],
}

const wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

beforeEach(() => {
  useUpdateReceipt.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })
  useDeleteReceipt.mockReturnValue({ mutate: vi.fn(), isPending: false })
})

describe('ReceiptEditDialog', () => {
  it('renders nothing when receipt is null', () => {
    const { container } = render(
      <ReceiptEditDialog open={true} receipt={null} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders dialog title', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('Edit Receipt')).toBeInTheDocument()
  })

  it('shows receipt image for image type', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByAltText('Receipt preview')).toBeInTheDocument()
  })

  it('shows PDF icon for pdf type', () => {
    const pdfReceipt = {
      ...mockReceipt,
      fileType: 'pdf',
      cloudinaryUrl: 'https://example.com/receipt.pdf',
    }
    render(<ReceiptEditDialog open={true} receipt={pdfReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('PDF Receipt')).toBeInTheDocument()
  })

  it('shows formatted date', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
  })

  it('shows OCR status chip', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('done')).toBeInTheDocument()
  })

  it('pre-fills amount from receipt', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByLabelText(/total amount/i)).toHaveValue(42.5)
  })

  it('pre-fills tags from receipt', () => {
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('grocery')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
  })

  it('pre-fills empty amount when ocrExtractedAmount is null', () => {
    render(
      <ReceiptEditDialog open={true} receipt={{ ...mockReceipt, ocrExtractedAmount: null }} onClose={vi.fn()} />,
      { wrapper }
    )
    const amountInput = screen.getByLabelText(/total amount/i)
    expect(amountInput.value).toBe('')
  })

  it('calls updateReceipt and onClose when Save Changes is clicked', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    useUpdateReceipt.mockReturnValue({ mutateAsync, isPending: false })
    const onClose = vi.fn()
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={onClose} />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'receipt-1',
        amount: '42.50',
        tags: ['grocery', 'food'],
      })
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls deleteReceipt when Delete is clicked', async () => {
    const mutate = vi.fn()
    useDeleteReceipt.mockReturnValue({ mutate, isPending: false })
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(mutate).toHaveBeenCalledWith('receipt-1', expect.any(Object))
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={onClose} />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close icon is clicked', async () => {
    const onClose = vi.fn()
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={onClose} />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('disables buttons while saving', () => {
    useUpdateReceipt.mockReturnValue({ mutateAsync: vi.fn(), isPending: true })
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
  })

  it('disables buttons while deleting', () => {
    useDeleteReceipt.mockReturnValue({ mutate: vi.fn(), isPending: true })
    render(<ReceiptEditDialog open={true} receipt={mockReceipt} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
  })
})
