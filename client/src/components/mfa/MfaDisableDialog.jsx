import { Alert, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { AppModal } from '../common/AppModal'
import { authService } from '../../services/auth.service'

export function MfaDisableDialog({ open, onClose, onSuccess }) {
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDisable = async () => {
    setError('')
    if (!totpCode || totpCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app')
      return
    }
    setLoading(true)
    try {
      await authService.disableMfa(totpCode)
      setTotpCode('')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTotpCode('')
    setError('')
    onClose()
  }

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Disable Two-Factor Authentication"
      actions={
        <>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDisable} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Disable MFA'}
          </Button>
        </>
      }
    >
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>
        Enter your current authenticator code to confirm disabling MFA.
      </Typography>
      <TextField
        label="Authentication Code"
        value={totpCode}
        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        fullWidth
        placeholder="000000"
        autoFocus
        slotProps={{
          htmlInput: { inputMode: 'numeric', maxLength: 6 }
        }}
      />
    </AppModal>
  );
}
