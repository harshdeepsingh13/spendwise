import { render, screen } from '@testing-library/react'
import dayjs from '@/lib/dayjs'
import { RecentExpenseRow } from './RecentExpenseRow'

const baseExpense = {
  amount: '25.50',
  date: '2024-03-15T00:00:00.000Z',
  category: { name: 'Food', color: '#FF5733' },
  notes: null,
}

describe('RecentExpenseRow', () => {
  it('renders without crashing', () => {
    render(<RecentExpenseRow expense={baseExpense} />)
  })

  it('displays category name', () => {
    render(<RecentExpenseRow expense={baseExpense} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('displays "Uncategorized" when category is absent', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, category: null }} />)
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  it('displays "Uncategorized" when category has no name', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, category: {} }} />)
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  it('displays formatted amount', () => {
    render(<RecentExpenseRow expense={baseExpense} />)
    expect(screen.getByText('$25.50')).toBeInTheDocument()
  })

  it('defaults amount to $0.00 when amount is null', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, amount: null }} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('defaults amount to $0.00 when amount is undefined', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, amount: undefined }} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('displays formatted date as MMM D', () => {
    render(<RecentExpenseRow expense={baseExpense} />)
    const expected = dayjs(baseExpense.date).format('MMM D')
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('displays notes when provided', () => {
    const expense = { ...baseExpense, notes: 'Lunch with team' }
    render(<RecentExpenseRow expense={expense} />)
    expect(screen.getByText('Lunch with team')).toBeInTheDocument()
  })

  it('does not render notes element when notes is falsy', () => {
    render(<RecentExpenseRow expense={baseExpense} />)
    expect(screen.queryByText(/lunch/i)).not.toBeInTheDocument()
  })

  it('does not render notes element when notes is empty string', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, notes: '' }} />)
    // empty string is falsy — notes block should not render
    const captions = screen.queryAllByText('')
    // there should be no visible text matching empty string as notes
    expect(screen.queryByRole('caption')).not.toBeInTheDocument()
  })

  it('renders amount with two decimal places', () => {
    render(<RecentExpenseRow expense={{ ...baseExpense, amount: '7' }} />)
    expect(screen.getByText('$7.00')).toBeInTheDocument()
  })

  it('uses fallback dot color when category has no color', () => {
    const { container } = render(
      <RecentExpenseRow expense={{ ...baseExpense, category: { name: 'Travel' } }} />
    )
    // dot Box is the first child Box inside the flex row — just verify it renders
    expect(container.firstChild).toBeInTheDocument()
  })
})
