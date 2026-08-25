"use client"

import { BookOpen, Calendar, Home, MessageSquare, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const primaryItems = [
  { name: "Feed", href: "/app/feed", icon: Home },
  { name: "Pods", href: "/app/pods", icon: Users },
  { name: "Calendar", href: "/app/calendar", icon: Calendar },
  { name: "Chat", href: "/app/chat", icon: MessageSquare },
  { name: "Vault", href: "/app/vault", icon: BookOpen },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [chatConversationOpen, setChatConversationOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/app/feed" && pathname === "/app")
  const isPodWorkspace = /^\/app\/pods\/(?!create(?:\/|$)|join(?:\/|$)|invites(?:\/|$))[^/]+/.test(pathname)
  const legacyConversation = pathname.startsWith("/app/messages/")
  const navigationHidden = pathname.startsWith("/app/ai") || isPodWorkspace || legacyConversation || (pathname.startsWith("/app/chat") && chatConversationOpen)

  useEffect(() => {
    const handleChatFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ focused?: boolean }>).detail
      setChatConversationOpen(Boolean(detail?.focused))
    }
    window.addEventListener("student:chat-focus", handleChatFocus)
    return () => window.removeEventListener("student:chat-focus", handleChatFocus)
  }, [])

  useEffect(() => {
    if (!pathname.startsWith("/app/chat")) setChatConversationOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.classList.toggle("student-mobile-focus", navigationHidden)
    return () => document.documentElement.classList.remove("student-mobile-focus")
  }, [navigationHidden])

  if (navigationHidden) return null

  return (
    <nav aria-label="Mobile navigation" className="student-mobile-nav md:hidden">
      <div className="student-mobile-nav-inner">
        {primaryItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.name} href={item.href} aria-current={active ? "page" : undefined} className={cn("student-mobile-link", active && "is-active")}>
              <span><item.icon aria-hidden="true" /></span><small>{item.name}</small>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
