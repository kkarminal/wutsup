import { useNavigate } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'

import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    void navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box
            component="img"
            src="/wutsup-logo.png"
            alt="Wutsup"
            sx={{ height: 32, width: 'auto', objectFit: 'contain' }}
          />
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogout}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Container maxWidth="lg" sx={{ py: 5, flex: 1 }}>
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome to the Wutsup admin portal.
          </Typography>
        </Box>

        {/* Placeholder content card */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 6,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight: 320,
            borderStyle: 'dashed',
          }}
        >
          <DashboardOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            Nothing here yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', maxWidth: 360 }}>
            Dashboard content will appear here as features are added to the admin portal.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
