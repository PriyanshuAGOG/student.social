import type React from "react"
import { AppFloatingNav } from "@/components/app-floating-nav"
import { Toaster } from "@/components/ui/toaster"
import { ProtectRoute } from "@/lib/protect-route"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectRoute>
      <div className="app-shell min-h-dvh w-full overflow-x-hidden bg-background">
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        <AppFloatingNav />
      </div>
      <Toaster />
    </ProtectRoute>
  )
}
