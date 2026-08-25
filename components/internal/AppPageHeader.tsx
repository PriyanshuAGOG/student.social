import type React from "react"

interface AppPageHeaderProps {
  title: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}

export function AppPageHeader({ title, meta, actions }: AppPageHeaderProps) {
  return (
    <header className="student-page-header">
      <div className="student-page-header-copy">
        <h1>{title}</h1>
        {meta ? <div className="student-page-header-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="student-page-header-actions">{actions}</div> : null}
    </header>
  )
}
