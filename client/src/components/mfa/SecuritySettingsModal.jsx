import { Alert, Box, Button, Chip, Typography } from '@mui/material'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppModal } from '../common/AppModal'
import { MfaSetupModal } from './MfaSetupModal'
import { MfaDisableDialog } from './MfaDisableDialog'
import { queryKeys } from '../../lib/queryKeys'

export function SecuritySettingsModal({ open, onClose, user }) {
  const queryClient = useQueryClient()
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false)
  const [mfaDisableOpen, setMfaDisableOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleMfaEnabled = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    setMfaSetupOpen(false)
    setSuccessMessage('MFA has been enabled successfully.')
  }

  const handleMfaDisabled = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    setMfaDisableOpen(false)
    setSuccessMessage('MFA has been disabled.')
  }

  const handleClose = () => {
    setSuccessMessage('')
    onClose()
  }

  const mfaEnabled = user?.mfaEnabled

  return (
    <>
      <AppModal open={open} onClose={handleClose} title="Security Settings">
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle2">Two-Factor Authentication</Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              {mfaEnabled
                ? 'Your account is protected with TOTP authentication.'
                : 'Add an extra layer of security using an authenticator app.'}
            </Typography>
          </Box>
          <Chip
            label={mfaEnabled ? 'Enabled' : 'Disabled'}
            color={mfaEnabled ? 'success' : 'default'}
            size="small"
            sx={{ ml: 2, flexShrink: 0 }}
          />
        </Box>

        {mfaEnabled ? (
          <Button variant="outlined" color="error" onClick={() => setMfaDisableOpen(true)}>
            Disable MFA
          </Button>
        ) : (
          <Button variant="contained" onClick={() => setMfaSetupOpen(true)}>
            Enable MFA
          </Button>
        )}
      </AppModal>
      <MfaSetupModal
        open={mfaSetupOpen}
        onClose={() => setMfaSetupOpen(false)}
        onSuccess={handleMfaEnabled}
      />
      <MfaDisableDialog
        open={mfaDisableOpen}
        onClose={() => setMfaDisableOpen(false)}
        onSuccess={handleMfaDisabled}
      />
    </>
  );
}
