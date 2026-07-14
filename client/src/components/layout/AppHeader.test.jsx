import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AppHeader from './AppHeader'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { displayName: 'Test User', email: 'test@example.com' } }),
}))

vi.mock('../mfa/SecuritySettingsModal', () => ({
  SecuritySettingsModal: () => null,
}))

function renderHeader(props = {}, { initialEntries = ['/'] } = {}) {
  const defaults = { onMenuClick: vi.fn(), onLogout: vi.fn() }
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppHeader {...defaults} {...props} />
    </MemoryRouter>
  )
}

describe('AppHeader', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders without crashing', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows brand name', () => {
    renderHeader()
    expect(screen.getByText('ExpenseTracker')).toBeInTheDocument()
  })

  it('calls onMenuClick when hamburger is clicked', async () => {
    const onMenuClick = vi.fn()
    renderHeader({ onMenuClick })
    await userEvent.click(screen.getByLabelText('open navigation'))
    expect(onMenuClick).toHaveBeenCalledOnce()
  })

  it('shows "Dashboard" as current label on "/" route', () => {
    renderHeader({}, { initialEntries: ['/'] })
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('shows "Expenses" as current label on "/expenses" route', () => {
    renderHeader({}, { initialEntries: ['/expenses'] })
    expect(screen.getAllByText('Expenses').length).toBeGreaterThanOrEqual(2)
  })

  it('defaults to "Dashboard" label for unknown routes', () => {
    renderHeader({}, { initialEntries: ['/unknown'] })
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('renders nav links for all nav items', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expenses/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /receipts/i })).toBeInTheDocument()
  })

  it('navigates to correct path when a nav link is clicked', async () => {
    renderHeader({}, { initialEntries: ['/'] })
    await userEvent.click(screen.getByRole('button', { name: /expenses/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/expenses')
  })

  it('opens user menu when avatar button is clicked', async () => {
    renderHeader()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('user menu'))
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls onLogout when Logout is clicked', async () => {
    const onLogout = vi.fn()
    renderHeader({ onLogout })
    await userEvent.click(screen.getByLabelText('user menu'))
    await userEvent.click(screen.getByText('Logout'))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it('closes the menu after logout', async () => {
    renderHeader()
    await userEvent.click(screen.getByLabelText('user menu'))
    await userEvent.click(screen.getByText('Logout'))
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })
})
