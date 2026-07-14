import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Divider, Tab, Tabs, TextField, Typography
} from '@mui/material'
import { AppModal } from '../../../components/common/AppModal'
import { authService } from '../../../services/auth.service'
import { useAuthContext } from '../../../context/AuthContext'

export default function AuthModal({ open, onClose, defaultTab = 'signup' }) {
  const [tab, setTab] = useState(defaultTab === 'login' ? 1 : 0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaChallengeToken, setMfaChallengeToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const { setToken } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    setTab(defaultTab === 'login' ? 1 : 0)
  }, [defaultTab])

  // Pick up OAuth MFA challenge token left by AuthCallback
  useEffect(() => {
    if (!open) return
    const pending = sessionStorage.getItem('mfaChallengeToken')
    if (pending) {
      sessionStorage.removeItem('mfaChallengeToken')
      setMfaChallengeToken(pending)
      setMfaStep(true)
    }
  }, [open])

  const reset = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setLoading(false)
    setMfaStep(false)
    setMfaChallengeToken('')
    setTotpCode('')
  }

  const handleTabChange = (_, newTab) => {
    setTab(newTab)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (tab === 0 && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      let data
      if (tab === 0) {
        data = await authService.signup(email, password)
      } else {
        data = await authService.login(email, password)
        if (data.requiresMfa) {
          setMfaChallengeToken(data.mfaChallengeToken)
          setMfaStep(true)
          setLoading(false)
          return
        }
      }
      setToken(data.token)
      reset()
      onClose()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong')
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!totpCode || totpCode.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app')
      return
    }

    setLoading(true)
    try {
      const result = await authService.validateMfa(mfaChallengeToken, totpCode)
      setToken(result.token)
      reset()
      onClose()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google'
  }

  if (mfaStep) {
    return (
      <AppModal
        open={open}
        onClose={() => { reset(); onClose() }}
        title="Two-Factor Authentication"
      >
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Enter the 6-digit code from your authenticator app
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleMfaSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Authentication Code"
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            fullWidth
            placeholder="000000"
            autoFocus
            slotProps={{
              htmlInput: { inputMode: 'numeric', maxLength: 6 }
            }}
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Verifying…' : 'Verify →'}
          </Button>
          <Button
            variant="text"
            onClick={() => { setMfaStep(false); setMfaChallengeToken(''); setTotpCode(''); setError('') }}
          >
            Back to sign in
          </Button>
        </Box>
      </AppModal>
    );
  }

  return (
    <AppModal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Welcome to Spendwise"
    >
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 1 }}>
        <Tab label="Create account" />
        <Tab label="Sign in" />
      </Tabs>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete={tab === 0 ? 'new-password' : 'current-password'}
          helperText={tab === 0 ? 'Minimum 8 characters' : undefined}
        />
        {tab === 0 && (
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />
        )}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          fullWidth
        >
          {loading ? 'Please wait…' : tab === 0 ? 'Create free account →' : 'Sign in →'}
        </Button>
      </Box>
      <Divider sx={{ my: 0.5 }}>
        <Typography variant="caption" sx={{
          color: "text.disabled"
        }}>or continue with</Typography>
      </Divider>
      <Button
        variant="outlined"
        fullWidth
        onClick={handleGoogleAuth}
        startIcon={
          <Box
            component="span"
            sx={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'conic-gradient(#4285f4 0deg 90deg, #34a853 90deg 180deg, #fbbc05 180deg 270deg, #ea4335 270deg 360deg)',
              flexShrink: 0,
            }}
          />
        }
      >
        Continue with Google
      </Button>
      <Typography variant="caption" align="center" sx={{
        color: "text.disabled"
      }}>
        No credit card required · Free forever
      </Typography>
    </AppModal>
  );
}
