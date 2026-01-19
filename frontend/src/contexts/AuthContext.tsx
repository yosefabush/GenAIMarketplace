import { useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'

const STORAGE_KEY = 'admin_token'

// Helper to get initial token from localStorage (lazy initializer)
function getInitialToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use lazy initializer to load token from localStorage synchronously on first render
  const [token, setToken] = useState<string | null>(getInitialToken)

  const login = (newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }

  const value = {
    isAuthenticated: !!token,
    token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
