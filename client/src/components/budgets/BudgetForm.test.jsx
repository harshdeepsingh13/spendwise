import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BudgetForm } from './BudgetForm'

vi.mock('../../hooks/useCategories', () => ({
  useCategories: vi.fn()
}))

vi.mock('../../hooks/useBudgets', () => ({
  useBudgetMutations: vi.fn()
}))

import { useCategories } from '../../hooks/useCategories'
import { useBudgetMutations } from '../../hooks/useBudgets'

const mockCategories = [
  { _id: 'cat1', name: 'Food', color: '#ff0000' },
  { _id: 'cat2', name: 'Transport', color: '#00ff00' }
]

const mockMutations = {
  create: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  update: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  remove: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }
}

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

const renderForm = (props = {}) => {
  const defaults = { open: true, onClose: vi.fn(), budget: undefined }
  return render(<BudgetForm {...defaults} {...props} />, { wrapper })
}

beforeEach(() => {
  vi.clearAllMocks()
  useCategories.mockReturnValue({ data: mockCategories })
  useBudgetMutations.mockReturnValue(mockMutations)
})

describe('BudgetForm — create mode', () => {
  it('renders "Set Budget" title in the dialog heading', () => {
    renderForm()
    const heading = screen.getByRole('heading', { name: /set budget/i })
    expect(heading).toBeInTheDocument()
  })

  it('shows category select, amount, and effectiveFrom fields', () => {
    renderForm()
    // MUI Select renders as combobox; label is not associated via htmlFor
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByLabelText(/monthly budget/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/effective from/i)).toBeInTheDocument()
  })

  it('submit button shows "Set Budget" label in create mode', () => {
    renderForm()
    const buttons = screen.getAllByRole('button', { name: /set budget/i })
    // At least one button with this label should exist (the submit button)
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('does not show Remove Budget button in create mode', () => {
    renderForm()
    expect(screen.queryByText(/remove budget/i)).not.toBeInTheDocument()
  })

  it('submit button is disabled when categoryId or amount is empty', () => {
    renderForm()
    // The submit button is the last "Set Budget" button (not in the title heading)
    const submitBtn = screen.getAllByRole('button', { name: /set budget/i }).at(-1)
    expect(submitBtn).toBeDisabled()
  })

  it('calls create.mutateAsync with correct payload and then onClose', async () => {
    const onClose = vi.fn()
    renderForm({ onClose })

    // Open the category dropdown
    const categorySelect = screen.getByRole('combobox')
    await userEvent.click(categorySelect)

    const option = await screen.findByText('Food')
    await userEvent.click(option)

    const amountInput = screen.getByLabelText(/monthly budget/i)
    await userEvent.clear(amountInput)
    await userEvent.type(amountInput, '150')

    const submitBtn = screen.getAllByRole('button', { name: /set budget/i }).at(-1)
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutations.create.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat1', amount: 150 })
      )
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('does not submit when required fields are missing', async () => {
    const onClose = vi.fn()
    renderForm({ onClose })

    const submitBtn = screen.getAllByRole('button', { name: /set budget/i }).at(-1)
    // Button is disabled, but try clicking anyway
    fireEvent.click(submitBtn)

    expect(mockMutations.create.mutateAsync).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('BudgetForm — edit mode', () => {
  const existingBudget = {
    id: 'budget99',
    category: { _id: 'cat2', name: 'Transport', color: '#00ff00' },
    amount: 200,
    budget: { id: 'budget99' }
  }

  it('renders "Edit Budget" title', () => {
    renderForm({ budget: existingBudget })
    expect(screen.getByText('Edit Budget')).toBeInTheDocument()
  })

  it('shows "Save" button instead of "Set Budget"', () => {
    renderForm({ budget: existingBudget })
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument()
  })

  it('shows "Remove Budget" button in edit mode', () => {
    renderForm({ budget: existingBudget })
    expect(screen.getByText(/remove budget/i)).toBeInTheDocument()
  })

  it('pre-fills amount from existing budget', () => {
    renderForm({ budget: existingBudget })
    const amountInput = screen.getByLabelText(/monthly budget/i)
    expect(amountInput.value).toBe('200')
  })

  it('calls update.mutateAsync with budget id and payload on save', async () => {
    const onClose = vi.fn()
    renderForm({ budget: existingBudget, onClose })

    const saveBtn = screen.getByRole('button', { name: /^save$/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockMutations.update.mutateAsync).toHaveBeenCalledWith({
        id: 'budget99',
        data: expect.objectContaining({ categoryId: 'cat2', amount: 200 })
      })
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('first delete click shows "Confirm Delete"', async () => {
    renderForm({ budget: existingBudget })
    const removeBtn = screen.getByText(/remove budget/i)
    await userEvent.click(removeBtn)
    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument()
  })

  it('second delete click calls remove.mutateAsync and closes', async () => {
    const onClose = vi.fn()
    renderForm({ budget: existingBudget, onClose })

    const removeBtn = screen.getByText(/remove budget/i)
    await userEvent.click(removeBtn)
    const confirmBtn = screen.getByText(/confirm delete/i)
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockMutations.remove.mutateAsync).toHaveBeenCalledWith('budget99')
    })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('BudgetForm — Cancel button', () => {
  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    renderForm({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('BudgetForm — form reset on re-open', () => {
  it('resets form to empty when opened in create mode', () => {
    const { rerender } = render(
      <BudgetForm open={false} onClose={vi.fn()} budget={undefined} />,
      { wrapper }
    )
    // Reopen: pass only the component — wrapper already provides Router + QueryClient
    rerender(<BudgetForm open={true} onClose={vi.fn()} budget={undefined} />)
    const amountInput = screen.getByLabelText(/monthly budget/i)
    expect(amountInput.value).toBe('')
  })
})
