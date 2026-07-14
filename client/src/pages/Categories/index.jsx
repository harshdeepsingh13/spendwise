import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CategoryIcon from '@mui/icons-material/Category'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { PageContainer } from '../../components/common/PageContainer'
import { AppModal } from '../../components/common/AppModal'
import { CategoryFormModal } from '../../components/categories/CategoryFormModal'
import { useCategories, useCategoryMutations } from '../../hooks/useCategories'

const EmptyState = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
    <CategoryIcon sx={{ fontSize: 64, opacity: 0.3 }} />
    <Typography variant="body1" color="text.secondary">
      No categories yet
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Tap the + button to create your first category
    </Typography>
  </Box>
)

export default function CategoriesPage() {
  const { data: categories = [], isLoading, error } = useCategories()
  const { delete: deleteMutation } = useCategoryMutations()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [snackbar, setSnackbar] = useState('')

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (category) => { setEditing(category); setFormOpen(true) }

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(pendingDelete._id)
      setPendingDelete(null)
    } catch (err) {
      setPendingDelete(null)
      setSnackbar(err.response?.data?.message || err.response?.data?.error || 'Could not delete category')
    }
  }

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          New Category
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Could not load categories.</Alert>
      ) : categories.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack gap={1}>
          {categories.map((category) => (
            <Paper
              key={category._id}
              variant="outlined"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: category.color || 'text.disabled',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                {category.icon}
              </Box>
              <Typography variant="body1" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
                {category.name}
              </Typography>
              {category.isDefault ? (
                <Chip label="Default" size="small" variant="outlined" />
              ) : (
                <>
                  <IconButton size="small" onClick={() => openEdit(category)} aria-label={`edit ${category.name}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPendingDelete(category)}
                    aria-label={`delete ${category.name}`}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Mobile add button */}
      <Fab
        color="primary"
        onClick={openCreate}
        aria-label="add category"
        sx={{ position: 'fixed', bottom: 24, right: 24, display: { sm: 'none' } }}
      >
        <AddIcon />
      </Fab>

      <CategoryFormModal open={formOpen} onClose={() => setFormOpen(false)} category={editing} />

      <AppModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete Category"
        actions={
          <>
            <Button onClick={() => setPendingDelete(null)} color="inherit">
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          Delete <strong>{pendingDelete?.name}</strong>? This can't be undone.
        </Typography>
      </AppModal>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={5000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbar('')} variant="filled">
          {snackbar}
        </Alert>
      </Snackbar>
    </PageContainer>
  )
}
