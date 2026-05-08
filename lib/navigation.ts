import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Bot,
  BookOpen,
  CalendarDays,
  Compass,
  Home,
  LogOut,
  MessageSquareText,
  Plus,
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
  description?: string
}

export type DockQuickAction = {
  label: string
  description: string
  href: string
  icon: LucideIcon
  tone?: "violet" | "mint" | "amber" | "rose"
}

export const primaryDockItems: DockNavItem[] = [
  {
    label: "Feed",
    href: "/app/feed",
    icon: Home,
    mobilePrimary: true,
  },
  {
    label: "Study Pods",
    href: "/app/pods",
    icon: UsersRound,
    mobilePrimary: true,
  },
  {
    label: "Resource Vault",
    href: "/app/vault",
    icon: BookOpen,
    mobilePrimary: true,
  },
  {
    label: "Chat",
    href: "/app/chat",
    icon: MessageSquareText,
    mobilePrimary: true,
  },
]

export const secondaryMenuItems: DockMenuItem[] = [
  {
    label: "Profile",
    href: "/app/profile",
    icon: UserRound,
    description: "Identity, badges, and learning presence",
  },
  {
    label: "Leaderboard",
    href: "/app/leaderboard",
    icon: Trophy,
    description: "Rankings, streaks, and pod momentum",
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: Settings,
    description: "Preferences, privacy, and account controls",
  },
  {
    label: "Sign out",
    href: "/login",
    icon: LogOut,
    action: "logout",
    description: "Securely leave this PeerSpark session",
  },
]

export const quickActions: DockQuickAction[] = [
  {
    label: "Create Study Plan",
    description: "Ask AI to shape your next learning sprint.",
    href: "/app/ai",
    icon: Sparkles,
    tone: "violet",
  },
  {
    label: "Join Study Pod",
    description: "Use an invite or find your next group.",
    href: "/app/pods/join",
    icon: UsersRound,
    tone: "mint",
  },
  {
    label: "Start Focus Session",
    description: "Block time for deep work on your calendar.",
    href: "/app/calendar?mode=create",
    icon: Zap,
    tone: "amber",
  },
  {
    label: "Ask AI",
    description: "Open the study assistant without adding it to the dock.",
    href: "/app/ai",
    icon: Bot,
    tone: "violet",
  },
  {
    label: "Upload Resource",
    description: "Save notes, links, and files to your vault.",
    href: "/app/vault",
    icon: UploadCloud,
    tone: "rose",
  },
  {
    label: "Discover Pods",
    description: "Browse all communities from the unified pods page.",
    href: "/app/pods",
    icon: Compass,
    tone: "mint",
  },
  {
    label: "Schedule Session",
    description: "Coordinate the next study meetup.",
    href: "/app/calendar?mode=schedule",
    icon: CalendarDays,
    tone: "amber",
  },
]

export const utilityDockItems = {
  quick: {
    label: "Quick Actions",
    icon: Plus,
  },
  calendar: {
    label: "Calendar",
    href: "/app/calendar",
    icon: CalendarDays,
  },
  notifications: {
    label: "Unread notifications",
    href: "/app/notifications",
    icon: Bell,
  },
}
