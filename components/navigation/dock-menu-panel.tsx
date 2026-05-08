"use client"

import Link from "next/link"
import { motion } from "framer-motion"

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
    <DockExpandablePanel title="Menu" onClose={onClose}>
      <div className="mt-4 rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-2">
        {items.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const className = cn(
            "group flex h-[42px] items-center gap-2.5 rounded-xl border border-transparent px-3 text-[13px] font-medium text-white/70 transition-all duration-180 hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            active && "border-[#7C5CFF]/25 bg-[#7C5CFF]/15 text-white",
          )

          const content = (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-full items-center gap-2.5"
            >
              <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-[#7C5CFF]" strokeWidth={1.8} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </motion.span>
          )

          if (item.action === "logout") {
            return (
              <button key={item.label} type="button" onClick={onLogout} className={cn(className, "w-full")}>
                {content}
              </button>
            )
          }

          return (
            <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} onClick={onClose} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </DockExpandablePanel>
  )
}
