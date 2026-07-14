import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { AppModal } from '../common/AppModal'
import { authService } from '../../services/auth.service'

export function MfaSetupModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState('init')   // 'init' | 'scan' | 'verify'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [base32, setBase32] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await authService.setupMfa()
      setQrCodeDataUrl(data.qrCodeDataUrl)
      setBase32(data.base32)
      setStep('scan')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start MFA setup')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    if (!totpCode || totpCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app')
      return
    }
    setLoading(true)
    try {
      await authService.verifyMfaSetup(totpCode)
      setStep('init')
      setTotpCode('')
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('init')
    setTotpCode('')
    setError('')
    onClose()
  }

  return (
    <AppModal open={open} onClose={handleClose} title="Enable Two-Factor Authentication">
      {error && <Alert severity="error">{error}</Alert>}
      {step === 'init' && (
        <>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Add an extra layer of security to your account. You'll need an authenticator app
            (Google Authenticator, Authy, etc.) on your phone.
          </Typography>
          <Button variant="contained" onClick={handleStart} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Set Up MFA'}
          </Button>
        </>
      )}
      {step === 'scan' && (
        <>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img src={qrCodeDataUrl} alt="MFA QR Code" width={200} height={200} />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              wordBreak: 'break-all'
            }}>
            Backup key: {base32}
          </Typography>
          <TextField
            label="Authentication Code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            placeholder="000000"
            slotProps={{
              htmlInput: { inputMode: 'numeric', maxLength: 6 }
            }}
          />
          <Button variant="contained" onClick={handleVerify} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Verify & Enable'}
          </Button>
        </>
      )}
    </AppModal>
  );
}
