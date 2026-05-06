import { useNavigate } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import CategoryIcon from '@mui/icons-material/Category'

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

        {/* Navigation cards */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CategoryIcon sx={{ color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Category Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage background images for navigation categories.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => void navigate('/categories')}
              sx={{ textTransform: 'none' }}
            >
              Manage
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
