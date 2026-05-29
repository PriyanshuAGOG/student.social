"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isAdminUser } from "@/lib/admin-access"
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter"

export default function AdminPage() {
  const router = useRouter()
  const { user, loading, sessionChecked } = useAuth()
  const isAdmin = isAdminUser(user)

  useEffect(() => {
    if (!loading && sessionChecked && !isAdmin) {
      router.replace("/feed")
    }
  }, [isAdmin, loading, router, sessionChecked])

  if (loading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <AdminCommandCenter adminEmail={user?.email} />
  )
}
