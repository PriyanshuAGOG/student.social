"use client"

import Link from "next/link"
import { ChevronRight, Medal, Settings, SlidersHorizontal, UserCircle2 } from "lucide-react"
import styles from "./FloatingNav.module.css"

type ProfilePopoverProps = {
  open: boolean
  desktop: boolean
  onClose: () => void
}

const profileItems = [
  { label: "Account settings", href: "/app/settings", icon: Settings },
  { label: "Public Profile", href: "/app/profile", icon: UserCircle2 },
  { label: "App Settings", href: "/app/settings/calendar-sync", icon: SlidersHorizontal },
  { label: "Leaderboard", href: "/app/leaderboard", icon: Medal },
]

export function ProfilePopover({ open, desktop, onClose }: ProfilePopoverProps) {
  return (
    <div
      role="menu"
      aria-hidden={!open}
      className={`${styles.profilePopover} ${open ? styles.profilePopoverOpen : ""} ${desktop ? styles.desktopPopover : styles.mobilePopover}`}
    >
      {profileItems.map((item) => (
        <Link key={item.href + item.label} href={item.href} role="menuitem" className={styles.profileMenuItem} onClick={onClose}>
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      ))}
    </div>
  )
}
