"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Calendar, Home, Shield, Users, Brain } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isAdminUser } from "@/lib/admin-access"

const navigationItems = [
  { name: "Home", href: "/app/feed", icon: Home },
  { name: "Pods", href: "/app/pods", icon: Users },
  { name: "Calendar", href: "/app/calendar", icon: Calendar },
  { name: "AI", href: "/app/ai", icon: Brain },
  { name: "Vault", href: "/app/vault", icon: BookOpen },
]

export function FloatingNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const canAccessAdmin = isAdminUser(user)

  const items = [
    ...navigationItems,
    ...(canAccessAdmin ? [{ name: "Admin", href: "/app/admin", icon: Shield }] : []),
  ]

  return (
    <nav className="pointer-events-auto fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:bottom-8">
      <div className="w-full max-w-4xl rounded-full border border-border/70 bg-background/90 px-2 py-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="flex items-center justify-between gap-1 overflow-x-auto sm:justify-center sm:gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href === "/app/feed" && pathname === "/app")

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}