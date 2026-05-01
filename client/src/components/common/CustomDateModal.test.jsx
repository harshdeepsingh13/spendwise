import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomDateModal } from './CustomDateModal'

vi.mock('./AppModal', () => ({
  AppModal: ({ open, onClose, title, children, actions }) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
        <div data-testid="actions">{actions}</div>
      </div>
    ) : null,
}))

vi.mock('./CustomDatePicker', () => ({
  CustomDatePicker: ({ label, value, onChange }) => (
    <input
      aria-label={label}
      value={value ? value.toISOString() : ''}
      onChange={(e) => onChange(dayjs(e.target.value))}
      readOnly
    />
  ),
}))

describe('CustomDateModal', () => {
  const onClose = vi.fn()
  const onApply = vi.fn()

  beforeEach(() => {
    onClose.mockClear()
    onApply.mockClear()
  })

  it('renders nothing when closed', () => {
    render(<CustomDateModal open={false} onClose={onClose} onApply={onApply} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with correct title when open', () => {
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Select Custom Date Range')).toBeInTheDocument()
  })

  it('renders both date pickers', () => {
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('End Date')).toBeInTheDocument()
  })

  it('renders Reset, Cancel, and Apply buttons', () => {
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    expect(screen.getByText('Reset')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Apply')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    await user.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onApply with ISO date strings and then onClose when Apply is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    await user.click(screen.getByText('Apply'))

    expect(onApply).toHaveBeenCalledOnce()
    const [{ startDate, endDate }] = onApply.mock.calls[0]
    expect(dayjs(startDate).isValid()).toBe(true)
    expect(dayjs(endDate).isValid()).toBe(true)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('defaults start date to ~30 days ago and end date to today', () => {
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    const startInput = screen.getByLabelText('Start Date')
    const endInput = screen.getByLabelText('End Date')

    expect(dayjs(startInput.value).isSame(dayjs().subtract(30, 'days'), 'day')).toBe(true)
    expect(dayjs(endInput.value).isSame(dayjs(), 'day')).toBe(true)
  })

  it('initializes dates from currentRange when modal opens', () => {
    const currentRange = {
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
    }
    render(
      <CustomDateModal
        open={true}
        onClose={onClose}
        onApply={onApply}
        currentRange={currentRange}
      />
    )
    const startInput = screen.getByLabelText('Start Date')
    const endInput = screen.getByLabelText('End Date')

    expect(dayjs(startInput.value).isSame(dayjs(currentRange.startDate), 'day')).toBe(true)
    expect(dayjs(endInput.value).isSame(dayjs(currentRange.endDate), 'day')).toBe(true)
  })

  it('resets dates to defaults when Reset is clicked', async () => {
    const user = userEvent.setup()
    const currentRange = {
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
    }
    render(
      <CustomDateModal
        open={true}
        onClose={onClose}
        onApply={onApply}
        currentRange={currentRange}
      />
    )

    await user.click(screen.getByText('Reset'))

    const startInput = screen.getByLabelText('Start Date')
    const endInput = screen.getByLabelText('End Date')
    expect(dayjs(startInput.value).isSame(dayjs().subtract(30, 'days'), 'day')).toBe(true)
    expect(dayjs(endInput.value).isSame(dayjs(), 'day')).toBe(true)
  })

  it('re-initializes dates when modal re-opens with a new currentRange', () => {
    const range1 = { startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-01-31T00:00:00.000Z' }
    const range2 = { startDate: '2025-03-01T00:00:00.000Z', endDate: '2025-03-15T00:00:00.000Z' }

    const { rerender } = render(
      <CustomDateModal open={true} onClose={onClose} onApply={onApply} currentRange={range1} />
    )
    rerender(
      <CustomDateModal open={false} onClose={onClose} onApply={onApply} currentRange={range1} />
    )
    rerender(
      <CustomDateModal open={true} onClose={onClose} onApply={onApply} currentRange={range2} />
    )

    const startInput = screen.getByLabelText('Start Date')
    expect(dayjs(startInput.value).isSame(dayjs(range2.startDate), 'day')).toBe(true)
  })

  it('Apply payload endDate is not earlier than startDate by default', async () => {
    const user = userEvent.setup()
    render(<CustomDateModal open={true} onClose={onClose} onApply={onApply} />)
    await user.click(screen.getByText('Apply'))

    const [{ startDate, endDate }] = onApply.mock.calls[0]
    expect(dayjs(endDate).isBefore(dayjs(startDate))).toBe(false)
  })
})
