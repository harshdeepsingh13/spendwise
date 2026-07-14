import { useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Link, TextField } from '@mui/material'
import { AuthCard } from '../../components/auth/AuthCard'
import { authService } from '../../services/auth.service'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/?auth=login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthCard title="Invalid reset link">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="error">This reset link is missing or invalid. Please request a new one.</Alert>
          <Link component={RouterLink} to="/forgot-password" underline="hover" textAlign="center">
            Request a new link
          </Link>
        </Box>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password">
      {done ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="success">Password reset. Redirecting you to sign in…</Alert>
          <Link component={RouterLink} to="/?auth=login" underline="hover" textAlign="center">
            Go to sign in
          </Link>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Minimum 8 characters, with a number or special character"
            autoFocus
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Resetting…' : 'Reset password →'}
          </Button>
        </Box>
      )}
    </AuthCard>
  )
}
