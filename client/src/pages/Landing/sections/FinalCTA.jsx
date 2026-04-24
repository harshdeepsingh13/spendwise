import { useEffect } from 'react'
import { Box, Button, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import GitHubIcon from '@mui/icons-material/GitHub'
import LanguageIcon from '@mui/icons-material/Language'
import { Link as RouterLink } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'

const socials = [
  {
    label: 'Portfolio',
    href: 'https://theharshdeepsingh.com',
    Icon: LanguageIcon,
    color: 'primary',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/harshdeepsingh13',
    Icon: GitHubIcon,
    color: 'aiPurple',
  },
]

function useFloatingParticles() {
  const theme = useTheme()
  useEffect(() => {
    const colors = [
      alpha(theme.palette.primary.main, 0.4),
      alpha(theme.palette.secondary.main, 0.3),
      alpha(theme.palette.custom.aiPurple, 0.35),
    ]
    let active = true
    const spawn = () => {
      if (!active) return
      const p = document.createElement('div')
      const size = Math.random() * 3 + 1
      const dur = Math.random() * 12 + 8
      Object.assign(p.style, {
        position: 'fixed',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        left: `${Math.random() * 100}vw`,
        bottom: '-10px',
        background: colors[Math.floor(Math.random() * colors.length)],
        pointerEvents: 'none',
        zIndex: 0,
        animation: `landingParticleFloat ${dur}s linear forwards`,
      })
      document.body.appendChild(p)
      setTimeout(() => p.remove(), (dur + 1) * 1000)
      setTimeout(spawn, 600)
    }
    const styleEl = document.createElement('style')
    styleEl.textContent = `
      @keyframes landingParticleFloat {
        0%   { opacity: 0; transform: translateY(0) scale(0) }
        10%  { opacity: 1 }
        90%  { opacity: 0.2 }
        100% { opacity: 0; transform: translateY(-100vh) scale(0.5) }
      }
    `
    document.head.appendChild(styleEl)
    spawn()
    return () => {
      active = false
      styleEl.remove()
    }
  }, [])
}

export default function FinalCTA({ onOpenAuth }) {
  const theme = useTheme()
  useFloatingParticles()
  const [ref, visible] = useScrollReveal()

  return (
    <>
      <Box
        component="section"
        sx={{
          py: { xs: 10, md: 14 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${alpha(theme.palette.primary.main, 0.1)}, transparent 70%)`,
        }} />
        <Box
          ref={ref}
          sx={{
            position: 'relative', zIndex: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(40px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3.2rem', lg: '3.8rem' },
              fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, mb: 2,
            }}
          >
            Start tracking your money
            <Box component="span" sx={{
              display: 'block',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              for free, right now.
            </Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
            Join thousands of people who finally understand where their money goes.
          </Typography>
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
            Create free account →
          </Button>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: `1px solid ${alpha('#94A3B8', 0.05)}`,
          py: 5, px: { xs: 2, md: 6 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 700 }}>
          Spendwise © 2026
        </Typography>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
          <Box
            component={RouterLink}
            to="/privacy"
            sx={{ fontSize: 12, color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'text.secondary' } }}
          >
            Privacy Policy
          </Box>
          <Box
            component={RouterLink}
            to="/terms"
            sx={{ fontSize: 12, color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'text.secondary' } }}
          >
            Terms of Service
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {socials.map(({ label, href, Icon, color }) => (
            <Box
              key={label}
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.8,
                px: 2, py: 0.75,
                borderRadius: 6,
                border: `1px solid ${alpha(color === 'aiPurple' ? theme.palette.custom.aiPurple : theme.palette.primary.main, 0.25)}`,
                background: alpha(color === 'aiPurple' ? theme.palette.custom.aiPurple : theme.palette.primary.main, 0.07),
                color: color === 'aiPurple' ? theme.palette.custom.aiPurple : 'primary.light',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.01em',
                transition: 'all 0.22s ease',
                '&:hover': {
                  background: alpha(color === 'aiPurple' ? theme.palette.custom.aiPurple : theme.palette.primary.main, 0.18),
                  border: `1px solid ${alpha(color === 'aiPurple' ? theme.palette.custom.aiPurple : theme.palette.primary.main, 0.55)}`,
                  boxShadow: `0 0 18px ${alpha(color === 'aiPurple' ? theme.palette.custom.aiPurple : theme.palette.primary.main, 0.35)}`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Icon sx={{ fontSize: 15 }} />
              {label}
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: 'text.disabled' }}>
          Made with
          <Box component="span" sx={{
            color: '#e05c7a',
            display: 'inline-block',
            animation: 'footerHeartbeat 1.6s ease-in-out infinite',
            '@keyframes footerHeartbeat': {
              '0%, 100%': { transform: 'scale(1)' },
              '14%': { transform: 'scale(1.35)' },
              '28%': { transform: 'scale(1)' },
              '42%': { transform: 'scale(1.2)' },
              '56%': { transform: 'scale(1)' },
            },
          }}>♥</Box>
          by
          <Box component="span" sx={{
            fontWeight: 700,
            background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.custom.aiPurple})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.02em',
          }}>
            Harshdeep Singh
          </Box>
        </Box>
      </Box>
    </>
  )
}
