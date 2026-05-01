import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { theme } from '../../theme/theme'
import { AppModal } from './AppModal'

const wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

const renderModal = (props = {}) => {
  const defaults = { open: true, onClose: vi.fn(), title: 'Test Title' }
  return render(<AppModal {...defaults} {...props} />, { wrapper })
}

describe('AppModal', () => {
  it('renders nothing when closed', () => {
    renderModal({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with title when open', () => {
    renderModal()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('shows close button by default', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('hides close button when showClose is false', () => {
    renderModal({ showClose: false })
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders children inside content area', () => {
    renderModal({ children: <p>Content here</p> })
    expect(screen.getByText('Content here')).toBeInTheDocument()
  })

  it('renders actions bar when actions prop is provided', () => {
    renderModal({ actions: <button>Save</button> })
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('does not render actions bar when actions is not provided', () => {
    const { container } = renderModal()
    expect(container.querySelector('.MuiDialogActions-root')).not.toBeInTheDocument()
  })

  it('calls onClose when dialog backdrop is clicked', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const backdrop = document.querySelector('.MuiBackdrop-root')
    if (backdrop) await userEvent.click(backdrop)
    // MUI Dialog calls onClose on backdrop click
    expect(onClose).toHaveBeenCalled()
  })
})
