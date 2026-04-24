import { useEffect, useState } from 'react'
import { AppBar, Box, Button, Toolbar, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

export default function LandingNav({ onOpenAuth }) {
  const theme = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setShowTop(y > 400)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: scrolled
          ? alpha(theme.palette.background.default, 0.85)
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
          : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 6 }, justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box onClick={scrollToTop} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
          <Box
            sx={{
              width: 32, height: 32, borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'white' }}>S</Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 800, fontSize: 16,
              background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Spendwise
          </Typography>
        </Box>

        {/* Nav links — desktop only */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3.5 }}>
          {[['Features', '#features'], ['How it works', '#how'], ['FAQ', '#faq']].map(([label, href]) => (
            <Box
              key={href}
              component="a"
              href={href}
              sx={{
                fontSize: 13, color: 'text.secondary', textDecoration: 'none',
                '&:hover': { color: 'text.primary' }, transition: 'color 0.2s',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* CTAs */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onOpenAuth('login')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Log in
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => onOpenAuth('signup')}
          >
            Get started free
          </Button>
        </Box>
      </Toolbar>
    </AppBar>

      {/* Floating back-to-top */}
      <Box
        onClick={scrollToTop}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1300,
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.custom.aiPurple})`,
          boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.45)}`,
          opacity: showTop ? 1 : 0,
          transform: showTop ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
          transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease',
          pointerEvents: showTop ? 'auto' : 'none',
          '&:hover': {
            boxShadow: `0 0 32px ${alpha(theme.palette.primary.main, 0.7)}`,
            transform: 'translateY(-2px) scale(1.08)',
          },
        }}
      >
        <KeyboardArrowUpIcon sx={{ color: 'white', fontSize: 22 }} />
      </Box>
    </>
  )
}
