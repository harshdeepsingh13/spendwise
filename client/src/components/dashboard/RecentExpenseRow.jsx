import { Box, Typography } from '@mui/material'
import dayjs from '@/lib/dayjs'

export const RecentExpenseRow = ({ expense }) => {
  const amount = parseFloat(expense.amount ?? 0)
  const categoryColor = expense.category?.color || null

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 1.25,
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:last-child': { borderBottom: 'none' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box sx={{
          width: 8, height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: categoryColor || 'text.disabled',
        }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {expense.category?.name ?? 'Uncategorized'}
          </Typography>
          {expense.notes && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {expense.notes}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: 'custom.amountGold' }}>
          ${amount.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {dayjs(expense.date).format('MMM D')}
        </Typography>
      </Box>
    </Box>
  )
}
