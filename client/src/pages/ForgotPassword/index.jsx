import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Link, TextField } from '@mui/material'
import { AuthCard } from '../../components/auth/AuthCard'
import { authService } from '../../services/auth.service'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="success">
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
          </Alert>
          <Link component={RouterLink} to="/?auth=login" underline="hover" textAlign="center">
            Back to sign in
          </Link>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            autoFocus
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Sending…' : 'Send reset link →'}
          </Button>
          <Link component={RouterLink} to="/?auth=login" underline="hover" textAlign="center">
            Back to sign in
          </Link>
        </Box>
      )}
    </AuthCard>
  )
}
