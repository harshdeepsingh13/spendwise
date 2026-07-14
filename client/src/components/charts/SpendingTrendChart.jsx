import { Box, Typography, useTheme } from '@mui/material'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'background.elevated', border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1 }}>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: 'custom.amountGold', fontWeight: 600 }}>
        ${payload[0]?.value?.toFixed(2) ?? '0.00'}
      </Typography>
    </Box>
  );
}

// data: [{ month: 1..12, year: 2026, total: number }] (from getSummary with groupBy='month')
export const SpendingTrendChart = ({ data = [], height = 240, variant = 'area' }) => {
  const theme = useTheme()

  const chartData = data.map(item => ({
    label: item._id?.day
      ? `${MONTH_LABELS[(item._id.month) - 1]} ${item._id.day}`
      : `${MONTH_LABELS[(item._id?.month ?? item.month) - 1]} ${item._id?.year ?? item.year ?? ''}`.trim(),
    total: item.total ?? 0
  }))

  if (!chartData.length) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>No data for this period</Typography>
      </Box>
    );
  }

  const axisStyle = { fontSize: 11, fill: theme.palette.text.secondary }
  const gridColor = theme.palette.divider

  if (variant === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={55} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.07)' }} />
          <Bar dataKey="total" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          fill="url(#trendGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
