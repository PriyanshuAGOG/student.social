"use client"

import { cn } from "@/lib/utils"

type DockTooltipProps = {
  label: string
  visible: boolean
}

export function DockTooltip({ label, visible }: DockTooltipProps) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[10px] border border-white/10 bg-[#121216]/95 px-2.5 py-[7px] text-xs font-medium text-white opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-1.5 scale-[0.96] opacity-0",
      )}
    >
      {label}
      <span className="absolute left-1/2 top-[calc(100%-3px)] h-[7px] w-[7px] -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-[#121216]/95" />
    </span>
  )
}
