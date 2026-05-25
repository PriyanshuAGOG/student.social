"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, BellRing, KeyRound, MailCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { isAdminUser } from "@/lib/admin-access"
import { AdminBroadcast } from "@/components/notifications/AdminBroadcast"

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
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" />
            Admin Panel
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Platform control center</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Use this panel to manage broadcasts and monitor whether the notification stack is ready in Appwrite.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {user?.email}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MailCheck className="h-4 w-4" />
              Auth access
            </CardTitle>
            <CardDescription>Admin access is allowlisted by email or Appwrite admin label.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The email chat.priyanshuag@gmail.com is allowed through the shared admin allowlist.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4" />
              Notifications
            </CardTitle>
            <CardDescription>Dashboard setup still required for delivery to work end to end.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You still need the Appwrite database collections, messaging providers, and the scheduled notification-worker function configured in the Appwrite dashboard.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Security
            </CardTitle>
            <CardDescription>Protected by the current session cookie and admin gate.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Broadcast actions are verified against the active Appwrite session before they are saved.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <AdminBroadcast />
    </div>
  )
}