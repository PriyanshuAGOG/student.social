"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

import { DockExpandablePanel } from "@/components/navigation/dock-panel"
import type { DockQuickAction } from "@/lib/navigation"

export function DockQuickActionsPanel({ actions, onClose }: { actions: DockQuickAction[]; onClose: () => void }) {
  return (
    <DockExpandablePanel title="Quick Actions" onClose={onClose}>
      <div className="mt-4 space-y-2 rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-2">
        {actions.map((action, index) => {
          const Icon = action.icon

          return (
            <motion.div
              key={`${action.label}-${action.href}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={action.href}
                onClick={onClose}
                className="group flex min-h-[58px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-2.5 text-left transition-all duration-180 hover:-translate-y-0.5 hover:border-[#7C5CFF]/30 hover:bg-white/[0.07] hover:shadow-[0_12px_30px_rgba(124,92,255,0.16)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#7C5CFF]/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-white">{action.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-[#B7B7C0]">{action.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-[#7C5CFF]" aria-hidden="true" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
