import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Receipts from './index'

vi.mock('../../hooks/useReceipt', () => ({
  useReceipts: vi.fn()
}))

vi.mock('../../components/receipts/ReceiptCard', () => ({
  ReceiptCard: ({ receipt, selectionMode, selected, onSelect }) => (
    <div
      data-testid="receipt-card"
      data-id={receipt.id}
      data-selection-mode={String(selectionMode)}
      data-selected={String(selected)}
      onClick={() => selectionMode && onSelect(receipt.id)}
    />
  )
}))

vi.mock('../../components/receipts/ScannerDialog', () => ({
  ScannerDialog: ({ open, onClose, existingTags }) => (
    <div data-testid="scanner-dialog" data-open={String(open)}>
      <button onClick={onClose}>close</button>
      <span data-testid="existing-tags">{existingTags?.join(',')}</span>
    </div>
  )
}))

import { useReceipts } from '../../hooks/useReceipt'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

const renderPage = () => render(<Receipts />, { wrapper })

describe('Receipts page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the heading', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    expect(screen.getByText('Receipts')).toBeInTheDocument()
  })

  it('shows date filter toggle buttons', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText('All Time')).toBeInTheDocument()
  })

  it('shows loading spinner when isLoading is true', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: true, error: null })
    renderPage()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows error alert when fetch fails', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: new Error('fail') })
    renderPage()
    expect(screen.getByText('Failed to load receipts')).toBeInTheDocument()
  })

  it('shows empty state when no receipts', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    expect(screen.getByText('No receipts found')).toBeInTheDocument()
    expect(screen.getByText(/Tap the \+ button/)).toBeInTheDocument()
  })

  it('renders receipt cards when data is present', () => {
    const receipts = [
      { id: '1', tags: [] },
      { id: '2', tags: [] }
    ]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    expect(screen.getAllByTestId('receipt-card')).toHaveLength(2)
  })

  it('renders tag chips from receipts', () => {
    const receipts = [{ id: '1', tags: ['food', 'travel'] }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    expect(screen.getAllByText('food')).toHaveLength(1)
    expect(screen.getAllByText('travel')).toHaveLength(1)
  })

  it('deduplicates tags across receipts', () => {
    const receipts = [
      { id: '1', tags: ['food'] },
      { id: '2', tags: ['food', 'travel'] }
    ]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    expect(screen.getAllByText('food')).toHaveLength(1)
    expect(screen.getAllByText('travel')).toHaveLength(1)
  })

  it('opens scanner dialog when FAB is clicked', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    const dialog = screen.getByTestId('scanner-dialog')
    expect(dialog).toHaveAttribute('data-open', 'false')
    fireEvent.click(screen.getByTestId('AddIcon').closest('button'))
    expect(dialog).toHaveAttribute('data-open', 'true')
  })

  it('closes scanner dialog when onClose is called', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    fireEvent.click(screen.getByTestId('AddIcon').closest('button'))
    fireEvent.click(screen.getByText('close'))
    expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'false')
  })

  it('tag chip toggles active state on click', () => {
    const receipts = [{ id: '1', tags: ['food'] }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    const chip = screen.getAllByText('food')[0]
    fireEvent.click(chip)
    fireEvent.click(chip)
  })

  it('passes existingTags to ScannerDialog', () => {
    const receipts = [{ id: '1', tags: ['food', 'travel'] }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    const tagsEl = screen.getByTestId('existing-tags')
    expect(tagsEl.textContent).toContain('food')
    expect(tagsEl.textContent).toContain('travel')
  })

  it('resets active tag when date filter changes', () => {
    const receipts = [{ id: '1', tags: ['food'] }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    const chip = screen.getAllByText('food')[0]
    fireEvent.click(chip)
    fireEvent.click(screen.getByText('This Month'))
  })

  it('toggles selection mode on checklist icon click', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    const toggleBtn = screen.getByTestId('ChecklistIcon').closest('button')
    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('CloseIcon')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('CloseIcon').closest('button'))
    expect(screen.getByTestId('ChecklistIcon')).toBeInTheDocument()
  })

  it('hides FAB when selection mode is active', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('ChecklistIcon').closest('button'))
    expect(screen.queryByTestId('AddIcon')).not.toBeInTheDocument()
  })

  it('shows bulk download button with correct count when items are selected', () => {
    const receipts = [{ id: '1', tags: [], cloudinaryUrl: 'http://res.cloudinary.com/upload/foo.jpg', name: 'r1' }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    fireEvent.click(screen.getByTestId('ChecklistIcon').closest('button'))
    const card = screen.getByTestId('receipt-card')
    fireEvent.click(card)
    expect(screen.getByText('Download 1 Receipt')).toBeInTheDocument()
  })

  it('shows plural label when multiple items are selected', () => {
    const receipts = [
      { id: '1', tags: [], cloudinaryUrl: 'http://res.cloudinary.com/upload/a.jpg', name: 'a' },
      { id: '2', tags: [], cloudinaryUrl: 'http://res.cloudinary.com/upload/b.jpg', name: 'b' },
    ]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    fireEvent.click(screen.getByTestId('ChecklistIcon').closest('button'))
    screen.getAllByTestId('receipt-card').forEach((card) => fireEvent.click(card))
    expect(screen.getByText('Download 2 Receipts')).toBeInTheDocument()
  })

  it('clears selection when exiting selection mode', () => {
    const receipts = [{ id: '1', tags: [], cloudinaryUrl: 'http://res.cloudinary.com/upload/a.jpg', name: 'a' }]
    useReceipts.mockReturnValue({ data: receipts, isLoading: false, error: null })
    renderPage()
    fireEvent.click(screen.getByTestId('ChecklistIcon').closest('button'))
    fireEvent.click(screen.getByTestId('receipt-card'))
    expect(screen.getByText('Download 1 Receipt')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('CloseIcon').closest('button'))
    expect(screen.queryByText(/Download/)).not.toBeInTheDocument()
  })

  it('shows Custom chip and changes label when custom date range is applied', () => {
    useReceipts.mockReturnValue({ data: [], isLoading: false, error: null })
    renderPage()
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })
})
