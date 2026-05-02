import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NavDrawer from './NavDrawer'

const renderDrawer = ({ open = true, onClose = vi.fn(), initialPath = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavDrawer open={open} onClose={onClose} />
    </MemoryRouter>
  )
}

describe('NavDrawer', () => {
  it('renders the logo and brand name', () => {
    renderDrawer()
    expect(screen.getByText('ExpenseTracker')).toBeInTheDocument()
  })

  it('renders all nav items', () => {
    renderDrawer()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Receipts')).toBeInTheDocument()
  })

  it('calls onClose when a nav item is clicked', async () => {
    const onClose = vi.fn()
    renderDrawer({ onClose })
    await userEvent.click(screen.getByText('Expenses'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks the active route as selected', () => {
    renderDrawer({ initialPath: '/expenses' })
    const expensesButton = screen.getByText('Expenses').closest('[role="button"]')
    expect(expensesButton).toHaveClass('Mui-selected')
  })

  it('does not mark non-active routes as selected', () => {
    renderDrawer({ initialPath: '/expenses' })
    const dashboardButton = screen.getByText('Dashboard').closest('[role="button"]')
    expect(dashboardButton).not.toHaveClass('Mui-selected')
  })

  it('renders without crashing when open is false', () => {
    // MUI temporary Drawer with keepMounted keeps DOM but hides the modal
    renderDrawer({ open: false })
    // The backdrop/modal is hidden; the drawer paper is present but not exposed via presentation role
    expect(screen.queryByRole('presentation')).toBeNull()
    // Brand name is still in DOM due to keepMounted
    expect(document.querySelector('.MuiDrawer-root')).toBeInTheDocument()
  })
})
