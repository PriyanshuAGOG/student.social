"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { DockButton } from "@/components/navigation/dock-button"
import { DockMenuPanel } from "@/components/navigation/dock-menu-panel"
import { DockQuickActionsPanel } from "@/components/navigation/dock-quick-actions-panel"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { primaryDockItems, quickActions, secondaryMenuItems, utilityDockItems } from "@/lib/navigation"

type DockPanel = null | "menu" | "quick"

const dockEase = [0.16, 1, 0.3, 1] as const

function isActiveRoute(pathname: string, href: string) {
  if (href === "/app/feed") {
    return pathname === "/app" || pathname === href || pathname.startsWith(`${href}/`)
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function FloatingDockNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { logout } = useAuth()
  const [openPanel, setOpenPanel] = useState<DockPanel>(null)
  const navRef = useRef<HTMLElement>(null)
  const panelRegionRef = useRef<HTMLDivElement>(null)

  const closePanel = () => setOpenPanel(null)
  const togglePanel = (panel: Exclude<DockPanel, null>) => setOpenPanel((current) => (current === panel ? null : panel))

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      if (navRef.current?.contains(target) || panelRegionRef.current?.contains(target)) {
        return
      }

      setOpenPanel(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleLogout = async () => {
    setOpenPanel(null)
    try {
      await logout()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      })
      router.push("/login")
    } catch {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div ref={panelRegionRef}>
        <AnimatePresence mode="wait">
          {openPanel ? (
            <motion.div
              key="dock-connector-glow"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none fixed bottom-[72px] left-1/2 z-[85] h-20 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,77,255,0.16),transparent_68%)] blur-xl md:bottom-[84px]"
            />
          ) : null}
          {openPanel === "menu" ? (
            <DockMenuPanel key="menu-panel" items={secondaryMenuItems} pathname={pathname} onClose={closePanel} onLogout={handleLogout} />
          ) : null}
          {openPanel === "quick" ? <DockQuickActionsPanel key="quick-panel" actions={quickActions} onClose={closePanel} /> : null}
        </AnimatePresence>
      </div>

      <motion.nav
        ref={navRef}
        aria-label="PeerSpark navigation dock"
        initial={{ opacity: 0, y: 22, scale: 0.96, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: dockEase }}
        className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-[80] w-[calc(100vw-24px)] -translate-x-1/2 md:bottom-7 md:w-auto"
      >
        <div className="pointer-events-none absolute inset-x-6 -inset-y-4 rounded-full bg-[radial-gradient(circle_at_center,#7C4DFF_0%,transparent_65%)] opacity-20 blur-2xl" />
        <div className="relative flex h-16 items-center justify-start gap-1 overflow-x-auto rounded-full border border-black/[0.06] bg-white/82 px-3 shadow-[0_18px_60px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl scrollbar-none md:h-[62px] md:justify-center md:gap-1.5 md:overflow-visible">
          <div className="pointer-events-none absolute left-[18px] right-[18px] top-px h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          {primaryDockItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.03, duration: 0.22, ease: dockEase }}
              className={cn(!item.mobilePrimary && "max-md:hidden")}
            >
              <DockButton
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActiveRoute(pathname, item.href)}
                onNavigate={closePanel}
              />
            </motion.div>
          ))}

          <div className="mx-1 h-6 w-px shrink-0 bg-black/[0.06]" aria-hidden="true" />

          <DockButton
            label={utilityDockItems.quick.label}
            icon={utilityDockItems.quick.icon}
            onClick={() => togglePanel("quick")}
            panelActive={openPanel === "quick"}
            className="max-md:hidden"
          />
          <DockButton label="Menu" icon={Menu} onClick={() => togglePanel("menu")} panelActive={openPanel === "menu"} />
        </div>
      </motion.nav>
    </>
  )
}
