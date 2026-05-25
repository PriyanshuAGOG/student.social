"use client"

import { Home, Bot, Users, Calendar, BookOpen, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { isAdminUser } from "@/lib/admin-access"

export function MobileNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const canAccessAdmin = isAdminUser(user)

  const navigationItems = [
    { name: "Home", href: "/app/feed", icon: Home },
    { name: "AI Chat", href: "/app/ai", icon: Bot },
    { name: "Pods", href: "/app/pods", icon: Users },
    { name: "Calendar", href: "/app/calendar", icon: Calendar },
    { name: "Resources", href: "/app/vault", icon: BookOpen },
    ...(canAccessAdmin ? [{ name: "Admin", href: "/app/admin", icon: Shield }] : []),
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden">
      <div className={`grid h-16 ${navigationItems.length >= 6 ? 'grid-cols-6' : 'grid-cols-5'}`}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/app/feed" && pathname === "/app")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "min-w-0 flex flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("max-w-full truncate", isActive && "text-primary")}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
