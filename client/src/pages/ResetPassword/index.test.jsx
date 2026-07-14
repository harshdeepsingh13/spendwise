import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../services/auth.service', () => ({
  authService: { resetPassword: vi.fn() },
}))

import { authService } from '../../services/auth.service'
import ResetPasswordPage from './index'

const renderPage = (entry = '/reset-password?token=tok123') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ResetPasswordPage />
    </MemoryRouter>
  )

beforeEach(() => vi.clearAllMocks())

describe('ResetPasswordPage', () => {
  it('shows an invalid-link message when no token is present', () => {
    renderPage('/reset-password')
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument()
    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it('validates that the two passwords match', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'different123')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it('submits the token and new password on success', async () => {
    authService.resetPassword.mockResolvedValue({})
    renderPage()
    await userEvent.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'newpass123')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith('tok123', 'newpass123'))
    expect(await screen.findByText(/password reset/i)).toBeInTheDocument()
  })

  it('surfaces a server error (e.g. expired token)', async () => {
    authService.resetPassword.mockRejectedValue({ response: { data: { message: 'Invalid or expired reset link' } } })
    renderPage()
    await userEvent.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'newpass123')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/invalid or expired reset link/i)).toBeInTheDocument()
  })
})
