'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Models, AppwriteException } from 'appwrite'
import { account, authService, profileService } from './appwrite'

import { Profile } from '@/types'

type UserProfile = Profile & {
  identity?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  hasActiveSession: boolean
  sessionChecked: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkSession: () => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session state stored in memory to prevent unnecessary API calls
let sessionCheckPromise: Promise<Models.User<Models.Preferences> | null> | null = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)

  // Clear any error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Check if there's an active session without creating a new one
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      // If already checking, wait for the same promise
      if (sessionCheckPromise) {
        const result = await sessionCheckPromise
        return !!result
      }

      sessionCheckPromise = account.get().catch(() => null)
      const currentUser = await sessionCheckPromise
      sessionCheckPromise = null

      if (currentUser) {
        setUser(currentUser)
        setHasActiveSession(true)
        setError(null)

        // Load user profile
        try {
          const userProfile = await profileService.getProfile(currentUser.$id)
          if (userProfile) {
            setProfile(userProfile as UserProfile)
          }
        } catch (profileErr) {
          console.warn('Failed to load profile:', profileErr)
        }

        return true
      }

      setHasActiveSession(false)
      return false
    } catch {
      setHasActiveSession(false)
      sessionCheckPromise = null
      return false
    } finally {
      setSessionChecked(true)
    }
  }, [])

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        const hasSession = await checkSession()

        if (!hasSession) {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [checkSession])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await account.get()
      setUser(currentUser)
      setHasActiveSession(true)
      setError(null)

      // Also refresh profile
      if (currentUser?.$id) {
        try {
          const userProfile = await profileService.getProfile(currentUser.$id)
          if (userProfile) {
            setProfile(userProfile as UserProfile)
          }
        } catch (profileErr) {
          console.warn('Failed to refresh profile:', profileErr)
        }
      }
    } catch (err: unknown) {
      // Check if error is due to no session (expected when not logged in)
      const isNoSession = (err as AppwriteException)?.code === 401 || (err as AppwriteException)?.message?.includes('missing scope') || (err as AppwriteException)?.message?.includes('unauthorized')

      if (isNoSession) {
        setUser(null)
        setProfile(null)
        setHasActiveSession(false)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to refresh user')
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setUser(null)
      setProfile(null)
      setHasActiveSession(false)
      setError(null)

      // Clear any cached session check
      sessionCheckPromise = null
    } catch (err: unknown) {
      // Even if logout fails on server, clear local state
      setUser(null)
      setProfile(null)
      setHasActiveSession(false)

      // Only set error if it's not a "no session" error
      const isNoSession = (err as AppwriteException)?.code === 401 || (err as AppwriteException)?.message?.includes('missing scope')
      if (!isNoSession) {
        setError(err instanceof Error ? err.message : 'Logout failed')
        throw err
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isAuthenticated: !!user,
        hasActiveSession,
        sessionChecked,
        logout,
        refreshUser,
        checkSession,
        clearError,
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
