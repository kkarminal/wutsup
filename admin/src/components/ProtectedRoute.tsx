import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Renders children if the user is authenticated.
 * Redirects to /login if the user is unauthenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { auth } = useAuth()

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
