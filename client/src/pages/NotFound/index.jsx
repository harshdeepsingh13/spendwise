import { Box, Button, Typography } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>Page Not Found — Spendwise</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          px: 3,
          gap: 2,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 900, color: 'primary.main', lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h2" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Page not found
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 360 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/')} sx={{ mt: 1 }}>
          Go to Spendwise
        </Button>
      </Box>
    </>
  )
}
