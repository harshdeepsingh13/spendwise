import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

vi.mock('../../context/AuthContext', () => ({
  useAuthContext: () => ({ logout: vi.fn() }),
}))

vi.mock('./AppHeader', () => ({
  default: ({ onMenuClick, onLogout }) => (
    <div>
      <button onClick={onMenuClick}>Menu</button>
      <button onClick={onLogout}>Logout</button>
    </div>
  ),
}))

vi.mock('./NavDrawer', () => ({
  default: ({ open, onClose }) => (
    <div data-testid="nav-drawer" data-open={String(open)}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

const renderLayout = (initialPath = '/', children = <div>Page Content</div>) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout>{children}</Layout>
    </MemoryRouter>
  )

describe('Layout', () => {
  it('renders without crashing', () => {
    renderLayout()
  })

  it('renders children', () => {
    renderLayout('/', <div>Test Children</div>)
    expect(screen.getByText('Test Children')).toBeInTheDocument()
  })

  it('shows Home as plain text (not link) on home route', () => {
    renderLayout('/dashboard')
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
  })

  it('shows Home link and Expenses label on /expenses', () => {
    renderLayout('/expenses')
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
  })

  it('shows Home link and Analytics label on /analytics', () => {
    renderLayout('/analytics')
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows Home link and Receipts label on /receipts', () => {
    renderLayout('/receipts')
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Receipts')).toBeInTheDocument()
  })

  it('shows only Home link with no page label on unknown routes', () => {
    renderLayout('/unknown-route')
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.queryByText('Unknown-route')).not.toBeInTheDocument()
  })

  it('opens the nav drawer when menu is clicked', async () => {
    const user = userEvent.setup()
    renderLayout()
    expect(screen.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'false')
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(screen.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true')
  })

  it('closes the nav drawer when close is triggered', async () => {
    const user = userEvent.setup()
    renderLayout()
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'false')
  })
})
