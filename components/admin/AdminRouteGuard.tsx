'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { isAdminUser } from '@/lib/admin-access'

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const canAccess = isAdminUser(user)

  useEffect(() => {
    if (!loading && !canAccess) {
      router.replace('/app/home')
    }
  }, [loading, canAccess, router])

  if (loading) {
    return <div className="p-8 text-muted-foreground">Checking admin access…</div>
  }

  if (!canAccess) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Admin access required</h1>
        <p className="text-muted-foreground">This page is restricted to PeerSpark administrators. You have been redirected away from sensitive tools.</p>
        <Button onClick={() => router.replace('/app/home')}>Return home</Button>
      </div>
    )
  }

  return <>{children}</>
}
