'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Models, AppwriteException } from 'appwrite'
import { authService, profileService, isAppwriteEmailVerified } from './appwrite'

import { Profile } from '@/types'

type UserProfile = Profile & {
  identity?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  profile: UserProfile | null
  loading: boolean
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  hasActiveSession: boolean
  isEmailVerified: boolean
  sessionChecked: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkSession: () => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type SessionSnapshot = {
  user: Models.User<Models.Preferences> | null
  profile: UserProfile | null
}

// Session state stored in memory to prevent unnecessary API calls
let sessionCheckPromise: Promise<SessionSnapshot> | null = null

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchSessionSnapshot(): Promise<SessionSnapshot> {
  try {
    const retryDelays = [0, 150, 400]

    for (const waitMs of retryDelays) {
      if (waitMs > 0) {
        await delay(waitMs)
      }

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)
      if (response.ok && payload?.authenticated && payload?.user) {
        return {
          user: payload.user as Models.User<Models.Preferences>,
          profile: (payload.profile as UserProfile | null) || null,
        }
      }
    }

    return { user: null, profile: null }
  } catch {
    return { user: null, profile: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  // Clear any error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Check if there's an active session without creating a new one
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      let snapshot: SessionSnapshot
      if (sessionCheckPromise) {
        snapshot = await sessionCheckPromise
      } else {
        const request = fetchSessionSnapshot()
        sessionCheckPromise = request
        try {
          snapshot = await request
        } finally {
          if (sessionCheckPromise === request) sessionCheckPromise = null
        }
      }

      const currentUser = snapshot.user

      if (currentUser) {
        const verified = isAppwriteEmailVerified(currentUser)
        setUser(currentUser)
        setHasActiveSession(true)
        setIsEmailVerified(verified)
        setError(verified ? null : 'Please verify your email address before using PeerSpark.')

        if (!verified) {
          setProfile(null)
          return true
        }

        // The session endpoint already reads the profile. Only bootstrap when
        // that authenticated read confirms the profile is genuinely missing.
        try {
          const userProfile = snapshot.profile?.$id === currentUser.$id
            ? snapshot.profile
            : await profileService.ensureProfileExists(currentUser.$id, {
                name: currentUser.name,
                email: currentUser.email,
              })
          if (userProfile) {
            setProfile(userProfile as UserProfile)
          }
        } catch (profileErr) {
          console.warn('Failed to load/create profile:', profileErr)
        }

        return true
      }

      setHasActiveSession(false)
      setIsEmailVerified(false)
      return false
    } catch {
      setHasActiveSession(false)
      setIsEmailVerified(false)
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
          setIsEmailVerified(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setUser(null)
        setProfile(null)
        setIsEmailVerified(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [checkSession])

  useEffect(() => {
    const handleExpiredSession = () => {
      sessionCheckPromise = null
      setUser(null)
      setProfile(null)
      setHasActiveSession(false)
      setIsEmailVerified(false)
      setError('Your session expired. Please sign in again.')
      if (window.location.pathname.startsWith('/app')) {
        window.location.replace('/login?session=expired')
      }
    }

    window.addEventListener('student-social:session-expired', handleExpiredSession)
    return () => window.removeEventListener('student-social:session-expired', handleExpiredSession)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const snapshot = await fetchSessionSnapshot()
      const currentUser = snapshot.user
      if (!currentUser) {
        setUser(null)
        setProfile(null)
        setHasActiveSession(false)
        setIsEmailVerified(false)
        return
      }
      const verified = isAppwriteEmailVerified(currentUser)
      setUser(currentUser)
      setHasActiveSession(true)
      setIsEmailVerified(verified)
      setError(verified ? null : 'Please verify your email address before using PeerSpark.')

      if (!verified) {
        setProfile(null)
        return
      }

      // Also refresh profile - ensure it exists
      if (currentUser?.$id) {
        try {
          const userProfile = snapshot.profile?.$id === currentUser.$id
            ? snapshot.profile
            : await profileService.ensureProfileExists(currentUser.$id, {
                name: currentUser.name,
                email: currentUser.email,
              })
          if (userProfile) {
            setProfile(userProfile as UserProfile)
          }
        } catch (profileErr) {
          console.warn('Failed to refresh/create profile:', profileErr)
        }
      }
    } catch (err: unknown) {
      // Check if error is due to no session (expected when not logged in)
      const isNoSession = (err as AppwriteException)?.code === 401 || (err as AppwriteException)?.message?.includes('missing scope') || (err as AppwriteException)?.message?.includes('unauthorized')

      if (isNoSession) {
        setUser(null)
        setProfile(null)
        setHasActiveSession(false)
        setIsEmailVerified(false)
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
      setIsEmailVerified(false)
      setError(null)

      // Clear any cached session check
      sessionCheckPromise = null
    } catch (err: unknown) {
      // Even if logout fails on server, clear local state
      setUser(null)
      setProfile(null)
      setHasActiveSession(false)
      setIsEmailVerified(false)

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
        isLoading: loading,
        error,
        isAuthenticated: !!user && isEmailVerified,
        hasActiveSession,
        isEmailVerified,
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
