import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Card, CardContent, Chip, IconButton, Skeleton, Stack, Typography } from '@mui/material'
import { useBudgets } from '../../hooks/useBudgets'

export const BudgetList = ({ onEdit }) => {
  const { data: budgets = [], isLoading } = useBudgets()

  if (isLoading) {
    return (
      <Stack sx={{
        gap: 1.5
      }}>
        {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={52} />)}
      </Stack>
    );
  }

  if (!budgets.length) {
    return (
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          py: 1
        }}>No budgets set. Add one to track spending against your goals.
              </Typography>
    );
  }

  return (
    <Stack sx={{
      gap: 1
    }}>
      {budgets.map(budget => (
        <Card key={budget._id} variant="outlined" sx={{ bgcolor: 'background.elevated' }}>
          <CardContent sx={{ py: '12px !important', px: 2 }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between"
              }}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1
                }}>
                {budget.category?.color && (
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: budget.category.color, flexShrink: 0 }} />
                )}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {budget.category?.name ?? 'Unknown'}
                </Typography>
                <Chip
                  label="monthly"
                  size="small"
                  sx={{ height: 16, fontSize: '0.62rem', opacity: 0.6 }}
                />
              </Stack>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1
                }}>
                <Typography variant="body2" sx={{ color: 'custom.amountGold', fontWeight: 600 }}>
                  ${parseFloat(budget.amount).toFixed(2)}/mo
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onEdit({ id: budget._id, category: budget.category, amount: parseFloat(budget.amount) })}
                  sx={{ opacity: 0.6 }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
