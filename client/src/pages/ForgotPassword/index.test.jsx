import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../services/auth.service', () => ({
  authService: { requestPasswordReset: vi.fn() },
}))

import { authService } from '../../services/auth.service'
import ForgotPasswordPage from './index'

const renderPage = () => render(
  <MemoryRouter>
    <ForgotPasswordPage />
  </MemoryRouter>
)

beforeEach(() => vi.clearAllMocks())

describe('ForgotPasswordPage', () => {
  it('submits the email and shows a generic success message', async () => {
    authService.requestPasswordReset.mockResolvedValue({})
    renderPage()

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => expect(authService.requestPasswordReset).toHaveBeenCalledWith('user@example.com'))
    expect(await screen.findByText(/a reset link is on its way/i)).toBeInTheDocument()
  })

  it('shows an error when the request fails', async () => {
    authService.requestPasswordReset.mockRejectedValue({ response: { data: { error: 'boom' } } })
    renderPage()

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('boom')).toBeInTheDocument()
  })
})
