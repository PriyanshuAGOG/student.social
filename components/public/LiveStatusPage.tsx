"use client"

import { useCallback, useEffect, useState } from "react"
import { Footer, PublicNav, SectionLabel } from "./ui"
import type { PlatformStatusSnapshot, PlatformStatusValue } from "@/lib/server/platform-status"

function label(status: PlatformStatusValue) {
  if (status === "operational") return "OPERATIONAL"
  if (status === "degraded") return "NEEDS ATTENTION"
  return "NOT ACTIVELY TESTED"
}

export function LiveStatusPage() {
  const [snapshot, setSnapshot] = useState<PlatformStatusSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/status", { cache: "no-store" })
      if (!response.ok) throw new Error("Status checks are temporarily unavailable.")
      setSnapshot(await response.json() as PlatformStatusSnapshot)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status checks are temporarily unavailable.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const overall = snapshot?.overall ?? "unknown"

  return (
    <main className="ss-public">
      <section className="page-hero dark-shell">
        <PublicNav />
        <div className="container page-hero-inner">
          <span className="eyebrow light">LIVE PLATFORM STATUS</span>
          <h1>{loading ? "Checking the" : overall === "operational" ? "Core systems are" : "Current system"} <em>{loading ? "learning stack." : overall === "operational" ? "operational." : "status."}</em></h1>
          <p>{error || snapshot?.summary || "Running live checks against the services Student.social depends on."}</p>
          <div className="honesty-note">
            <span>HONEST MONITORING</span>
            Operational labels appear only after a real provider check succeeds. No decorative uptime percentages or invented incidents.
          </div>
        </div>
      </section>

      <section className="public-section tone-cream">
        <div className="container">
          <SectionLabel number="01" label="Live service checks" />
          <div className="public-heading">
            <h2>Evidence, not decoration.</h2>
            <p>{snapshot ? `Last checked ${new Date(snapshot.checkedAt).toLocaleString()}` : "No completed check yet."}</p>
          </div>
          <div className="mock-status-banner">
            <span>{overall === "operational" ? "ALL CHECKED SERVICES READY" : loading ? "CHECKS IN PROGRESS" : "CURRENT SNAPSHOT"}</span>
            <button type="button" className="status-refresh" onClick={() => void refresh()} disabled={loading}>{loading ? "Checking…" : "Refresh checks ↻"}</button>
          </div>
          <div className="status-grid">
            {snapshot?.services.map((service) => (
              <article key={service.id}>
                <span className={service.status === "degraded" ? "planned" : ""}>{label(service.status)}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div><i /><small>{service.detail}</small></div>
              </article>
            ))}
            {!snapshot && Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="status-skeleton">
                <span>{loading ? "CHECKING" : "UNAVAILABLE"}</span>
                <h3>{loading ? "Testing service…" : "No service data"}</h3>
                <p>{error || "Waiting for a completed provider check."}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section tone-sand">
        <div className="container">
          <SectionLabel number="02" label="Incident history" />
          <div className="public-heading"><h2>No invented percentages.</h2><p>Student.social does not yet have a verified incident-history provider. Current checks above show reachability now; a durable public history will be added when real evidence exists.</p></div>
        </div>
      </section>
      <Footer />
    </main>
  )
}

