import { Box, Typography, useTheme } from '@mui/material'
import { Cell, Label, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const FALLBACK_COLORS = ['#2563EB', '#F59E0B', '#10B981', '#EF4444', '#38BDF8', '#7C3AED', '#F97316', '#84CC16']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <Box sx={{ bgcolor: 'background.elevated', border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1 }}>
      <Typography variant="caption" color="text.secondary">{name}</Typography>
      <Typography variant="body2" sx={{ color: 'custom.amountGold', fontWeight: 600 }}>
        ${value.toFixed(2)}
      </Typography>
    </Box>
  )
}

const CenterLabel = ({ viewBox, grandTotal }) => {
  const { cx, cy } = viewBox
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" style={{ fontSize: '0.7rem', fill: '#94A3B8' }}>Total</tspan>
      <tspan x={cx} dy="1.4em" style={{ fontSize: '1rem', fontWeight: 700, fill: '#F59E0B' }}>
        ${grandTotal.toFixed(0)}
      </tspan>
    </text>
  )
}

export const CategoryDonutChart = ({ data = [], grandTotal = 0, height = 280 }) => {
  const theme = useTheme()

  const chartData = data.map((item, i) => ({
    name: item.categoryInfo?.[0]?.name ?? 'Other',
    value: item.total,
    color: item.categoryInfo?.[0]?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
  }))

  if (!chartData.length) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">No expenses this period</Typography>
      </Box>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="78%"
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
          ))}
          <Label
            content={({ viewBox }) => <CenterLabel viewBox={viewBox} grandTotal={grandTotal} />}
            position="center"
          />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

