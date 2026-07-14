import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

/**
 * Centered branded card shell for standalone auth pages (forgot/reset password).
 * Keeps those pages visually consistent without duplicating the layout.
 *
 * @param {object} props
 * @param {string} props.title - Heading shown under the brand.
 * @param {string} [props.subtitle] - Optional supporting line under the title.
 * @param {React.ReactNode} props.children - Form body.
 */
export const AuthCard = ({ title, subtitle, children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
      bgcolor: 'background.default',
    }}
  >
    <Card sx={{ width: '100%', maxWidth: 420 }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack alignItems="center" gap={1} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} letterSpacing="-0.3px">
              Spendwise
            </Typography>
          </Stack>
          <Typography variant="h6" fontWeight={600} textAlign="center">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {subtitle}
            </Typography>
          )}
        </Stack>
        {children}
      </CardContent>
    </Card>
  </Box>
)
