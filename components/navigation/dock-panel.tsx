"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const panelTransition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
}

export function DockExpandablePanel({
  title,
  children,
  onClose,
  className,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  return (
    <motion.section
      role="dialog"
      aria-modal="false"
      aria-label={title}
      initial={{ opacity: 0, y: 18, scale: 0.94, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(6px)" }}
      transition={panelTransition}
      className={cn(
        "fixed bottom-[92px] left-3 right-3 z-[90] max-h-[min(70vh,520px)] origin-bottom overflow-y-auto rounded-[28px] border border-white/10 bg-[#121216]/90 p-[18px] text-white shadow-[0_30px_90px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl md:bottom-[104px] md:left-1/2 md:right-auto md:w-[360px] md:max-w-[calc(100vw-32px)] md:-translate-x-1/2",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative flex h-8 items-center justify-center">
        <h2 className="text-[15px] font-bold tracking-[-0.01em] text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {children}
    </motion.section>
  )
}
