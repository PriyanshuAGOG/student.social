import type React from "react"
import "./internal-app.css"

export function StandaloneAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="student-app-shell min-h-dvh">
      <main className="student-app-main min-h-dvh">
        <div className="student-app-route">{children}</div>
      </main>
    </div>
  )
}
