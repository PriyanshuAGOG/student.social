"use client"

import { usePathname } from "next/navigation"
import { FloatingNavWithTheme } from "@/components/FloatingNav"
import { useAuth } from "@/lib/auth-context"

export function AppFloatingNav() {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const name = profile?.name || user?.name || "User"
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <FloatingNavWithTheme
      user={{ name, initials }}
      notificationCount={0}
      currentPath={pathname}
    />
  )
}
