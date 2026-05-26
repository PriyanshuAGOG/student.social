"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, Compass, Home, MessageCircle, Moon, Sun, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { ProfilePopover } from "@/components/ProfilePopover"
import styles from "./FloatingNav.module.css"

type FloatingNavProps = {
  user: { name: string; avatarUrl?: string; initials: string }
  notificationCount: number
  currentPath: string
  theme: "light" | "dark"
  onThemeToggle: () => void
}

const navItems = [
  { label: "Home", href: "/home", icon: Home, aliases: ["/app/feed", "/app"] },
  { label: "Explore", href: "/explore", icon: Compass, aliases: ["/app/ai"] },
  { label: "Peers", href: "/peers", icon: Users, aliases: ["/app/pods"] },
  { label: "Messages", href: "/messages", icon: MessageCircle, aliases: ["/app/chat"] },
  { label: "Notifications", href: "/notifications", icon: Bell, aliases: ["/app/notifications"] },
]

export function FloatingNav({ user, notificationCount, currentPath, theme, onThemeToggle }: FloatingNavProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [displayedActive, setDisplayedActive] = useState(0)
  const [bubblePhase, setBubblePhase] = useState<"visible" | "out" | "in">("visible")
  const popoverRef = useRef<HTMLDivElement>(null)

  const activeIndex = useMemo(() => {
    const index = navItems.findIndex((item) => item.href === currentPath || item.aliases.includes(currentPath))
    return index === -1 ? 0 : index
  }, [currentPath])

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth > 1024)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (isDesktop) {
      setDisplayedActive(activeIndex)
      setBubblePhase("visible")
      return
    }
    if (activeIndex === displayedActive) return
    setBubblePhase("out")
  }, [activeIndex, displayedActive, isDesktop])

  useEffect(() => {
    let lastY = window.scrollY
    let lastT = performance.now()
    const onScroll = () => {
      const now = performance.now()
      const y = window.scrollY
      const dy = y - lastY
      const dt = now - lastT
      if (dy > 50 && dt <= 200) setIsScrollingDown(true)
      else if (dy < 0 || dt > 200) setIsScrollingDown(false)
      lastY = y
      lastT = now
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false)
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [])

  return (
    <nav aria-label="Main navigation" className={`${styles.navRoot} ${theme === "dark" ? styles.dark : styles.light} ${isScrollingDown ? styles.scrolled : ""}`}>
      <div className={`${styles.pill} ${isDesktop && desktopExpanded ? styles.expanded : ""}`} onMouseEnter={() => setDesktopExpanded(true)} onMouseLeave={() => setDesktopExpanded(false)}>
        {(isTablet ? ["profile", ...navItems.map((_, i) => i)] : navItems.map((_, i) => i)).map((item) => {
          if (item === "profile") {
            return <div key="divider-top" className={styles.divider} />
          }
          const navItem = navItems[item as number]
          const isActive = activeIndex === item
          return (
            <Link key={navItem.href} href={navItem.href} aria-current={isActive ? "page" : undefined} className={`${styles.item} ${isDesktop && isActive ? styles.desktopActive : ""} ${!isDesktop && displayedActive === item ? styles.mobileActiveSlot : ""}`}>
              <navItem.icon className={styles.icon} />
              <span className={styles.label}>{navItem.label}</span>
              {navItem.label === "Notifications" && notificationCount > 0 && <span className={styles.badge} />}
              {isDesktop && isActive && <span className={styles.activeDot} />}
            </Link>
          )
        })}

        <div className={styles.bottomStack} ref={popoverRef}>
          <div className={styles.divider} />
          <button type="button" className={styles.profileButton} aria-haspopup="true" aria-expanded={profileOpen} onClick={() => setProfileOpen((v) => !v)}>
            {user.avatarUrl ? <Image src={user.avatarUrl} alt={user.name} width={34} height={34} className={styles.avatar} /> : <span className={styles.initials}>{user.initials}</span>}
            {isDesktop && desktopExpanded && <span className={styles.profileLabel}>My Profile</span>}
          </button>
          <ProfilePopover open={profileOpen} desktop={isDesktop} onClose={() => setProfileOpen(false)} />
          {isDesktop && (
            <button type="button" className={styles.themeToggle} onClick={onThemeToggle}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
          )}
        </div>
      </div>

      {!isDesktop && (
        <div
          className={`${styles.activeBubble} ${bubblePhase === "out" ? styles.bubbleOut : ""} ${bubblePhase === "in" ? styles.bubbleIn : ""}`}
          onAnimationEnd={() => {
            if (bubblePhase === "out") {
              setDisplayedActive(activeIndex)
              setBubblePhase("in")
            } else {
              setBubblePhase("visible")
            }
          }}
        >
          {(() => {
            const ItemIcon = navItems[displayedActive].icon
            return <ItemIcon className={styles.bubbleIcon} />
          })()}
          <span className={styles.bubbleLabel}>{navItems[displayedActive].label}</span>
        </div>
      )}
    </nav>
  )
}

export function FloatingNavWithTheme(props: Omit<FloatingNavProps, "theme" | "onThemeToggle">) {
  const { resolvedTheme, setTheme } = useTheme()
  const current = resolvedTheme === "dark" ? "dark" : "light"
  return <FloatingNav {...props} theme={current} onThemeToggle={() => setTheme(current === "dark" ? "light" : "dark")} />
}
