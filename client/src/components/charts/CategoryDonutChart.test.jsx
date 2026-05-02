import { render, screen } from '@testing-library/react'
import { CategoryDonutChart } from './CategoryDonutChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  // Render data items as spans; do NOT spread children so CenterLabel (needs viewBox) is skipped
  Pie: ({ data }) => (
    <div data-testid="pie" data-count={String(data?.length ?? 0)}>
      {data?.map((item, i) => (
        <span key={i} data-testid={`pie-item-${i}`} data-name={item.name} data-color={item.color}>
          {item.name}
        </span>
      ))}
    </div>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: ({ formatter }) => (
    <div data-testid="legend">{formatter ? formatter('Category') : null}</div>
  ),
}))

const SAMPLE_DATA = [
  { categoryInfo: [{ name: 'Food', color: '#ff0000' }], total: 120.5 },
  { categoryInfo: [{ name: 'Transport', color: '#00ff00' }], total: 45.0 },
]

describe('CategoryDonutChart', () => {
  describe('empty state', () => {
    it('shows empty message when data prop is omitted', () => {
      render(<CategoryDonutChart />)
      expect(screen.getByText('No expenses this period')).toBeInTheDocument()
    })

    it('shows empty message when data is an empty array', () => {
      render(<CategoryDonutChart data={[]} grandTotal={0} />)
      expect(screen.getByText('No expenses this period')).toBeInTheDocument()
    })

    it('does not render the chart in empty state', () => {
      render(<CategoryDonutChart data={[]} />)
      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
    })
  })

  describe('chart rendering', () => {
    it('renders the chart when data is provided', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByTestId('pie')).toBeInTheDocument()
    })

    it('passes the correct number of data items to Pie', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('pie').dataset.count).toBe('2')
    })

    it('does not show the empty-state message when data is present', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.queryByText('No expenses this period')).not.toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('uses categoryInfo name for each slice', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('pie-item-0').dataset.name).toBe('Food')
      expect(screen.getByTestId('pie-item-1').dataset.name).toBe('Transport')
    })

    it('uses categoryInfo color for each slice', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('pie-item-0').dataset.color).toBe('#ff0000')
      expect(screen.getByTestId('pie-item-1').dataset.color).toBe('#00ff00')
    })

    it('falls back to "Other" when categoryInfo is absent', () => {
      const data = [{ total: 75 }]
      render(<CategoryDonutChart data={data} grandTotal={75} />)
      expect(screen.getByTestId('pie-item-0').dataset.name).toBe('Other')
    })

    it('falls back to "Other" when categoryInfo is an empty array', () => {
      const data = [{ categoryInfo: [], total: 75 }]
      render(<CategoryDonutChart data={data} grandTotal={75} />)
      expect(screen.getByTestId('pie-item-0').dataset.name).toBe('Other')
    })

    it('falls back to a FALLBACK_COLOR when categoryInfo has no color', () => {
      const data = [{ categoryInfo: [], total: 75 }]
      render(<CategoryDonutChart data={data} grandTotal={75} />)
      const color = screen.getByTestId('pie-item-0').dataset.color
      expect(color).toBeTruthy()
      expect(color).toMatch(/^#/)
    })

    it('cycles through fallback colors for multiple items without colors', () => {
      const data = Array.from({ length: 9 }, (_, i) => ({ total: i + 1 }))
      render(<CategoryDonutChart data={data} grandTotal={45} />)
      // First and 9th items share the same fallback color (8-entry palette wraps)
      const firstColor = screen.getByTestId('pie-item-0').dataset.color
      const ninthColor = screen.getByTestId('pie-item-8').dataset.color
      expect(firstColor).toBe(ninthColor)
    })
  })

  describe('legend', () => {
    it('renders the legend', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('legend formatter renders the label text', () => {
      render(<CategoryDonutChart data={SAMPLE_DATA} grandTotal={165.5} />)
      expect(screen.getByTestId('legend')).toHaveTextContent('Category')
    })
  })
})
