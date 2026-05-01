import { render, screen } from '@testing-library/react'
import { ProGate } from './ProGate'

describe('ProGate', () => {
  it('renders children directly when not locked', () => {
    render(
      <ProGate locked={false}>
        <div>Premium Content</div>
      </ProGate>
    )
    expect(screen.getByText('Premium Content')).toBeInTheDocument()
    expect(screen.queryByText('Pro Feature')).not.toBeInTheDocument()
  })

  it('renders children when locked (blurred behind overlay)', () => {
    render(
      <ProGate locked={true}>
        <div>Premium Content</div>
      </ProGate>
    )
    expect(screen.getByText('Premium Content')).toBeInTheDocument()
  })

  it('shows Pro Feature heading when locked', () => {
    render(
      <ProGate locked={true}>
        <span>content</span>
      </ProGate>
    )
    expect(screen.getByText('Pro Feature')).toBeInTheDocument()
  })

  it('shows upgrade description when locked', () => {
    render(
      <ProGate locked={true}>
        <span>content</span>
      </ProGate>
    )
    expect(
      screen.getByText(/upgrade to pro to unlock full history and advanced analytics/i)
    ).toBeInTheDocument()
  })

  it('shows Upgrade to Pro button when locked', () => {
    render(
      <ProGate locked={true}>
        <span>content</span>
      </ProGate>
    )
    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('does not show overlay when locked is false', () => {
    render(
      <ProGate locked={false}>
        <span>content</span>
      </ProGate>
    )
    expect(screen.queryByRole('button', { name: /upgrade to pro/i })).not.toBeInTheDocument()
  })

  it('treats locked=undefined as not locked', () => {
    render(
      <ProGate>
        <div>Unlocked Content</div>
      </ProGate>
    )
    expect(screen.getByText('Unlocked Content')).toBeInTheDocument()
    expect(screen.queryByText('Pro Feature')).not.toBeInTheDocument()
  })
})
