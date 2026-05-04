import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import NotFoundPage from './index'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderNotFound() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders without crashing', () => {
    renderNotFound()
  })

  it('displays the 404 heading', () => {
    renderNotFound()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('displays the "Page not found" subheading', () => {
    renderNotFound()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('displays the descriptive message', () => {
    renderNotFound()
    expect(
      screen.getByText(/doesn't exist or has been moved/i)
    ).toBeInTheDocument()
  })

  it('renders the "Go to Spendwise" button', () => {
    renderNotFound()
    expect(screen.getByRole('button', { name: /go to spendwise/i })).toBeInTheDocument()
  })

  it('navigates to "/" when the button is clicked', async () => {
    const user = userEvent.setup()
    renderNotFound()
    await user.click(screen.getByRole('button', { name: /go to spendwise/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })
})
