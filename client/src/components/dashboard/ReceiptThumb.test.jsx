import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ReceiptThumb } from './ReceiptThumb'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

const makeReceipt = (overrides = {}) => ({
  fileType: 'jpeg',
  cloudinaryUrl: 'https://res.cloudinary.com/test/image.jpg',
  name: 'Test Receipt',
  createdAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
})

describe('ReceiptThumb', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders without crashing', () => {
    render(<ReceiptThumb receipt={makeReceipt()} />, { wrapper })
  })

  it('shows image with correct src when receipt has cloudinaryUrl and is not PDF', () => {
    render(<ReceiptThumb receipt={makeReceipt()} />, { wrapper })
    const img = screen.getByRole('img', { name: 'Test Receipt' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/test/image.jpg')
  })

  it('uses receipt name as alt text for image', () => {
    render(<ReceiptThumb receipt={makeReceipt({ name: 'My Invoice' })} />, { wrapper })
    expect(screen.getByAltText('My Invoice')).toBeInTheDocument()
  })

  it('falls back to "Receipt" as alt text when name is absent', () => {
    render(<ReceiptThumb receipt={makeReceipt({ name: undefined })} />, { wrapper })
    expect(screen.getByAltText('Receipt')).toBeInTheDocument()
  })

  it('shows no image element when fileType is pdf', () => {
    const { container } = render(
      <ReceiptThumb receipt={makeReceipt({ fileType: 'pdf' })} />,
      { wrapper }
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows no image element when cloudinaryUrl is absent and not PDF', () => {
    const { container } = render(
      <ReceiptThumb receipt={makeReceipt({ cloudinaryUrl: null })} />,
      { wrapper }
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('displays the formatted date (MMM D)', () => {
    render(<ReceiptThumb receipt={makeReceipt({ createdAt: '2024-03-07T12:00:00.000Z' })} />, { wrapper })
    expect(screen.getByText('Mar 7')).toBeInTheDocument()
  })

  it('navigates to /receipts when clicked', async () => {
    const user = userEvent.setup()
    render(<ReceiptThumb receipt={makeReceipt()} />, { wrapper })
    await user.click(screen.getByRole('img', { name: 'Test Receipt' }))
    expect(mockNavigate).toHaveBeenCalledWith('/receipts')
  })
})
