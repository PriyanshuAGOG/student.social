import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Toaster } from "@/components/ui/toaster"
import { ProtectRoute } from "@/lib/protect-route"
import { CallProvider } from "@/components/call/CallProvider"
import { AppWorkspace } from "@/components/internal/AppWorkspace"
import "@/components/internal/internal-app.css"
import "@/components/pods3/pods-v3.css"
import { MessageNotificationProvider } from "@/components/chat/MessageNotificationProvider"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectRoute>
      <CallProvider>
        <MessageNotificationProvider>
          <SidebarProvider className="student-app-shell">
            <a className="student-app-skip" href="#student-app-content">Skip to content</a>
            <div className="flex min-h-dvh w-full overflow-x-hidden">
              {/* Desktop Sidebar */}
              <AppSidebar className="hidden md:flex" />

              {/* Main Content */}
              <main id="student-app-content" className="student-app-main min-w-0 flex-1 overflow-x-hidden pb-safe-nav md:pb-0">
                <AppWorkspace>{children}</AppWorkspace>
              </main>

              {/* Mobile Navigation */}
              <MobileNavigation />
            </div>
            <Toaster />
          </SidebarProvider>
        </MessageNotificationProvider>
      </CallProvider>
    </ProtectRoute>
  )
}
