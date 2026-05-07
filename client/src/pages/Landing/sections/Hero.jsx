import { useRef, useMemo, lazy, Suspense } from 'react'
import { Box, Button, Typography, useTheme } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import { useParallax } from '../hooks/useParallax'

const ThreeScene = lazy(() => import('../components/ThreeScene'))

const gradientShift = keyframes`
  0%   { background-position: 0% 50% }
  50%  { background-position: 100% 50% }
  100% { background-position: 0% 50% }
`

const pulseDot = keyframes`
  0%, 100% { opacity: 1; transform: scale(1) }
  50%       { opacity: 0.5; transform: scale(1.4) }
`

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px) }
  to   { opacity: 1; transform: translateY(0) }
`

// LCP-safe variant: h1 must be visible at first paint so it registers as LCP
const slideUp = keyframes`
  from { transform: translateY(24px) }
  to   { transform: translateY(0) }
`

export default function Hero({ onOpenAuth }) {
  const theme = useTheme()
  const slowRef = useRef(null)
  const midRef = useRef(null)
  useParallax(slowRef, midRef)

  const stars = useMemo(() => Array.from({ length: 55 }, (_, i) => ({
    id: i,
    size: Math.random() < 0.25 ? 2 : 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    opacity: 0.12 + Math.random() * 0.35,
  })), [])

  const midStars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    size: Math.random() < 0.2 ? 3 : 1.5,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    opacity: 0.08 + Math.random() * 0.22,
  })), [])

  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 14,
        pb: 10,
        px: 3,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Radial background glow */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 60%),
                     radial-gradient(ellipse 50% 40% at 80% 80%, ${alpha(theme.palette.custom.aiPurple, 0.07)}, transparent)`,
      }} />

      {/* Parallax star layers */}
      <Box ref={slowRef} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform' }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position: 'absolute', borderRadius: '50%', background: 'white',
            width: `${s.size}px`, height: `${s.size}px`, top: s.top, left: s.left, opacity: s.opacity,
          }} />
        ))}
      </Box>
      <Box ref={midRef} sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform' }}>
        {midStars.map(s => (
          <div key={s.id} style={{
            position: 'absolute', borderRadius: '50%', background: 'white',
            width: `${s.size}px`, height: `${s.size}px`, top: s.top, left: s.left, opacity: s.opacity,
          }} />
        ))}
      </Box>

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.9,
          px: 2, py: 0.75,
          background: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          borderRadius: 6, mb: 3.5,
          animation: `${fadeUp} 0.7s 0.2s both`,
        }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.light',
            animation: `${pulseDot} 2s infinite`,
          }} />
          <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600 }}>
            Now with AI-powered insights
          </Typography>
        </Box>

        {/* Headline */}
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '2.6rem', sm: '3.8rem', md: '5.2rem', lg: '6rem' },
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: '-3px',
            mb: 2,
            opacity: 1,
            animation: `${slideUp} 0.7s 0.4s ease both`,
          }}
        >
          <Box component="span" sx={{ display: 'block', color: 'text.primary' }}>
            Smart money.
          </Box>
          <Box component="span" sx={{
            display: 'block',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.custom.aiPurple} 45%, ${theme.palette.secondary.main} 100%)`,
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${gradientShift} 4s ease infinite, ${fadeUp} 0.7s 0.4s both`,
          }}>
            Smarter you.
          </Box>
        </Typography>

        {/* SEO subtitle — visually hidden, keyword-targeted */}
        <Typography
          component="h2"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
          }}
        >
          SpendWise — Smart Budget App — Track Spending, Scan Receipts with OCR
        </Typography>

        {/* Sub */}
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 540,
            fontSize: { xs: '0.95rem', md: '1.15rem' },
            lineHeight: 1.7,
            mb: 4.5,
            animation: `${fadeUp} 0.7s 0.6s both`,
          }}
        >
          Track expenses, scan receipts with OCR, visualize spending trends, and hit your budget goals — all in one beautifully designed app.
        </Typography>

        {/* CTA */}
        <Box sx={{ animation: `${fadeUp} 0.7s 0.8s both` }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => onOpenAuth('signup')}
            sx={{
              px: 5, py: 1.75, fontSize: '1rem', fontWeight: 700, borderRadius: 3,
              boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.4)}`,
              '&:hover': { boxShadow: `0 0 60px ${alpha(theme.palette.primary.main, 0.6)}` },
            }}
          >
            Get started free &nbsp;→
          </Button>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', mt: 1.5, animation: `${fadeUp} 0.7s 1s both` }}
        >
          No credit card required · Free forever
        </Typography>

        {/* Three.js scene */}
        <Box sx={{ width: { xs: '90vw', md: '700px' }, animation: `${fadeUp} 0.9s 1.1s both` }}>
          <Suspense fallback={<Box sx={{ height: { xs: 300, md: 420 }, mt: 4 }} />}>
            <ThreeScene />
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}

