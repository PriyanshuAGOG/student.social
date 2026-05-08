import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Toaster } from "@/components/ui/toaster"
import { ProtectRoute } from "@/lib/protect-route"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectRoute>
      <SidebarProvider>
        <div className="flex min-h-dvh w-full overflow-x-hidden bg-background">
          {/* Desktop Sidebar */}
          <AppSidebar className="hidden md:flex" />

          {/* Main Content */}
          <main className="min-w-0 flex-1 overflow-x-hidden pb-safe-nav md:pb-0">{children}</main>

          {/* Mobile Navigation */}
          <MobileNavigation />
        </div>
        <Toaster />
      </SidebarProvider>
    </ProtectRoute>
  )
}
