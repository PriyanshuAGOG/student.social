"use client"

import Link from "next/link"
import { ArrowRight, Sparkle } from "lucide-react"
import { motion } from "framer-motion"

import { DockExpandablePanel } from "@/components/navigation/dock-panel"
import type { DockQuickAction } from "@/lib/navigation"

const toneClasses: Record<NonNullable<DockQuickAction["tone"]>, string> = {
  violet: "from-[#7C4DFF]/18 to-[#F6F1FF] text-[#7C4DFF]",
  mint: "from-[#22C55E]/14 to-[#F0FDF4] text-[#16A34A]",
  amber: "from-[#F59E0B]/16 to-[#FFFBEB] text-[#D97706]",
  rose: "from-[#EF4444]/12 to-[#FFF1F2] text-[#E11D48]",
}

export function DockQuickActionsPanel({ actions, onClose }: { actions: DockQuickAction[]; onClose: () => void }) {
  return (
    <DockExpandablePanel title="Quick Actions" onClose={onClose} className="md:w-[390px]">
      <div className="pointer-events-none absolute inset-x-10 top-12 h-20 rounded-full bg-[radial-gradient(circle,rgba(124,77,255,0.12),transparent_70%)] blur-2xl" />
      <div className="relative mt-4 grid gap-2 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD]/85 p-2">
        <div className="mb-1 flex items-center justify-between rounded-[18px] border border-black/[0.05] bg-[#F7F7FA] px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#A1A1AA]">AI launch pad</span>
          <Sparkle className="h-3.5 w-3.5 text-[#7C4DFF]" aria-hidden="true" />
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
                className="group relative flex min-h-[64px] items-center gap-3 overflow-hidden rounded-[20px] border border-black/[0.05] bg-white px-3 py-2.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#7C4DFF]/18 hover:bg-[#F6F1FF] hover:shadow-[0_18px_44px_rgba(124,77,255,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(124,77,255,0.10),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-black/[0.05] bg-gradient-to-br ${tone} shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300 group-hover:scale-105`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-[#111111]">{action.label}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-[#6E6E73]">{action.description}</span>
                </span>
                <ArrowRight className="relative h-4 w-4 shrink-0 text-[#A1A1AA] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#7C4DFF]" aria-hidden="true" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
