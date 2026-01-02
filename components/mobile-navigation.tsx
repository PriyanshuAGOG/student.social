"use client"

import { Home, Bot, Users, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "Home",
    href: "/app/feed",
    icon: Home,
  },
  {
    name: "AI Chat",
    href: "/app/ai",
    icon: Bot,
  },
  {
    name: "Pods",
    href: "/app/pods",
    icon: Users,
  },
  {
    name: "Calendar",
    href: "/app/calendar",
    icon: Calendar,
  },
  {
    name: "Resources",
    href: "/app/vault",
    icon: BookOpen,
  },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/app/feed" && pathname === "/app")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("font-medium", isActive && "text-primary")}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
