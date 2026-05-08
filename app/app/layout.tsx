import type React from "react"
import { FloatingDockNav } from "@/components/navigation/floating-dock-nav"
import { Toaster } from "@/components/ui/toaster"
import { ProtectRoute } from "@/lib/protect-route"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectRoute>
      <div className="min-h-dvh w-full overflow-x-hidden bg-[#0B0B0C] text-foreground">
        <main className="min-h-screen min-w-0 overflow-x-hidden pb-[100px] md:pb-[120px]">{children}</main>
        <FloatingDockNav />
      </div>
      <Toaster />
    </ProtectRoute>
  )
}
