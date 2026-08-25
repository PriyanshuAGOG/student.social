import type React from "react"
import { StandaloneAppShell } from "@/components/internal/StandaloneAppShell"

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <StandaloneAppShell>{children}</StandaloneAppShell>
}
