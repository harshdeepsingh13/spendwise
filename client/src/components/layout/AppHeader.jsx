import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { navItems } from './navItems'
import { SecuritySettingsModal } from '../mfa/SecuritySettingsModal'
import { useAuth } from '../../hooks/useAuth'

export default function AppHeader({ onMenuClick, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const [securityOpen, setSecurityOpen] = useState(false)

  const currentLabel = navItems.find(i => i.path === location.pathname)?.label ?? 'Dashboard'

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)
  const handleLogout = () => {
    handleMenuClose()
    onLogout()
  }
  const handleSecurityOpen = () => {
    handleMenuClose()
    setSecurityOpen(true)
  }

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {/* Hamburger — mobile only */}
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1, display: { md: 'none' }, color: 'text.primary' }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: { md: 3 } }}>
            <AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                display: { xs: 'none', md: 'block' },
                letterSpacing: '-0.3px',
              }}
            >
              ExpenseTracker
            </Typography>
          </Box>

          {/* Current page title — mobile only */}
          <Typography
            variant="subtitle1"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: 'text.primary',
              display: { xs: 'block', md: 'none' },
            }}
          >
            {currentLabel}
          </Typography>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path
              return (
                <Button
                  key={path}
                  startIcon={<Icon fontSize="small" />}
                  onClick={() => navigate(path)}
                  sx={{
                    color: active ? 'primary.main' : 'text.secondary',
                    fontWeight: active ? 600 : 400,
                    borderBottom: active ? '2px solid' : '2px solid transparent',
                    borderColor: active ? 'primary.main' : 'transparent',
                    borderRadius: 0,
                    px: 1.5,
                    '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
                  }}
                >
                  {label}
                </Button>
              )
            })}
          </Box>

          {/* Avatar + menu */}
          <IconButton onClick={handleAvatarClick} sx={{ color: 'text.secondary', ml: 1 }} aria-label="user menu">
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleSecurityOpen}>Security Settings</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <SecuritySettingsModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        user={user}
      />
    </>
  )
}
