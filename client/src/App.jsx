import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuthContext } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LandingPage from './pages/Landing'

const DashboardPage = lazy(() => import('./pages/Dashboard'))
const ExpensesPage = lazy(() => import('./pages/Expenses'))
const AnalyticsPage = lazy(() => import('./pages/Analytics'))
const ReceiptsPage = lazy(() => import('./pages/Receipts'))
const CategoriesPage = lazy(() => import('./pages/Categories'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'))
const PrivacyPage = lazy(() => import('./pages/Privacy'))
const TermsPage = lazy(() => import('./pages/Terms'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))

function PageFallback() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  )
}

function ProtectedRoute({ children }) {
  const { token } = useAuthContext()
  return token ? <Layout>{children}</Layout> : <Navigate to="/?auth=login" replace />
}

function GuestRoute({ children }) {
  const { token } = useAuthContext()
  return token ? <Navigate to="/dashboard" replace /> : children
}

function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { setToken } = useAuthContext()

  useEffect(() => {
    const token = searchParams.get('token')
    const mfaChallengeToken = searchParams.get('mfaChallengeToken')
    if (token) {
      setToken(token)
      window.history.replaceState({}, document.title, '/dashboard')
    } else if (mfaChallengeToken) {
      sessionStorage.setItem('mfaChallengeToken', mfaChallengeToken)
    }
  }, [searchParams, setToken])

  const mfaChallengeToken = searchParams.get('mfaChallengeToken')
  return <Navigate to={mfaChallengeToken ? '/?auth=login' : '/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/expenses"
            element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>}
          />
          <Route
            path="/receipts"
            element={<ProtectedRoute><ReceiptsPage /></ProtectedRoute>}
          />
          <Route
            path="/categories"
            element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>}
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
