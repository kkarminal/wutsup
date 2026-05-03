import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { useAuth } from '../contexts/AuthContext'
import { login as apiLogin, ApiError } from '../services/apiClient'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setEmailError(null)
    setPasswordError(null)
    setSubmitError(null)

    let hasValidationError = false
    if (!email.trim()) {
      setEmailError('Email is required')
      hasValidationError = true
    }
    if (!password.trim()) {
      setPasswordError('Password is required')
      hasValidationError = true
    }
    if (hasValidationError) return

    setIsLoading(true)
    try {
      const response = await apiLogin(email, password)
      login(response.token)
      void navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSubmitError('Invalid email or password.')
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
      }}
    >
      <Container maxWidth="xs">
        {/* Logo above the card */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/wutsup-logo.png"
            alt="Wutsup"
            sx={{ height: 96, width: 'auto', objectFit: 'contain' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Admin Portal
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            px: 4,
            py: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
          }}
        >
          {/* Form */}
          <Box
            component="form"
            onSubmit={(e) => { void handleSubmit(e) }}
            noValidate
            sx={{ width: '100%', mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError !== null}
              helperText={emailError ?? ' '}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" color={emailError ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError !== null}
              helperText={passwordError ?? ' '}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" color={passwordError ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {submitError !== null && (
              <Alert severity="error" role="alert" sx={{ borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 600 }}
            >
              {isLoading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
