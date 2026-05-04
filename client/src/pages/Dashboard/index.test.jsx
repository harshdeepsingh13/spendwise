import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import DashboardPage from './index'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

vi.mock('../../hooks/useAnalytics', () => ({
  useDashboard: vi.fn(),
  useKpi: vi.fn(),
  useSummary: vi.fn(),
  useBudgetVsActual: vi.fn(),
}))

vi.mock('../../hooks/useReceipt', () => ({ useReceipts: vi.fn() }))

vi.mock('../../components/charts/SpendingTrendChart', () => ({
  SpendingTrendChart: ({ data }) => (
    <div data-testid="spending-trend-chart" data-length={data?.length ?? 0} />
  ),
}))

vi.mock('../../components/charts/CategoryDonutChart', () => ({
  CategoryDonutChart: ({ grandTotal }) => (
    <div data-testid="category-donut-chart" data-grand-total={grandTotal} />
  ),
}))

vi.mock('../../components/charts/BudgetProgressBar', () => ({
  BudgetProgressBar: ({ budget, pct, status }) => (
    <div
      data-testid="budget-progress-bar"
      data-budget-id={budget?.id}
      data-pct={pct}
      data-status={status}
    />
  ),
}))

vi.mock('../../components/receipts/ScannerDialog', () => ({
  ScannerDialog: ({ open, onClose }) => (
    <div data-testid="scanner-dialog" data-open={String(open)}>
      <button onClick={onClose}>close-scanner</button>
    </div>
  ),
}))

vi.mock('../../components/dashboard/RecentExpenseRow', () => ({
  RecentExpenseRow: ({ expense }) => (
    <div data-testid="recent-expense-row" data-id={expense._id} />
  ),
}))

vi.mock('../../components/dashboard/ReceiptThumb', () => ({
  ReceiptThumb: ({ receipt }) => (
    <div data-testid="receipt-thumb" data-id={receipt._id} />
  ),
}))

vi.mock('../../components/common/ProGate', () => ({
  ProGate: ({ locked, children }) => (
    <div data-testid="pro-gate" data-locked={String(!!locked)}>
      {locked ? <span>Pro Feature</span> : children}
    </div>
  ),
}))

import { useAuth } from '../../hooks/useAuth'
import { useDashboard, useKpi, useSummary, useBudgetVsActual } from '../../hooks/useAnalytics'
import { useReceipts } from '../../hooks/useReceipt'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

const renderPage = () => render(<DashboardPage />, { wrapper })

const defaultHookReturns = () => {
  useAuth.mockReturnValue({ user: { tier: 'pro', displayName: 'John Doe' } })
  useKpi.mockReturnValue({ data: null, isLoading: false })
  useDashboard.mockReturnValue({ data: null, isLoading: false })
  useSummary.mockReturnValue({ data: null, isLoading: false, error: null })
  useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
  useReceipts.mockReturnValue({ data: [] })
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    defaultHookReturns()
  })

  describe('greeting header', () => {
    it('shows the user first name in the greeting', () => {
      renderPage()
      expect(screen.getByText(/John/)).toBeInTheDocument()
    })

    it('falls back to "there" when user has no displayName', () => {
      useAuth.mockReturnValue({ user: { tier: 'pro', displayName: null } })
      renderPage()
      expect(screen.getByText(/Good \w+, there/)).toBeInTheDocument()
    })

    it('shows the financial snapshot caption', () => {
      renderPage()
      expect(screen.getByText(/financial snapshot/i)).toBeInTheDocument()
    })
  })

  describe('KPI cards', () => {
    it('renders all four KPI card labels', () => {
      renderPage()
      expect(screen.getByText('This Month')).toBeInTheDocument()
      expect(screen.getByText('vs Last Month')).toBeInTheDocument()
      expect(screen.getByText('Top Category')).toBeInTheDocument()
      expect(screen.getByText('Budget Health')).toBeInTheDocument()
    })

    it('shows current month total from KPI data', () => {
      useKpi.mockReturnValue({
        data: {
          currentMonthTotal: 312.7,
          momPctChange: 5,
          topCategory: { name: 'Groceries', total: 100 },
          budgetHealthScore: 85,
        },
        isLoading: false,
      })
      renderPage()
      expect(screen.getAllByText('$313').length).toBeGreaterThan(0)
    })

    it('shows top category name from KPI data', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 200, momPctChange: 0, topCategory: { name: 'Dining', total: 80 }, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('Dining')).toBeInTheDocument()
    })

    it('shows "None" when no top category exists and not loading', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 0, momPctChange: 0, topCategory: null, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('None')).toBeInTheDocument()
    })

    it('shows "more than last month" sub-label when MoM is positive', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 200, momPctChange: 15, topCategory: null, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('more than last month')).toBeInTheDocument()
    })

    it('shows "less than last month" sub-label when MoM is negative', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 200, momPctChange: -10, topCategory: null, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('less than last month')).toBeInTheDocument()
    })

    it('shows "same as last month" sub-label when MoM is near zero', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 200, momPctChange: 0, topCategory: null, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('same as last month')).toBeInTheDocument()
    })

    it('shows budget health score percentage when available', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 200, momPctChange: 0, topCategory: null, budgetHealthScore: 72 },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('72%')).toBeInTheDocument()
    })

    it('shows "No budgets" when budgetHealthScore is null and not loading', () => {
      useKpi.mockReturnValue({
        data: { currentMonthTotal: 0, momPctChange: 0, topCategory: null, budgetHealthScore: null },
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('No budgets')).toBeInTheDocument()
    })
  })

  describe('spending trend section', () => {
    it('renders all three trend period toggle buttons', () => {
      renderPage()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('3 Mo')).toBeInTheDocument()
      expect(screen.getByText('6 Mo')).toBeInTheDocument()
    })

    it('shows loading spinner while trend data is loading', () => {
      useSummary
        .mockReturnValueOnce({ data: null, isLoading: false, error: null }) // donut
        .mockReturnValueOnce({ data: null, isLoading: true, error: null })  // trend
      renderPage()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('shows error alert when trend data fetch fails', () => {
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

    it('switches to 3-month period when "3 Mo" toggle is clicked', () => {
      renderPage()
      fireEvent.click(screen.getByText('3 Mo'))
      expect(screen.getByTestId('spending-trend-chart')).toBeInTheDocument()
    })

    it('locks trend section for free users on 6-month range', () => {
      useAuth.mockReturnValue({ user: { tier: 'free', displayName: 'Jane' } })
      renderPage()
      fireEvent.click(screen.getByText('6 Mo'))
      expect(screen.getByTestId('pro-gate')).toHaveAttribute('data-locked', 'true')
    })

    it('does not lock trend section for pro users on 6-month range', () => {
      useAuth.mockReturnValue({ user: { tier: 'pro', displayName: 'Jane' } })
      renderPage()
      fireEvent.click(screen.getByText('6 Mo'))
      expect(screen.getByTestId('pro-gate')).toHaveAttribute('data-locked', 'false')
    })

    it('does not lock trend section for free users on default month range', () => {
      useAuth.mockReturnValue({ user: { tier: 'free', displayName: 'Jane' } })
      renderPage()
      expect(screen.getByTestId('pro-gate')).toHaveAttribute('data-locked', 'false')
    })
  })

  describe('by category section', () => {
    it('renders the CategoryDonutChart', () => {
      renderPage()
      expect(screen.getByTestId('category-donut-chart')).toBeInTheDocument()
    })

    it('passes grandTotal from donut summary to CategoryDonutChart', () => {
      useSummary
        .mockReturnValueOnce({ data: { totals: [], grandTotal: 250 }, isLoading: false, error: null })
        .mockReturnValueOnce({ data: null, isLoading: false, error: null })
      renderPage()
      expect(screen.getByTestId('category-donut-chart')).toHaveAttribute('data-grand-total', '250')
    })
  })

  describe('budget tracker section', () => {
    it('shows empty state with CTA when no budgets exist', () => {
      useBudgetVsActual.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.getByText('No budgets set yet.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /set budgets/i })).toBeInTheDocument()
    })

    it('renders BudgetProgressBar for each budget item', () => {
      useBudgetVsActual.mockReturnValue({
        data: [
          { budget: { id: 'b1' }, actual: 50, pct: 50, status: 'ok' },
          { budget: { id: 'b2' }, actual: 120, pct: 120, status: 'over' },
        ],
        isLoading: false,
      })
      renderPage()
      expect(screen.getAllByTestId('budget-progress-bar')).toHaveLength(2)
    })

    it('only renders the top 3 budgets when more than 3 exist', () => {
      useBudgetVsActual.mockReturnValue({
        data: [
          { budget: { id: 'b1' }, actual: 50, pct: 50, status: 'ok' },
          { budget: { id: 'b2' }, actual: 80, pct: 80, status: 'ok' },
          { budget: { id: 'b3' }, actual: 100, pct: 100, status: 'ok' },
          { budget: { id: 'b4' }, actual: 200, pct: 150, status: 'over' },
        ],
        isLoading: false,
      })
      renderPage()
      expect(screen.getAllByTestId('budget-progress-bar')).toHaveLength(3)
    })

    it('shows "Showing 3 of N" caption when more than 3 budgets exist', () => {
      useBudgetVsActual.mockReturnValue({
        data: [
          { budget: { id: 'b1' }, actual: 50, pct: 50, status: 'ok' },
          { budget: { id: 'b2' }, actual: 80, pct: 80, status: 'ok' },
          { budget: { id: 'b3' }, actual: 100, pct: 100, status: 'ok' },
          { budget: { id: 'b4' }, actual: 200, pct: 150, status: 'over' },
        ],
        isLoading: false,
      })
      renderPage()
      expect(screen.getByText('Showing 3 of 4 budgets')).toBeInTheDocument()
    })

    it('does not show count caption when 3 or fewer budgets exist', () => {
      useBudgetVsActual.mockReturnValue({
        data: [{ budget: { id: 'b1' }, actual: 50, pct: 50, status: 'ok' }],
        isLoading: false,
      })
      renderPage()
      expect(screen.queryByText(/Showing 3 of/)).not.toBeInTheDocument()
    })
  })

  describe('recent expenses section', () => {
    it('shows empty state when recent expenses list is empty', () => {
      useDashboard.mockReturnValue({ data: { recent: [] }, isLoading: false })
      renderPage()
      expect(screen.getByText('No expenses yet. Add your first one.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
    })

    it('does not show expense rows while loading', () => {
      useDashboard.mockReturnValue({ data: null, isLoading: true })
      renderPage()
      expect(screen.queryAllByTestId('recent-expense-row')).toHaveLength(0)
    })

    it('renders a RecentExpenseRow for each recent expense', () => {
      useDashboard.mockReturnValue({
        data: {
          recent: [
            { _id: 'e1', amount: 50, description: 'Coffee' },
            { _id: 'e2', amount: 120, description: 'Groceries' },
          ],
        },
        isLoading: false,
      })
      renderPage()
      expect(screen.getAllByTestId('recent-expense-row')).toHaveLength(2)
    })

    it('renders two "See all →" navigation chips', () => {
      renderPage()
      expect(screen.getAllByText('See all →')).toHaveLength(2)
    })
  })

  describe('recent receipts section', () => {
    it('shows empty state when no receipts are available', () => {
      useReceipts.mockReturnValue({ data: [] })
      renderPage()
      expect(screen.getByText('No receipts uploaded yet.')).toBeInTheDocument()
    })

    it('renders ReceiptThumb for up to 3 recent receipts', () => {
      useReceipts.mockReturnValue({
        data: [{ _id: 'r1' }, { _id: 'r2' }, { _id: 'r3' }, { _id: 'r4' }],
      })
      renderPage()
      expect(screen.getAllByTestId('receipt-thumb')).toHaveLength(3)
    })

    it('renders fewer ReceiptThumbs when fewer than 3 receipts exist', () => {
      useReceipts.mockReturnValue({ data: [{ _id: 'r1' }] })
      renderPage()
      expect(screen.getAllByTestId('receipt-thumb')).toHaveLength(1)
    })
  })

  describe('scanner dialog', () => {
    it('scanner dialog is closed by default', () => {
      renderPage()
      expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'false')
    })

    it('opens scanner dialog when the header Upload button is clicked', () => {
      useReceipts.mockReturnValue({ data: [{ _id: 'r1' }] })
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
      expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('opens scanner dialog from the empty-state "Upload first receipt" button', () => {
      useReceipts.mockReturnValue({ data: [] })
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: /upload first receipt/i }))
      expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'true')
    })

    it('closes scanner dialog when onClose is called', () => {
      useReceipts.mockReturnValue({ data: [{ _id: 'r1' }] })
      renderPage()
      fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
      expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'true')
      fireEvent.click(screen.getByText('close-scanner'))
      expect(screen.getByTestId('scanner-dialog')).toHaveAttribute('data-open', 'false')
    })
  })
})
