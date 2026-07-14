import { useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField } from '@mui/material'
import { AppModal } from '../common/AppModal'
import { ColorPicker, PRESET_COLORS } from '../common/ColorPicker'
import { useCategoryMutations } from '../../hooks/useCategories'

const DEFAULT_COLOR = PRESET_COLORS[0]

/**
 * Create/edit modal for a category. Reuses {@link AppModal} for the shell and
 * {@link ColorPicker} for the color field. Runs the create or update mutation itself
 * based on whether `category` is provided.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {() => void} props.onClose - Close handler.
 * @param {object|null} props.category - Category being edited, or null to create.
 */
export const CategoryFormModal = ({ open, onClose, category }) => {
  const isEdit = Boolean(category)
  const { create, update } = useCategoryMutations()
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [icon, setIcon] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '')
      setColor(category?.color ?? DEFAULT_COLOR)
      setIcon(category?.icon ?? '')
      setError('')
    }
  }, [open, category])

  const mutation = isEdit ? update : create
  const isPending = create.isPending || update.isPending

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    const data = { name: name.trim(), color, icon: icon.trim() || undefined }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: category._id, data })
      } else {
        await create.mutateAsync(data)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not save category')
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'New Category'}
      actions={
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Stack gap={2} sx={{ pt: 1 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          autoFocus
        />
        <TextField
          label="Icon (emoji, optional)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          fullWidth
          inputProps={{ maxLength: 2 }}
          placeholder="🍔"
        />
        <ColorPicker value={color} onChange={setColor} />
      </Stack>
    </AppModal>
  )
}
