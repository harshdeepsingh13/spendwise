import { Box, Chip, LinearProgress, Typography } from '@mui/material'

const STATUS_COLOR = {
  ok: 'primary',
  warning: 'secondary',
  over: 'error'
}

export const BudgetProgressBar = ({ budget, actual, pct, status }) => {
  const { category, amount } = budget
  const color = STATUS_COLOR[status] ?? 'primary'
  const clampedPct = Math.min(pct, 100)

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {category?.color && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: category.color, flexShrink: 0 }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {category?.name ?? 'Unknown'}
          </Typography>
          {status === 'over' && (
            <Chip label="Over budget" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
          {status === 'warning' && (
            <Chip label="Near limit" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          <Box component="span" sx={{ color: status === 'over' ? 'custom.spendRed' : 'custom.amountGold', fontWeight: 600 }}>
            ${actual.toFixed(0)}
          </Box>
          {' / '}${amount.toFixed(0)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={clampedPct}
        color={color}
        sx={status === 'over' ? {
          '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #F87171, #EF4444)' }
        } : {}}
      />
    </Box>
  )
}
