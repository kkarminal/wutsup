import React, { createContext, useContext, useState } from 'react'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

interface AuthContextValue {
  auth: AuthState
  login(token: string): void
  logout(): void
}

const STORAGE_KEY = 'admin_token'

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    // Base64url decode the payload (middle part)
    const payload = parts[1]
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed = JSON.parse(decoded) as { exp?: number }
    if (typeof parsed.exp !== 'number') return false
    return parsed.exp < Date.now() / 1000
  } catch {
    return true
  }
}

function readInitialState(): AuthState {
  const token = localStorage.getItem(STORAGE_KEY)
  if (token === null) {
    return { token: null, isAuthenticated: false }
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem(STORAGE_KEY)
    return { token: null, isAuthenticated: false }
  }
  return { token, isAuthenticated: true }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readInitialState)

  function login(token: string) {
    localStorage.setItem(STORAGE_KEY, token)
    setAuth({ token, isAuthenticated: true })
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setAuth({ token: null, isAuthenticated: false })
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
