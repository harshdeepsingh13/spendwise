import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestWrapper } from '../../test/renderWithProviders'

const mockDelete = { mutateAsync: vi.fn(), isPending: false }
const mockCreate = { mutateAsync: vi.fn(), isPending: false }
const mockUpdate = { mutateAsync: vi.fn(), isPending: false }
let categoriesResult

vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => categoriesResult,
  useCategoryMutations: () => ({ create: mockCreate, update: mockUpdate, delete: mockDelete }),
}))

import CategoriesPage from './index'

const wrapper = createTestWrapper()

const CATEGORIES = [
  { _id: 'c1', name: 'Groceries', color: '#10B981', isDefault: false, user: 'u1' },
  { _id: 'c2', name: 'Rent', color: '#EF4444', isDefault: true },
]

beforeEach(() => {
  vi.clearAllMocks()
  categoriesResult = { data: CATEGORIES, isLoading: false, error: null }
})

describe('CategoriesPage', () => {
  it('renders category names', () => {
    render(<CategoriesPage />, { wrapper })
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Rent')).toBeInTheDocument()
  })

  it('shows a Default chip and no edit/delete for default categories', () => {
    render(<CategoriesPage />, { wrapper })
    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.queryByLabelText('edit Rent')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('delete Rent')).not.toBeInTheDocument()
  })

  it('shows edit and delete controls for user categories', () => {
    render(<CategoriesPage />, { wrapper })
    expect(screen.getByLabelText('edit Groceries')).toBeInTheDocument()
    expect(screen.getByLabelText('delete Groceries')).toBeInTheDocument()
  })

  it('deletes a category after confirmation', async () => {
    mockDelete.mutateAsync.mockResolvedValue(undefined)
    render(<CategoriesPage />, { wrapper })
    await userEvent.click(screen.getByLabelText('delete Groceries'))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockDelete.mutateAsync).toHaveBeenCalledWith('c1'))
  })

  it('surfaces a 409 "in use" error in a snackbar', async () => {
    mockDelete.mutateAsync.mockRejectedValue({
      response: { data: { message: 'Category is in use by expenses or budgets and cannot be deleted' } },
    })
    render(<CategoriesPage />, { wrapper })
    await userEvent.click(screen.getByLabelText('delete Groceries'))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.getByText(/in use by expenses or budgets/i)).toBeInTheDocument())
  })

  it('shows the empty state when there are no categories', () => {
    categoriesResult = { data: [], isLoading: false, error: null }
    render(<CategoriesPage />, { wrapper })
    expect(screen.getByText('No categories yet')).toBeInTheDocument()
  })
})
