import type React from "react"
import { StandaloneAppShell } from "@/components/internal/StandaloneAppShell"

export default function StandaloneSettingsLayout({ children }: { children: React.ReactNode }) {
  return <StandaloneAppShell>{children}</StandaloneAppShell>
}
