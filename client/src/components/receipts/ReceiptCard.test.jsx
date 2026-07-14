import { ThemeProvider } from '@mui/material/styles'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ReceiptCard } from './ReceiptCard'
import { theme } from '../../theme/theme'

vi.mock('../../hooks/useReceipt', () => ({
  useDeleteReceipt: vi.fn(),
  useUpdateReceipt: vi.fn(),
}))

import { useDeleteReceipt, useUpdateReceipt } from '../../hooks/useReceipt'

const mockReceipt = {
  id: 'receipt-1',
  cloudinaryUrl: 'https://example.com/receipt.jpg',
  createdAt: '2024-01-15T10:30:00Z',
  ocrStatus: 'done',
  ocrExtractedAmount: '42.50',
  tags: ['grocery', 'food'],
}

const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

beforeEach(() => {
  useDeleteReceipt.mockReturnValue({ mutate: vi.fn(), isPending: false })
  useUpdateReceipt.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false })
})

describe('ReceiptCard', () => {
  it('renders without crashing', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.getByRole('img', { name: /receipt/i })).toBeInTheDocument()
  })

  it('displays formatted date', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
  })

  it('displays ocrStatus chip', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.getByText('done')).toBeInTheDocument()
  })

  it('displays extracted amount when present', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.getByText('$42.50')).toBeInTheDocument()
  })

  it('does not display amount when ocrExtractedAmount is absent', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, ocrExtractedAmount: null }} />, { wrapper })
    expect(screen.queryByText(/^\$\d/)).not.toBeInTheDocument()
  })

  it('renders all tags when provided', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.getByText('grocery')).toBeInTheDocument()
    expect(screen.getByText('food')).toBeInTheDocument()
  })

  it('does not render tags when tags array is empty', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, tags: [] }} />, { wrapper })
    expect(screen.queryByText('grocery')).not.toBeInTheDocument()
  })

  it('does not render tags when tags is undefined', () => {
    const { tags: _, ...receiptWithoutTags } = mockReceipt
    render(<ReceiptCard receipt={receiptWithoutTags} />, { wrapper })
    expect(screen.queryByText('grocery')).not.toBeInTheDocument()
  })

  it('calls onTagClick with tag name when tag chip is clicked', async () => {
    const onTagClick = vi.fn()
    render(<ReceiptCard receipt={mockReceipt} onTagClick={onTagClick} />, { wrapper })
    await userEvent.click(screen.getByText('grocery'))
    expect(onTagClick).toHaveBeenCalledWith('grocery')
  })

  it('does not throw when onTagClick is not provided and tag is clicked', async () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    await expect(userEvent.click(screen.getByText('food'))).resolves.toBeUndefined()
  })

  it('tag chip click does not propagate to card', async () => {
    const cardClickHandler = vi.fn()
    const onTagClick = vi.fn()
    render(
      <div onClick={cardClickHandler}>
        <ReceiptCard receipt={mockReceipt} onTagClick={onTagClick} />
      </div>,
      { wrapper }
    )
    await userEvent.click(screen.getByText('grocery'))
    expect(onTagClick).toHaveBeenCalledWith('grocery')
    expect(cardClickHandler).not.toHaveBeenCalled()
  })

  it('calls deleteReceipt with receipt id when delete button is clicked', async () => {
    const mutate = vi.fn()
    useDeleteReceipt.mockReturnValue({ mutate, isPending: false })
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    const deleteBtn = screen.getByTestId('DeleteOutlinedIcon').closest('button')
    await userEvent.click(deleteBtn)
    expect(mutate).toHaveBeenCalledWith('receipt-1')
  })

  it('disables delete button while deleting is in progress', () => {
    useDeleteReceipt.mockReturnValue({ mutate: vi.fn(), isPending: true })
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    const deleteBtn = screen.getByTestId('DeleteOutlinedIcon').closest('button')
    expect(deleteBtn).toBeDisabled()
  })

  it('shows pending status chip with correct color mapping', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, ocrStatus: 'pending' }} />, { wrapper })
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows failed status chip', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, ocrStatus: 'failed' }} />, { wrapper })
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('stopPropagation is called on delete button click', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    const deleteBtn = screen.getByTestId('DeleteOutlinedIcon').closest('button')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    const stopPropSpy = vi.spyOn(clickEvent, 'stopPropagation')
    fireEvent(deleteBtn, clickEvent)
    expect(stopPropSpy).toHaveBeenCalled()
  })

  it('opens edit dialog when card is clicked', async () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    const card = screen.getByRole('img', { name: /receipt/i }).closest('.MuiCard-root')
    await userEvent.click(card)
    expect(screen.getByText('Edit Receipt')).toBeInTheDocument()
  })

  it('displays receipt name when provided', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, name: 'Grocery Store' }} />, { wrapper })
    expect(screen.getByText('Grocery Store')).toBeInTheDocument()
  })

  it('does not display name section when name is absent', () => {
    const { name: _, ...receiptWithoutName } = mockReceipt
    render(<ReceiptCard receipt={receiptWithoutName} />, { wrapper })
    expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument()
  })

  it('shows PDF badge when fileType is pdf', () => {
    render(<ReceiptCard receipt={{ ...mockReceipt, fileType: 'pdf', cloudinaryUrl: 'https://example.com/receipt.pdf' }} />, { wrapper })
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('does not show PDF badge when fileType is not pdf', () => {
    render(<ReceiptCard receipt={mockReceipt} />, { wrapper })
    expect(screen.queryByText('PDF')).not.toBeInTheDocument()
  })

  describe('selectionMode', () => {
    it('shows checkbox icon instead of delete button in selection mode', () => {
      render(<ReceiptCard receipt={mockReceipt} selectionMode />, { wrapper })
      expect(screen.queryByTestId('DeleteOutlinedIcon')).not.toBeInTheDocument()
      expect(screen.getByTestId('CheckBoxOutlineBlankIcon')).toBeInTheDocument()
    })

    it('shows checked checkbox icon when selected in selection mode', () => {
      render(<ReceiptCard receipt={mockReceipt} selectionMode selected />, { wrapper })
      expect(screen.getByTestId('CheckBoxIcon')).toBeInTheDocument()
      expect(screen.queryByTestId('CheckBoxOutlineBlankIcon')).not.toBeInTheDocument()
    })

    it('calls onSelect with receipt id when card is clicked in selection mode', async () => {
      const onSelect = vi.fn()
      render(<ReceiptCard receipt={mockReceipt} selectionMode onSelect={onSelect} />, { wrapper })
      const card = screen.getByRole('img', { name: /receipt/i }).closest('.MuiCard-root')
      await userEvent.click(card)
      expect(onSelect).toHaveBeenCalledWith('receipt-1')
    })

    it('calls onSelect with receipt id when checkbox button is clicked in selection mode', async () => {
      const onSelect = vi.fn()
      render(<ReceiptCard receipt={mockReceipt} selectionMode onSelect={onSelect} />, { wrapper })
      const checkboxBtn = screen.getByTestId('CheckBoxOutlineBlankIcon').closest('button')
      await userEvent.click(checkboxBtn)
      expect(onSelect).toHaveBeenCalledWith('receipt-1')
    })

    it('does not open edit dialog when card is clicked in selection mode', async () => {
      const onSelect = vi.fn()
      render(<ReceiptCard receipt={mockReceipt} selectionMode onSelect={onSelect} />, { wrapper })
      const card = screen.getByRole('img', { name: /receipt/i }).closest('.MuiCard-root')
      await userEvent.click(card)
      expect(screen.queryByText('Edit Receipt')).not.toBeInTheDocument()
    })

    it('does not throw when onSelect is not provided and card is clicked in selection mode', async () => {
      render(<ReceiptCard receipt={mockReceipt} selectionMode />, { wrapper })
      const card = screen.getByRole('img', { name: /receipt/i }).closest('.MuiCard-root')
      await expect(userEvent.click(card)).resolves.toBeUndefined()
    })
  })
})
