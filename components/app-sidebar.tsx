"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  Flame,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BrandLogo } from "@/components/brand-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isAdminUser } from "@/lib/admin-access"

const navigation = [
  {
    label: "Your day",
    items: [
      { title: "Learning feed", url: "/app/feed", icon: Home },
      { title: "Study pods", url: "/app/pods", icon: Users },
      { title: "AI tutor", url: "/app/ai", icon: Bot, accent: true },
    ],
  },
  {
    label: "Together",
    items: [
      { title: "Messages", url: "/app/chat", icon: MessageSquare },
      { title: "Resource vault", url: "/app/vault", icon: BookOpen },
      { title: "Calendar", url: "/app/calendar", icon: Calendar },
    ],
  },
  {
    label: "Progress",
    items: [
      { title: "Leaderboard", url: "/app/leaderboard", icon: Trophy },
      { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
      { title: "Notifications", url: "/app/notifications", icon: Bell },
      { title: "Settings", url: "/app/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile, logout } = useAuth()
  const canAccessAdmin = isAdminUser(user)

  const handleLogout = async () => {
    try {
      await logout()
      toast({ title: "See you soon", description: "You have been logged out safely." })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast({ title: "Could not log out", description: "Please try again in a moment.", variant: "destructive" })
    }
  }

  const isRouteActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`) || (url === "/app/feed" && pathname === "/app")

  const displayName = profile?.name || user?.name || "Student"
  const userInitials = displayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="student-sidebar-header p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="student-brand-button h-14 rounded-2xl px-2">
              <Link href="/app/feed" aria-label="Student.social learning feed">
                <span className="student-brand-mark-wrap" style={{ border: 0, background: "transparent" }}><BrandLogo variant="icon" tone="inverse" decorative className="h-10 w-10 object-contain" /></span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[15px] font-semibold tracking-[-0.02em]">Student.social</span>
                  <span className="truncate text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/42">Learn together</span>
                </span>
                <span className="student-beta">BETA</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {navigation.map((section) => (
          <SidebarGroup key={section.label} className="px-2 py-1.5">
            <SidebarGroupLabel className="px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const active = isRouteActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="student-sidebar-link h-10 rounded-xl px-3">
                        <Link href={item.url} aria-current={active ? "page" : undefined}>
                          <span className={item.accent ? "student-nav-icon student-nav-icon-ai" : "student-nav-icon"}><item.icon /></span>
                          <span>{item.title}</span>
                          {item.accent ? <Sparkles className="ml-auto size-3 text-[#d99a80]" aria-hidden="true" /> : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
                {section.label === "Progress" && canAccessAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isRouteActive("/app/admin")} tooltip="Admin" className="student-sidebar-link h-10 rounded-xl px-3">
                      <Link href="/app/admin"><span className="student-nav-icon"><BarChart3 /></span><span>Admin</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <Link href="/app/ai" className="student-focus-card group-data-[collapsible=icon]:hidden">
          <span><Flame className="size-4" /> Focus companion</span>
          <strong>Turn “stuck” into a next step.</strong>
          <small>Ask the tutor →</small>
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="student-account-button h-14 rounded-2xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" aria-label="Open account menu">
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarImage src={profile?.avatar || "/placeholder.svg"} alt={displayName} />
                    <AvatarFallback className="rounded-xl bg-[#78815f] text-[#fffaf2]">{userInitials || "S"}</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-[11px] text-sidebar-foreground/45">{user?.email || "Your learning space"}</span>
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-60" side="right" align="end" sideOffset={10}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <Avatar className="h-9 w-9 rounded-xl"><AvatarImage src={profile?.avatar || "/placeholder.svg"} alt={displayName} /><AvatarFallback className="rounded-xl">{userInitials || "S"}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold">{displayName}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/app/profile")}><User />Profile</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/settings"><Settings />Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/app/notifications"><Bell />Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
