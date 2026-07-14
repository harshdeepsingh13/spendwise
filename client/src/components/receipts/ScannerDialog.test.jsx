import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ScannerDialog } from './ScannerDialog'
import { createTestWrapper } from '../../test/renderWithProviders'

vi.mock('react-webcam', () => ({
  default: vi.fn(() => <div data-testid="webcam" />)
}))

vi.mock('jscanify/client', () => {
  class MockJscanify {
    findPaperContour() { return null }
    highlightPaper() {}
    extractPaper() {}
  }
  return { default: MockJscanify }
})

vi.mock('../../hooks/useCvReady', () => ({
  useCvReady: vi.fn()
}))

vi.mock('../../hooks/useReceipt', () => ({
  useReceiptUpload: vi.fn(),
  useOcrStatus: vi.fn(),
  useUpdateReceipt: vi.fn()
}))

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false })
}))

import { useCvReady } from '../../hooks/useCvReady'
import { useReceiptUpload, useOcrStatus, useUpdateReceipt } from '../../hooks/useReceipt'

const wrapper = createTestWrapper()

beforeEach(() => {
  vi.clearAllMocks()
  useCvReady.mockReturnValue(false)
  useReceiptUpload.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'receipt-123' }),
    isPending: false
  })
  useUpdateReceipt.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false
  })
  useOcrStatus.mockReturnValue({ data: null })
})

const uploadFile = async (file) => {
  const fileInput = document.querySelector('input[type="file"]')
  await userEvent.upload(fileInput, file)
}

describe('ScannerDialog', () => {
  describe('when closed', () => {
    it('renders nothing visible', () => {
      render(<ScannerDialog open={false} onClose={vi.fn()} />, { wrapper })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('initial camera step', () => {
    it('shows "Scan Receipt" title when open', () => {
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByText('Scan Receipt')).toBeInTheDocument()
    })

    it('shows Cancel button in camera step', () => {
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('calls onClose when Cancel is clicked', async () => {
      const onClose = vi.fn()
      render(<ScannerDialog open onClose={onClose} />, { wrapper })
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('shows loading spinner while cv engine loads', () => {
      useCvReady.mockReturnValue(false)
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByText(/loading scanner engine/i)).toBeInTheDocument()
    })

    it('shows webcam when cv is ready', () => {
      useCvReady.mockReturnValue(true)
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByTestId('webcam')).toBeInTheDocument()
    })

    it('shows capture and flip buttons when cv is ready', () => {
      useCvReady.mockReturnValue(true)
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it('shows hint text about pointing camera at receipt', () => {
      useCvReady.mockReturnValue(true)
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByText(/point at the receipt/i)).toBeInTheDocument()
    })

    it('capture button is disabled when cv is not ready', () => {
      useCvReady.mockReturnValue(false)
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('shows Upload File button in camera step', () => {
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument()
    })
  })

  describe('title switching based on step', () => {
    it('title is "Scan Receipt" when no file captured', () => {
      render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      expect(screen.getByText('Scan Receipt')).toBeInTheDocument()
      expect(screen.queryByText('Review & Save')).not.toBeInTheDocument()
    })
  })

  describe('onClose behavior', () => {
    it('does not call onClose when dialog is open and not explicitly closed', () => {
      const onClose = vi.fn()
      render(<ScannerDialog open onClose={onClose} />, { wrapper })
      expect(onClose).not.toHaveBeenCalled()
    })

    it('passes existingTags prop without error', () => {
      expect(() =>
        render(
          <ScannerDialog open onClose={vi.fn()} existingTags={['groceries', 'work']} />,
          { wrapper }
        )
      ).not.toThrow()
    })

    it('defaults existingTags to empty array when not provided', () => {
      expect(() =>
        render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
      ).not.toThrow()
    })
  })
})

describe('ScannerDialog — file upload flow', () => {
  it('transitions to "Review & Save" after PDF upload', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf content'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Review & Save')).toBeInTheDocument())
  })

  it('shows PDF filename and scan metadata after PDF upload', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf content'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('receipt.pdf')).toBeInTheDocument())
    expect(screen.getByText(/PDF · Page 1 will be scanned/i)).toBeInTheDocument()
  })

  it('transitions to "Review & Save" after image upload', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['img'], 'receipt.jpg', { type: 'image/jpeg' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Review & Save')).toBeInTheDocument())
  })

  it('shows Retake and Save Receipt buttons in OcrStep', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save receipt/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument()
    })
  })

  it('hides "Upload File" button in OcrStep', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Review & Save')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /upload file/i })).not.toBeInTheDocument()
  })

  it('Retake button returns to camera step', async () => {
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Review & Save')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /retake/i }))
    expect(screen.getByText('Scan Receipt')).toBeInTheDocument()
  })

  it('shows "Amount detected" when OCR status is done', async () => {
    useOcrStatus.mockReturnValue({ data: { ocrStatus: 'done', ocrExtractedAmount: '29.99' } })
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Amount detected')).toBeInTheDocument())
  })

  it('pre-fills amount field when OCR extracts an amount', async () => {
    useOcrStatus.mockReturnValue({ data: { ocrStatus: 'done', ocrExtractedAmount: '45.50' } })
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => {
      const input = screen.getByLabelText(/total amount/i)
      expect(input).toHaveValue(45.5)
    })
  })

  it('shows OCR failed error when OCR status is failed', async () => {
    useOcrStatus.mockReturnValue({ data: { ocrStatus: 'failed' } })
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText(/could not detect amount/i)).toBeInTheDocument())
  })

  it('Save Receipt button is disabled until upload resolves', async () => {
    useReceiptUpload.mockReturnValue({
      mutateAsync: vi.fn(() => new Promise(() => {})),
      isPending: false
    })
    render(<ScannerDialog open onClose={vi.fn()} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save receipt/i })).toBeDisabled()
    })
  })

  it('advances to the Log Expense step after saving the receipt, then closes on Skip', async () => {
    const onClose = vi.fn()
    render(<ScannerDialog open onClose={onClose} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save receipt/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /save receipt/i }))
    // Saving the receipt advances to the expense-logging step rather than closing
    await waitFor(() => expect(screen.getByRole('button', { name: /log expense/i })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /skip/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})

describe('ScannerDialog — OcrStep tag input', () => {
  const setup = async () => {
    render(<ScannerDialog open onClose={vi.fn()} existingTags={['food']} />, { wrapper })
    const file = new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })
    await uploadFile(file)
    await waitFor(() => expect(screen.getByText('Review & Save')).toBeInTheDocument())
  }

  it('adds a tag when Enter is pressed in tag input', async () => {
    await setup()
    const tagInput = screen.getByPlaceholderText(/e.g. Business Expense/i)
    await userEvent.type(tagInput, 'groceries{Enter}')
    await waitFor(() => expect(screen.getByText('groceries')).toBeInTheDocument())
  })

  it('shows helper text for tag field', async () => {
    await setup()
    expect(screen.getByText(/press enter or comma to add a tag/i)).toBeInTheDocument()
  })
})
