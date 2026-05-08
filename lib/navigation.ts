import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  CalendarDays,
  CircleHelp,
  Compass,
  Home,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trophy,
  UploadCloud,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react"

export type DockNavItem = {
  label: string
  href: string
  icon: LucideIcon
  mobilePrimary?: boolean
}

export type DockMenuItem = DockNavItem & {
  action?: "logout"
}

export type DockQuickAction = {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

export const primaryDockItems: DockNavItem[] = [
  {
    label: "Feed",
    href: "/app/feed",
    icon: Home,
    mobilePrimary: true,
  },
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: BarChart3,
  },
  {
    label: "My Pods",
    href: "/app/pods",
    icon: UsersRound,
    mobilePrimary: true,
  },
  {
    label: "Explore Pods",
    href: "/app/explore",
    icon: Search,
  },
  {
    label: "AI Assistant",
    href: "/app/ai",
    icon: Bot,
    mobilePrimary: true,
  },
  {
    label: "Chat",
    href: "/app/chat",
    icon: MessageSquareText,
    mobilePrimary: true,
  },
  {
    label: "Leaderboard",
    href: "/app/leaderboard",
    icon: Trophy,
  },
]

export const secondaryMenuItems: DockMenuItem[] = [
  {
    label: "Resource Vault",
    href: "/app/vault",
    icon: BookOpen,
  },
  {
    label: "Calendar",
    href: "/app/calendar",
    icon: CalendarDays,
  },
  {
    label: "Analytics",
    href: "/app/analytics",
    icon: BarChart3,
  },
  {
    label: "Saved",
    href: "/app/saved",
    icon: Compass,
  },
  {
    label: "Notifications",
    href: "/app/notifications",
    icon: Bell,
  },
  {
    label: "Profile",
    href: "/app/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
  {
    label: "Help",
    href: "/help",
    icon: CircleHelp,
  },
  {
    label: "Log out",
    href: "/login",
    icon: LogOut,
    action: "logout",
  },
]

export const quickActions: DockQuickAction[] = [
  {
    label: "Create Study Plan",
    description: "Ask AI to shape your next learning sprint.",
    href: "/app/ai",
    icon: Sparkles,
  },
  {
    label: "Join Study Pod",
    description: "Use an invite or find your next group.",
    href: "/app/pods/join",
    icon: UsersRound,
  },
  {
    label: "Start Focus Session",
    description: "Block time for deep work on your calendar.",
    href: "/app/calendar?mode=create",
    icon: Zap,
  },
  {
    label: "Ask AI",
    description: "Get unstuck with a tutor-style assistant.",
    href: "/app/ai",
    icon: Bot,
  },
  {
    label: "Upload Resource",
    description: "Save notes, links, and files to your vault.",
    href: "/app/vault",
    icon: UploadCloud,
  },
  {
    label: "Explore Pods",
    description: "Discover active communities and classmates.",
    href: "/app/explore",
    icon: Compass,
  },
  {
    label: "Schedule Session",
    description: "Coordinate the next study meetup.",
    href: "/app/calendar?mode=schedule",
    icon: CalendarDays,
  },
]

export const utilityDockItems = {
  quick: {
    label: "Quick Actions",
    icon: Plus,
  },
  notifications: {
    label: "Notifications",
    href: "/app/notifications",
    icon: Bell,
  },
  profile: {
    label: "Profile",
    href: "/app/profile",
    icon: UserRound,
  },
}
