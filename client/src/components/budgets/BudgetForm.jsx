import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from '@mui/material'
import { useEffect, useState } from 'react'
import { AppModal } from '../common/AppModal'
import { useCategories } from '../../hooks/useCategories'
import { useBudgetMutations } from '../../hooks/useBudgets'

const firstOfCurrentMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

const EMPTY = { categoryId: '', amount: '', effectiveFrom: firstOfCurrentMonth() }

// budget prop shape: { id, category: {_id, name, color}, amount: number }
const toForm = (budget) => ({
  categoryId: budget.category?._id ?? '',
  amount: budget.amount?.toString() ?? '',
  effectiveFrom: firstOfCurrentMonth()
})

export const BudgetForm = ({ open, onClose, budget }) => {
  const isEdit = !!budget
  const [values, setValues] = useState(EMPTY)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  const { data: categories = [] } = useCategories()
  const { create, update, remove } = useBudgetMutations()

  const isBusy = create.isPending || update.isPending || remove.isPending

  useEffect(() => {
    if (open) {
      setValues(isEdit ? toForm(budget) : EMPTY)
      setDeleteConfirming(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!values.categoryId || !values.amount || !values.effectiveFrom) return
    const payload = { categoryId: values.categoryId, amount: parseFloat(values.amount), effectiveFrom: values.effectiveFrom }
    if (isEdit) {
      await update.mutateAsync({ id: budget.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!deleteConfirming) { setDeleteConfirming(true); return }
    await remove.mutateAsync(budget.id)
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Budget' : 'Set Budget'}
      actions={
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            width: "100%"
          }}>
          <Box>
            {isEdit && (
              <Button
                onClick={handleDelete}
                disabled={isBusy}
                color={deleteConfirming ? 'error' : 'inherit'}
                variant={deleteConfirming ? 'contained' : 'text'}
                size="small"
              >
                {remove.isPending ? <CircularProgress size={16} /> : deleteConfirming ? 'Confirm Delete' : 'Remove Budget'}
              </Button>
            )}
          </Box>
          <Stack direction="row" sx={{
            gap: 1
          }}>
            <Button onClick={onClose} disabled={isBusy} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isBusy || !values.categoryId || !values.amount}
            >
              {create.isPending || update.isPending ? <CircularProgress size={16} /> : isEdit ? 'Save' : 'Set Budget'}
            </Button>
          </Stack>
        </Stack>
      }
    >
      <FormControl fullWidth required>
        <InputLabel>Category</InputLabel>
        <Select value={values.categoryId} onChange={set('categoryId')} label="Category" disabled={isEdit}>
          {categories.map(cat => (
            <MenuItem key={cat._id} value={cat._id}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: 1
                }}>
                {cat.color && (
                  <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                )}
                {cat.name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Monthly Budget"
        type="number"
        value={values.amount}
        onChange={set('amount')}
        fullWidth
        required
        placeholder="0.00"
        slotProps={{
          input: { startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>$</Box> },
          htmlInput: { min: 0.01, step: '0.01' }
        }} />
      <TextField
        label="Effective From"
        type="date"
        value={values.effectiveFrom}
        onChange={set('effectiveFrom')}
        fullWidth
        helperText="Budget applies from the start of this month onwards"
        slotProps={{
          inputLabel: { shrink: true }
        }}
      />
    </AppModal>
  );
}
