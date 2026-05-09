import type React from "react"
import { FloatingDockNav } from "@/components/navigation/floating-dock-nav"
import { GlobalSearch } from "@/components/navigation/global-search"
import { Toaster } from "@/components/ui/toaster"
import { ProtectRoute } from "@/lib/protect-route"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectRoute>
      <div className="peerspark-app-shell min-h-dvh w-full overflow-x-hidden bg-[#F7F7FA] text-[#111111]">
        <GlobalSearch />
        <main className="relative z-10 min-h-screen min-w-0 overflow-x-hidden px-0 pb-[112px] pt-20 md:pb-[132px] md:pt-24">{children}</main>
        <FloatingDockNav />
      </div>
      <Toaster />
    </ProtectRoute>
  )
}
