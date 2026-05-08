"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Orbit } from "lucide-react"

import { DockExpandablePanel } from "@/components/navigation/dock-panel"
import { cn } from "@/lib/utils"
import type { DockMenuItem } from "@/lib/navigation"

export function DockMenuPanel({
  items,
  pathname,
  onClose,
  onLogout,
}: {
  items: DockMenuItem[]
  pathname: string
  onClose: () => void
  onLogout: () => void
}) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <DockExpandablePanel title="Command Menu" onClose={onClose} className="md:w-[380px]">
      <div className="pointer-events-none absolute -left-12 top-10 h-28 w-28 rounded-full bg-[#7C5CFF]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-[#7FFFD4]/10 blur-3xl" />

      <div className="relative mt-4 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.026))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#7C5CFF]/60 to-transparent" />
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          <Orbit className="h-3.5 w-3.5 text-[#7C5CFF]" aria-hidden="true" />
          Account controls
        </div>

        {items.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const className = cn(
            "group relative flex min-h-[62px] items-center gap-3 overflow-hidden rounded-2xl border border-transparent px-3.5 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.075] hover:shadow-[0_16px_38px_rgba(124,92,255,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            active && "border-[#7C5CFF]/30 bg-[#7C5CFF]/18 text-white shadow-[0_12px_34px_rgba(124,92,255,0.15)]",
          )

          const content = (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.045, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex w-full items-center gap-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 group-hover:border-[#7C5CFF]/35 group-hover:bg-[#7C5CFF]/18 group-hover:text-[#7FFFD4] group-hover:shadow-[0_0_26px_rgba(124,92,255,0.22)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs text-[#B7B7C0]">{item.description}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#7C5CFF]" aria-hidden="true" />
            </motion.span>
          )

          if (item.action === "logout") {
            return (
              <button key={item.label} type="button" onClick={onLogout} className={cn(className, "w-full")}>
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,120,120,0.12),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {content}
              </button>
            )
          }

          return (
            <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} onClick={onClose} className={className}>
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,92,255,0.16),transparent_46%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {content}
            </Link>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
