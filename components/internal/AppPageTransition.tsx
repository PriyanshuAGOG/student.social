"use client"

import type React from "react"
import { usePathname } from "next/navigation"

export function AppPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="student-app-route">
      {children}
    </div>
  )
}
