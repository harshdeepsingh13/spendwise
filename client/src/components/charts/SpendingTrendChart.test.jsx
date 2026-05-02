import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material'
import { describe, it, expect, vi } from 'vitest'
import { SpendingTrendChart } from './SpendingTrendChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, height }) => <div style={{ height }}>{children}</div>,
  AreaChart: ({ children, data }) => <div data-testid="area-chart" data-points={data?.length}>{children}</div>,
  BarChart: ({ children, data }) => <div data-testid="bar-chart" data-points={data?.length}>{children}</div>,
  Area: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  // content prop is a React element (<CustomTooltip />), so clone it with active props
  Tooltip: ({ content }) => {
    if (!content) return null
    return React.cloneElement(content, { active: true, payload: [{ value: 99.5 }], label: 'Jan 2026' })
  },
}))

const theme = createTheme()
const wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

const sampleDataWithId = [
  { _id: { month: 1, year: 2026 }, total: 150.5 },
  { _id: { month: 2, year: 2026 }, total: 200.0 },
  { _id: { month: 3, year: 2026 }, total: 75.25 },
]

const sampleDataFlat = [
  { month: 4, year: 2026, total: 300 },
  { month: 5, year: 2026, total: 450.75 },
]

describe('SpendingTrendChart', () => {
  it('renders empty state when data is empty', () => {
    render(<SpendingTrendChart data={[]} />, { wrapper })
    expect(screen.getByText('No data for this period')).toBeInTheDocument()
  })

  it('renders empty state when data prop is omitted', () => {
    render(<SpendingTrendChart />, { wrapper })
    expect(screen.getByText('No data for this period')).toBeInTheDocument()
  })

  it('renders area chart by default with data', () => {
    render(<SpendingTrendChart data={sampleDataWithId} />, { wrapper })
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('renders bar chart when variant is "bar"', () => {
    render(<SpendingTrendChart data={sampleDataWithId} variant="bar" />, { wrapper })
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
  })

  it('renders area chart when variant is "area" explicitly', () => {
    render(<SpendingTrendChart data={sampleDataWithId} variant="area" />, { wrapper })
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('passes correct number of data points to chart from _id-structured data', () => {
    render(<SpendingTrendChart data={sampleDataWithId} />, { wrapper })
    const chart = screen.getByTestId('area-chart')
    expect(chart).toHaveAttribute('data-points', '3')
  })

  it('passes correct number of data points to chart from flat-structured data', () => {
    render(<SpendingTrendChart data={sampleDataFlat} />, { wrapper })
    const chart = screen.getByTestId('area-chart')
    expect(chart).toHaveAttribute('data-points', '2')
  })

  it('does not show empty state when data is provided', () => {
    render(<SpendingTrendChart data={sampleDataFlat} />, { wrapper })
    expect(screen.queryByText('No data for this period')).not.toBeInTheDocument()
  })

  it('renders tooltip with formatted amount', () => {
    render(<SpendingTrendChart data={sampleDataWithId} />, { wrapper })
    expect(screen.getByText('$99.50')).toBeInTheDocument()
    expect(screen.getByText('Jan 2026')).toBeInTheDocument()
  })

  it('renders tooltip in bar chart variant too', () => {
    render(<SpendingTrendChart data={sampleDataWithId} variant="bar" />, { wrapper })
    expect(screen.getByText('$99.50')).toBeInTheDocument()
  })
})
