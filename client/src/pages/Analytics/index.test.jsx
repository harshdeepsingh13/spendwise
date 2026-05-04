import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AnalyticsPage from './index'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../hooks/useAnalytics', () => ({
  useKpi: vi.fn(),
  useSummary: vi.fn(),
  useBudgetVsActual: vi.fn()
}))

vi.mock('../../components/charts/SpendingTrendChart', () => ({
  SpendingTrendChart: ({ data }) => (
    <div data-testid="spending-trend-chart" data-length={data?.length ?? 0} />
  )
}))

vi.mock('../../components/charts/CategoryDonutChart', () => ({
  CategoryDonutChart: ({ data, grandTotal }) => (
    <div data-testid="category-donut-chart" data-grand-total={grandTotal} />
  )
}))

vi.mock('../../components/charts/BudgetProgressBar', () => ({
  BudgetProgressBar: ({ budget, actual, pct, status }) => (
    <div
      data-testid="budget-progress-bar"
      data-budget-id={budget?.id}
      data-pct={pct}
      data-status={status}
    />
  )
}))

vi.mock('../../components/budgets/BudgetForm', () => ({
  BudgetForm: ({ open, onClose }) => (
    <div data-testid="budget-form" data-open={String(open)}>
      <button onClick={onClose}>close-form</button>
    </div>
  )
}))

vi.mock('../../components/budgets/BudgetList', () => ({
  BudgetList: ({ onEdit }) => (
    <div data-testid="budget-list">
      <button onClick={() => onEdit({ id: 'b1', category: { name: 'Food' }, amount: 100 })}>
        edit-budget
      </button>
    </div>
  )
}))

vi.mock('../../components/common/ProGate', () => ({
  ProGate: ({ locked, children }) => (
    <div data-testid="pro-gate" data-locked={String(!!locked)}>
      {locked ? <span>Pro Feature</span> : children}
    </div>
  )
}))

vi.mock('../../components/common/AppModal', () => ({
  AppModal: ({ open, onClose, title, children, actions }) => {
    if (!open) return null
    return (
      <div data-testid="app-modal" data-title={title}>
        {children}
        <div data-testid="modal-actions">{actions}</div>
        <button onClick={onClose}>close-modal</button>
      </div>
    )
  }
}))

import { useAuth } from '../../hooks/useAuth'
import { useKpi, useSummary, useBudgetVsActual } from '../../hooks/useAnalytics'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

const renderPage = () => render(<AnalyticsPage />, { wrapper })

const defaultHookReturns = () => {
  useAuth.mockReturnValue({ user: { tier: 'pro' } })
  useKpi.mockReturnValue({ data: null, isLoading: false })
  useSummary.mockReturnValue({ data: null, isLoading: false, error: null })
  useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    defaultHookReturns()
  })

  describe('page structure', () => {
    it('renders the Analytics heading', () => {
      renderPage()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('renders the Spending Trend section', () => {
      renderPage()
      expect(screen.getByText('Spending Trend')).toBeInTheDocument()
    })

    it('renders the By Category section', () => {
      renderPage()
      expect(screen.getByText('By Category')).toBeInTheDocument()
    })

    it('renders the Budget Tracker section', () => {
      renderPage()
      expect(screen.getByText('Budget Tracker')).toBeInTheDocument()
    })

    it('renders the Manage button in Budget Tracker', () => {
      renderPage()
      expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument()
    })
  })

  describe('KPI cards', () => {
    it('shows skeleton placeholders while KPI data is loading', () => {
      useKpi.mockReturnValue({ data: null, isLoading: true })
      renderPage()
      expect(screen.getByText('This Month')).toBeInTheDocument()
      expect(screen.getByText('vs Last Month')).toBeInTheDocument()
      expect(screen.getByText('Top Category')).toBeInTheDocument()
      expect(screen.getByText('Budget Health')).toBeInTheDocument()
    })

    it('shows current month total from KPI data', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 450.7,
          momPctChange: 5,
          topCategory: { name: 'Groceries', total: 200 },
          budgetHealthScore: 80
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getAllByText('$451').length).toBeGreaterThan(0)
    })

    it('shows top category name from KPI data', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 300,
          momPctChange: 0,
          topCategory: { name: 'Dining', total: 150 },
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('Dining')).toBeInTheDocument()
    })

    it('shows "No budgets" when budgetHealthScore is null', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 100,
          momPctChange: 0,
          topCategory: null,
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('No budgets')).toBeInTheDocument()
    })

    it('shows budget health score percentage when available', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 200,
          momPctChange: 0,
          topCategory: null,
          budgetHealthScore: 75
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('shows "more than last month" sub-label when MoM is positive', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 200,
          momPctChange: 10,
          topCategory: null,
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('more than last month')).toBeInTheDocument()
    })

    it('shows "less than last month" sub-label when MoM is negative', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 200,
          momPctChange: -8,
          topCategory: null,
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('less than last month')).toBeInTheDocument()
    })

    it('shows "same as last month" sub-label when MoM is near zero', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 200,
          momPctChange: 0,
          topCategory: null,
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('same as last month')).toBeInTheDocument()
    })

    it('shows "None" for top category when no top category exists', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 0,
          momPctChange: 0,
          topCategory: null,
          budgetHealthScore: null
        },
        isLoading: false
      })
      renderPage()
      expect(screen.getByText('None')).toBeInTheDocument()
    })
  })

  describe('trend period toggle', () => {
    it('renders all four trend period buttons', () => {
      renderPage()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('3 Mo')).toBeInTheDocument()
      expect(screen.getByText('6 Mo')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
    })

    it('switches trend period when a toggle button is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByText('3 Mo'))
      // useSummary should have been called with new dates — the chart re-renders
      expect(screen.getByTestId('spending-trend-chart')).toBeInTheDocument()
    })
  })

  describe('spending trend section', () => {
    it('shows loading spinner while trend data loads', () => {
      useSummary
        .mockReturnValueOnce({ data: null, isLoading: false, error: null }) // donut call
        .mockReturnValueOnce({ data: null, isLoading: true, error: null })  // trend call
      renderPage()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('shows error alert when trend fetch fails', () => {
      useSummary
        .mockReturnValueOnce({ data: null, isLoading: false, error: null })
        .mockReturnValueOnce({ data: null, isLoading: false, error: new Error('fail') })
      renderPage()
      expect(screen.getByText('Failed to load trend data')).toBeInTheDocument()
    })

    it('renders SpendingTrendChart when data is available', () => {
      useSummary
        .mockReturnValueOnce({ data: { totals: [], grandTotal: 0 }, isLoading: false, error: null })
        .mockReturnValueOnce({ data: { totals: [{ x: '2024-01', y: 100 }] }, isLoading: false, error: null })
      renderPage()
      expect(screen.getByTestId('spending-trend-chart')).toBeInTheDocument()
    })

    it('locks trend section for free users selecting >3 month range', () => {
      useAuth.mockReturnValue({ user: { tier: 'free' } })
      renderPage()
      // Click Year period to trigger gating
      fireEvent.click(screen.getByText('Year'))
      const proGate = screen.getByTestId('pro-gate')
      expect(proGate).toHaveAttribute('data-locked', 'true')
    })

    it('does not lock trend section for pro users', () => {
      useAuth.mockReturnValue({ user: { tier: 'pro' } })
      renderPage()
      fireEvent.click(screen.getByText('Year'))
      const proGate = screen.getByTestId('pro-gate')
      expect(proGate).toHaveAttribute('data-locked', 'false')
    })
  })

  describe('budget tracker section', () => {
    it('shows skeleton loaders while budget data is loading', () => {
      useBudgetVsActual.mockReturnValue({ data: [], isLoading: true })
      renderPage()
      // When loading, we should NOT see empty state text
      expect(screen.queryByText('No budgets set yet')).not.toBeInTheDocument()
    })

    it('shows empty state with CTA when no budgets exist', () => {
      useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.getByText('No budgets set yet. Set monthly limits to track your spending.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /set your first budget/i })).toBeInTheDocument()
    })

    it('renders BudgetProgressBar for each budget item', () => {
      useBudgetVsActual.mockReturnValue({
        data: [
          { budget: { id: 'b1', name: 'Food' }, actual: 80, pct: 80, status: 'ok' },
          { budget: { id: 'b2', name: 'Travel' }, actual: 200, pct: 120, status: 'over' }
        ],
        isLoading: false
      })
      renderPage()
      expect(screen.getAllByTestId('budget-progress-bar')).toHaveLength(2)
    })

    it('shows Add Budget button when budgets exist', () => {
      useBudgetVsActual.mockReturnValue({
        data: [{ budget: { id: 'b1' }, actual: 50, pct: 50, status: 'ok' }],
        isLoading: false
      })
      renderPage()
      expect(screen.getByRole('button', { name: /add budget/i })).toBeInTheDocument()
    })
  })

  describe('Manage Budgets modal', () => {
    it('opens manage budgets modal when Manage button is clicked', () => {
      renderPage()
      expect(screen.queryByTestId('budget-list')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /manage/i }))
      expect(screen.getByTestId('budget-list')).toBeInTheDocument()
    })

    it('modal is closed initially', () => {
      renderPage()
      expect(screen.queryByTestId('app-modal')).not.toBeInTheDocument()
    })

    it('opens budget form with no budget when Add Budget is clicked from modal actions', () => {
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /manage/i }))
      // Click the Add Budget button in the modal actions area
      const addBtn = screen.getByTestId('modal-actions').querySelector('button')
      fireEvent.click(addBtn)
      // Manage modal closes and budget form opens
      expect(screen.queryByTestId('app-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('budget-form')).toHaveAttribute('data-open', 'true')
    })

    it('opens budget form in edit mode when edit-budget is clicked in BudgetList', () => {
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /manage/i }))
      fireEvent.click(screen.getByText('edit-budget'))
      // Manage modal closes, budget form opens
      expect(screen.queryByTestId('app-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('budget-form')).toHaveAttribute('data-open', 'true')
    })

    it('closes manage modal when close-modal is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /manage/i }))
      expect(screen.getByTestId('app-modal')).toBeInTheDocument()
      fireEvent.click(screen.getByText('close-modal'))
      expect(screen.queryByTestId('app-modal')).not.toBeInTheDocument()
    })
  })

  describe('Budget Form modal', () => {
    it('budget form is closed by default', () => {
      renderPage()
      expect(screen.getByTestId('budget-form')).toHaveAttribute('data-open', 'false')
    })

    it('opens budget form when Set Your First Budget is clicked', () => {
      useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /set your first budget/i }))
      expect(screen.getByTestId('budget-form')).toHaveAttribute('data-open', 'true')
    })

    it('closes budget form when onClose is called', () => {
      useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /set your first budget/i }))
      fireEvent.click(screen.getByText('close-form'))
      expect(screen.getByTestId('budget-form')).toHaveAttribute('data-open', 'false')
    })
  })
})
