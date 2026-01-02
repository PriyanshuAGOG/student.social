'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Models } from 'appwrite'
import { account, authService } from './appwrite'

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await account.get()
        setUser(currentUser)
        setError(null)
      } catch (err) {
        setUser(null)
        // User is not logged in, this is expected
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const refreshUser = async () => {
    try {
      const currentUser = await account.get()
      setUser(currentUser)
      setError(null)
    } catch (err) {
      setUser(null)
      setError(err instanceof Error ? err.message : 'Failed to refresh user')
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
