"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Bot,
  CalendarDays,
  FileText,
  FileUp,
  Plus,
  Search,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreatePostModal } from "@/components/create-post-modal"
import { useAuth } from "@/lib/auth-context"
import { AppPageTransition } from "./AppPageTransition"

const pageNames: Record<string, string> = {
  feed: "Learning feed",
  pods: "Study pods",
  ai: "AI tutor",
  focus: "Focus",
  chat: "Messages",
  vault: "Resource vault",
  calendar: "Calendar",
  leaderboard: "Leaderboard",
  notifications: "Notifications",
  profile: "Profile",
  settings: "Settings",
  saved: "Saved",
  admin: "Admin",
}

export function AppWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [chatConversationOpen, setChatConversationOpen] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)
  const [greeting, setGreeting] = useState("Hello")
  const section = pathname.split("/").filter(Boolean)[1] || "feed"
  const title = pageNames[section] || "Student.social"
  const immersive = pathname.startsWith("/app/chat") || pathname.startsWith("/app/messages/") || pathname.startsWith("/app/ai") || pathname.startsWith("/app/focus") || pathname.startsWith("/app/search") || pathname.startsWith("/app/calendar") || /^\/app\/pods\/[^/]+/.test(pathname)
  const displayName = profile?.name || user?.name || "Student"
  const firstName = displayName.trim().split(/\s+/)[0] || "Student"
  const initials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S"
  const primaryHome = ["/app", "/app/feed", "/app/pods", "/app/calendar", "/app/chat", "/app/vault"].includes(pathname)
  const showTutorLauncher = primaryHome && !chatConversationOpen && !createPostOpen && !composerFocused

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening")
    }
    updateGreeting()
    const timer = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        router.push("/app/search")
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [router])

  useEffect(() => {
    const handleChatFocus = (event: Event) => setChatConversationOpen(Boolean((event as CustomEvent<{ focused?: boolean }>).detail?.focused))
    const handleComposerFocus = (event: Event) => setComposerFocused(Boolean((event as CustomEvent<{ focused?: boolean }>).detail?.focused))
    window.addEventListener("student:chat-focus", handleChatFocus)
    window.addEventListener("student:composer-focus", handleComposerFocus)
    return () => {
      window.removeEventListener("student:chat-focus", handleChatFocus)
      window.removeEventListener("student:composer-focus", handleComposerFocus)
    }
  }, [])

  return (
    <div className={`student-workspace${immersive ? " is-immersive" : ""}`}>
      {!immersive ? (
        <header className="student-global-bar">
          <Link href="/app/profile" prefetch={false} className="student-global-profile" aria-label={`Open ${displayName}'s profile`}>
            <Avatar><AvatarImage src={profile?.avatar || "/placeholder.svg"} alt={displayName} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <span className="student-global-greeting">
              <span>{greeting},</span><strong>{firstName}</strong><small>{title}</small>
            </span>
          </Link>
          <div className="student-global-tools">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button className="student-create-button"><Plus />Create</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Start something</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setCreatePostOpen(true)}><FileText />Create a post</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/pods/create" prefetch={false}><Users />Create a study pod</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/calendar" prefetch={false}><CalendarDays />Schedule a session</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/vault" prefetch={false}><FileUp />Share a resource</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/ai" prefetch={false}><Bot />Ask the AI tutor</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="ghost" className="student-global-search"><Link href="/app/search" prefetch={false} aria-label="Search posts, pods, and people"><Search aria-hidden="true" /><span>Search posts, pods, or people…</span><kbd>⌘K</kbd></Link></Button>
            <Button asChild variant="ghost" size="icon" className="student-global-icon"><Link href="/app/notifications" prefetch={false} aria-label="Notifications"><Bell /></Link></Button>
          </div>
        </header>
      ) : null}

      <AppPageTransition>{children}</AppPageTransition>

      {showTutorLauncher ? <Link href="/app/ai" prefetch={false} className="student-ai-launcher" aria-label="Open AI Tutor"><span><Bot aria-hidden="true" /></span><strong>AI Tutor</strong></Link> : null}

      <CreatePostModal
        trigger={false}
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onPostCreated={(post) => window.dispatchEvent(new CustomEvent("student:post-created", { detail: post }))}
      />
    </div>
  )
}
