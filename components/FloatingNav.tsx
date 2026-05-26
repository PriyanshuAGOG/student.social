"use client"

import type React from "react"
import Link from "next/link"
import { Bot, BookOpen, Calendar, Compass, Home, MessageCircle, Sparkles, UserRound, Users } from "lucide-react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import styles from "./FloatingNav.module.css"

const desktopItems = [
  { key: "home", label: "Home", href: "/app/feed", icon: Home, match: ["/app", "/app/feed"] },
  { key: "pods", label: "Pods", href: "/app/pods", icon: Users, match: ["/app/pods"] },
  { key: "ai", label: "AI Chat", href: "/app/ai", icon: Bot, match: ["/app/ai"] },
  { key: "chat", label: "Chat", href: "/app/chat", icon: MessageCircle, match: ["/app/chat", "/app/messages"] },
  { key: "calendar", label: "Calendar", href: "/app/calendar", icon: Calendar, match: ["/app/calendar"] },
  { key: "resources", label: "Resources", href: "/app/vault", icon: BookOpen, match: ["/app/vault"] },
  { key: "profile", label: "Profile", href: "/app/profile", icon: UserRound, match: ["/app/profile", "/app/settings", "/app/leaderboard"] },
]

const mobileItems = [
  { key: "home", label: "Home", href: "/app/feed", icon: Home, match: ["/app", "/app/feed"] },
  { key: "explore", label: "Explore", href: "/app/ai", icon: Compass, match: ["/app/ai"] },
  { key: "spark", label: "Spark", href: "/app/pods", icon: Sparkles, match: ["/app/pods", "/app/vault"] },
  { key: "chat", label: "Chat", href: "/app/chat", icon: MessageCircle, match: ["/app/chat", "/app/messages"] },
  { key: "profile", label: "Profile", href: "/app/profile", icon: UserRound, match: ["/app/profile", "/app/settings", "/app/leaderboard"] },
]

const matchActive = (pathname: string, routes: string[]) => routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

export function FloatingNav() {
  const pathname = usePathname()
  const desktopActive = useMemo(() => desktopItems.find((item) => matchActive(pathname, item.match))?.key ?? "home", [pathname])
  const mobileActiveIndex = useMemo(() => {
    const idx = mobileItems.findIndex((item) => matchActive(pathname, item.match))
    return idx < 0 ? 0 : idx
  }, [pathname])
  const ActiveMobileIcon = mobileItems[mobileActiveIndex].icon

  return (
    <>
      <nav className={styles.desktopDock} aria-label="Main navigation">
        <ul className={styles.desktopList}>
          {desktopItems.map((item) => {
            const active = desktopActive === item.key
            return (
              <li key={item.key}>
                <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={`${styles.desktopItem} ${active ? styles.desktopItemActive : ""}`}>
                  <span className={styles.desktopIconWrap}><item.icon className={styles.icon} /></span>
                  <span className={styles.desktopLabel}>{item.label}</span>
                  {active && <span className={styles.desktopRail} aria-hidden="true" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav className={styles.mobileDock} aria-label="Main navigation">
        <ul className={styles.mobileList} style={{ ["--active-index" as string]: mobileActiveIndex } as React.CSSProperties}>
          <li className={styles.activeBubbleTrack} aria-hidden="true">
            <span className={styles.activeBubbleDetached}><ActiveMobileIcon className={styles.icon} /></span>
          </li>
          {mobileItems.map((item, idx) => {
            const active = mobileActiveIndex === idx
            return (
              <li key={item.key} className={styles.mobileLi}>
                <Link href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={`${styles.mobileItem} ${active ? styles.mobileItemActive : ""}`}>
                  <span className={styles.mobileIcon}><item.icon className={styles.icon} /></span>
                  <span className={styles.mobileLabel}>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
