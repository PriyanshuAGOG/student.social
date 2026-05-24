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
    <DockExpandablePanel title="PeerSpark Menu" onClose={onClose} className="md:w-[380px]">
      <div className="pointer-events-none absolute -left-12 top-10 h-28 w-28 rounded-full bg-[#7C4DFF]/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-[#B8F7E6]/40 blur-3xl" />

      <div className="relative mt-4 overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#FCFCFD]/85 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#7C4DFF]/25 to-transparent" />
        <div className="mb-2 flex items-center gap-2 rounded-[18px] border border-black/[0.05] bg-[#F7F7FA] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#A1A1AA]">
          <Orbit className="h-3.5 w-3.5 text-[#7C4DFF]" aria-hidden="true" />
          Social OS controls
        </div>

        {items.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const className = cn(
            "group relative flex min-h-[62px] items-center gap-3 overflow-hidden rounded-[20px] border border-transparent px-3.5 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-black/[0.06] hover:bg-[#F6F1FF] hover:shadow-[0_16px_38px_rgba(124,77,255,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            active && "border-[#7C4DFF]/20 bg-[#EFE8FF] text-[#111111] shadow-[0_12px_34px_rgba(124,77,255,0.10)]",
          )

          const content = (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.045, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex w-full items-center gap-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-black/[0.06] bg-white text-[#46506B] shadow-[0_10px_24px_rgba(0,0,0,0.04)] transition-all duration-300 group-hover:border-[#7C4DFF]/20 group-hover:bg-[#EFE8FF] group-hover:text-[#7C4DFF]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-[#111111]">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-[#6E6E73]">{item.description}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#A1A1AA] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#7C4DFF]" aria-hidden="true" />
            </motion.span>
          )

          if (item.action === "logout") {
            return (
              <button key={item.label} type="button" onClick={onLogout} className={cn(className, "w-full")}>
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.08),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {content}
              </button>
            )
          }

          return (
            <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} onClick={onClose} className={className}>
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,77,255,0.11),transparent_46%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {content}
            </Link>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
