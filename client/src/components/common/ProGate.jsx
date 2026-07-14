import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Card, CardContent, Typography } from '@mui/material'

export const ProGate = ({ locked, children }) => {
  if (!locked) return children

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
        {children}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ maxWidth: 280, textAlign: 'center' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: '20px !important' }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.dark', display: 'flex' }}>
              <LockOutlinedIcon sx={{ color: 'primary.light', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '0.95rem' }}>Pro Feature</Typography>
              <Typography variant="caption" color="text.secondary">
                Upgrade to Pro to unlock full history and advanced analytics
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
