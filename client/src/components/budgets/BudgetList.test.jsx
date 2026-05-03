import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { BudgetList } from './BudgetList'

vi.mock('../../hooks/useBudgets', () => ({
  useBudgets: vi.fn()
}))

import { useBudgets } from '../../hooks/useBudgets'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('BudgetList', () => {
  afterEach(() => vi.clearAllMocks())

  it('shows skeletons while loading', () => {
    useBudgets.mockReturnValue({ data: [], isLoading: true })
    render(<BudgetList onEdit={vi.fn()} />, { wrapper })
    // MUI Skeleton renders as a generic element — check for absence of budget content
    expect(screen.queryByText(/No budgets set/i)).not.toBeInTheDocument()
    expect(screen.queryByText('/mo')).not.toBeInTheDocument()
  })

  it('shows empty state when no budgets exist', () => {
    useBudgets.mockReturnValue({ data: [], isLoading: false })
    render(<BudgetList onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText(/No budgets set\. Add one to track spending against your goals\./i)).toBeInTheDocument()
  })

  it('renders a budget card with category name and amount', () => {
    useBudgets.mockReturnValue({
      data: [
        {
          _id: 'b1',
          amount: '250.00',
          category: { name: 'Groceries', color: '#4caf50' }
        }
      ],
      isLoading: false
    })
    render(<BudgetList onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('$250.00/mo')).toBeInTheDocument()
    expect(screen.getByText('monthly')).toBeInTheDocument()
  })

  it('renders multiple budget cards', () => {
    useBudgets.mockReturnValue({
      data: [
        { _id: 'b1', amount: '100', category: { name: 'Food', color: '#f00' } },
        { _id: 'b2', amount: '200', category: { name: 'Travel', color: '#00f' } }
      ],
      isLoading: false
    })
    render(<BudgetList onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('$100.00/mo')).toBeInTheDocument()
    expect(screen.getByText('$200.00/mo')).toBeInTheDocument()
  })

  it('shows "Unknown" when category name is missing', () => {
    useBudgets.mockReturnValue({
      data: [{ _id: 'b1', amount: '50', category: null }],
      isLoading: false
    })
    render(<BudgetList onEdit={vi.fn()} />, { wrapper })
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('calls onEdit with the budget when edit button is clicked', async () => {
    const onEdit = vi.fn()
    const budget = { _id: 'b1', amount: '75.5', category: { name: 'Dining', color: '#abc' } }
    useBudgets.mockReturnValue({ data: [budget], isLoading: false })
    render(<BudgetList onEdit={onEdit} />, { wrapper })

    await userEvent.click(screen.getByRole('button'))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith({
      id: budget._id,
      category: budget.category,
      amount: parseFloat(budget.amount)
    })
  })
})
