"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { PublicNav } from "./ui"

export function AuthShell({ children, note = "Secure account access for your study circles, shared resources, and learning momentum." }: { children: ReactNode; note?: string }) {
  return (
    <main className="ss-public auth-page">
      <PublicNav />
      <div className="auth-grid container">
        <section className="auth-story">
          <span className="eyebrow light">A MORE HUMAN STUDY SPACE</span>
          <h2>One account.<br /><em>Your people, notes,<br />and momentum.</em></h2>
          <div className="auth-glance">
            <div><span className="pulse" /><b>Calculus circle</b><small>Session starts in 20 minutes</small></div>
            <div><span>✦</span><b>AI tutor</b><small>A useful hint is one question away</small></div>
            <div><span>▤</span><b>Resource vault</b><small>Everything your circle shared</small></div>
          </div>
          <small>{note}</small>
        </section>
        <section className="auth-card">
          <Link href="/" className="auth-back">← Back home</Link>
          <span className="eyebrow">STUDENT.SOCIAL</span>
          {children}
          <div className="preview-form-note">Your existing secure account flow remains connected.</div>
        </section>
      </div>
    </main>
  )
}

