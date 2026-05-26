"use client"

import Link from "next/link"
import { Compass, Home, MessageCircle, Sparkles, UserRound } from "lucide-react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import styles from "./FloatingNav.module.css"

const navItems = [
  { key: "home", label: "Home", href: "/app/feed", icon: Home, match: ["/app", "/app/feed"] },
  { key: "explore", label: "Explore", href: "/app/ai", icon: Compass, match: ["/app/ai"] },
  { key: "spark", label: "Spark", href: "/app/pods", icon: Sparkles, match: ["/app/pods", "/app/calendar", "/app/vault"] },
  { key: "messages", label: "Messages", href: "/app/chat", icon: MessageCircle, match: ["/app/chat", "/app/messages"] },
  { key: "profile", label: "Profile", href: "/app/profile", icon: UserRound, match: ["/app/profile", "/app/settings", "/app/leaderboard"] },
]

function isActive(pathname: string, item: (typeof navItems)[number]) {
  return item.match.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export function FloatingNav() {
  const pathname = usePathname()

  const activeKey = useMemo(() => {
    const found = navItems.find((item) => isActive(pathname, item))
    return found?.key ?? "home"
  }, [pathname])

  return (
    <>
      <nav className={styles.desktopDock} aria-label="Main navigation">
        <ul className={styles.desktopList}>
          {navItems.map((item) => {
            const active = activeKey === item.key
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`${styles.desktopItem} ${active ? styles.desktopItemActive : ""}`}
                >
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
        <ul className={styles.mobileList}>
          {navItems.map((item) => {
            const active = activeKey === item.key
            return (
              <li key={item.key} className={styles.mobileLi}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`${styles.mobileItem} ${active ? styles.mobileItemActive : ""}`}
                >
                  <span className={styles.mobileBubble} aria-hidden="true"><item.icon className={styles.icon} /></span>
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
