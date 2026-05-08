"use client"

import Link from "next/link"
import { ArrowRight, Sparkle } from "lucide-react"
import { motion } from "framer-motion"

import { DockExpandablePanel } from "@/components/navigation/dock-panel"
import type { DockQuickAction } from "@/lib/navigation"

const toneClasses: Record<NonNullable<DockQuickAction["tone"]>, string> = {
  violet: "from-[#7C5CFF]/28 to-[#7C5CFF]/5 group-hover:text-[#A996FF]",
  mint: "from-[#7FFFD4]/22 to-[#7FFFD4]/5 group-hover:text-[#7FFFD4]",
  amber: "from-amber-300/22 to-amber-300/5 group-hover:text-amber-200",
  rose: "from-rose-300/22 to-rose-300/5 group-hover:text-rose-200",
}

export function DockQuickActionsPanel({ actions, onClose }: { actions: DockQuickAction[]; onClose: () => void }) {
  return (
    <DockExpandablePanel title="Quick Actions" onClose={onClose} className="md:w-[390px]">
      <div className="pointer-events-none absolute inset-x-10 top-12 h-20 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_70%)] blur-2xl" />
      <div className="relative mt-4 grid gap-2 rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-2">
        <div className="mb-1 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Launch pad</span>
          <Sparkle className="h-3.5 w-3.5 text-[#7FFFD4]" aria-hidden="true" />
        </div>
        {actions.map((action, index) => {
          const Icon = action.icon
          const tone = toneClasses[action.tone || "violet"]

          return (
            <motion.div
              key={`${action.label}-${action.href}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={action.href}
                onClick={onClose}
                className="group relative flex min-h-[64px] items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#7C5CFF]/30 hover:bg-white/[0.08] hover:shadow-[0_18px_44px_rgba(124,92,255,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(124,92,255,0.18),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${tone} text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] transition-all duration-300 group-hover:scale-105`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-white">{action.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-[#B7B7C0]">{action.description}</span>
                </span>
                <ArrowRight className="relative h-4 w-4 shrink-0 text-white/35 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#7C5CFF]" aria-hidden="true" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
