import CloseIcon from '@mui/icons-material/Close'
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'

export const AppModal = ({ open, onClose, title, children, actions, showClose = true }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
      {title}
      {showClose && (
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {children}
    </DialogContent>
    {actions && (
      <DialogActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
)
