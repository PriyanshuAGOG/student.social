import type React from "react"

interface AppPageIntroProps {
  eyebrow: string
  title: React.ReactNode
  description: React.ReactNode
  actions?: React.ReactNode
  aside?: React.ReactNode
  accent?: "rust" | "olive" | "plum" | "amber"
  compact?: boolean
}

export function AppPageIntro({ eyebrow, title, description, actions, aside, accent = "rust", compact = false }: AppPageIntroProps) {
  return (
    <section className={`student-page-intro student-page-intro-${accent}${compact ? " is-compact" : ""}`}>
      <div className="student-page-intro-copy">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {actions ? <div className="student-page-intro-actions">{actions}</div> : null}
      </div>
      {aside ? <aside>{aside}</aside> : null}
    </section>
  )
}
