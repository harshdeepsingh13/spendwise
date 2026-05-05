import { useLocation, useNavigate } from 'react-router-dom'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { navItems } from './navItems'

const DRAWER_WIDTH = 240

export default function NavDrawer({ open, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
    >
      {/* Drawer header / logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 2.5 }}>
        <AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          ExpenseTracker
        </Typography>
      </Box>

      <List disablePadding>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <ListItemButton
              key={path}
              selected={active}
              onClick={() => handleNavClick(path)}
              sx={{
                mx: 1,
                borderRadius: 1.5,
                mb: 0.5,
                color: active ? 'primary.main' : 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'action.selected' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          )
        })}
      </List>
    </Drawer>
  )
}

