'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth-context'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register', 
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-otp',
  '/',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
  '/help',
  '/support',
  '/status',
  '/demo',
  '/community-guidelines',
  '/accessibility',
  '/cookies',
  '/dmca',
]

/**
 * Higher-order component to protect routes
 * Redirects unauthenticated users to /login
 * Auto-redirects authenticated users away from auth pages to /app/feed
 */
export function ProtectRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, hasActiveSession, sessionChecked, checkSession } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  // Determine if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname?.startsWith(route + '/')
  )
  const isAuthPage = pathname === '/login' || pathname === '/register'

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Wait for initial auth check
        if (loading) return
        
        // If session not checked yet, check it
        if (!sessionChecked) {
          await checkSession()
        }
        
        // If authenticated and on auth page, redirect to feed
        if ((isAuthenticated || hasActiveSession) && isAuthPage) {
          router.replace('/app/feed')
          return
        }
        
        // If not authenticated and on protected route, redirect to login
        if (!isAuthenticated && !hasActiveSession && !isPublicRoute) {
          router.replace('/login?session=expired')
          return
        }
        
        setIsChecking(false)
      } catch (err) {
        console.error('Auth verification error:', err)
        setIsChecking(false)
      }
    }
    
    verifyAuth()
  }, [isAuthenticated, loading, hasActiveSession, sessionChecked, checkSession, router, pathname, isPublicRoute, isAuthPage])

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow public routes
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated && !hasActiveSession) {
    return null
  }

  return <>{children}</>
}
