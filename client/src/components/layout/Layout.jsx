import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import { useAuthContext } from '../../context/AuthContext'
import AppHeader from './AppHeader'
import NavDrawer from './NavDrawer'
import { navItems } from './navItems'

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuthContext()
  const location = useLocation()

  const currentItem = navItems.find(i => i.path === location.pathname)
  const isHome = location.pathname === '/dashboard'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader
        onMenuClick={() => setDrawerOpen(true)}
        onLogout={logout}
      />

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Offset for fixed AppBar */}
      <Toolbar />

      {/* Breadcrumbs — desktop only */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          px: 3,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.8rem' }}>
          {isHome ? (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', fontWeight: 500 }}>
              Home
            </Typography>
          ) : (
            <MuiLink
              component={Link}
              to="/dashboard"
              underline="hover"
              sx={{ fontSize: '0.8rem', color: 'text.secondary' }}
            >
              Home
            </MuiLink>
          )}
          {!isHome && currentItem && (
            <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', fontWeight: 500 }}>
              {currentItem.label}
            </Typography>
          )}
        </Breadcrumbs>
      </Box>

      {/* Page content */}
      <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        {children}
      </Box>
    </Box>
  )
}
