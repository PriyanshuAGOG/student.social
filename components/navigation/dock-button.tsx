"use client"

import { useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { DockTooltip } from "@/components/navigation/dock-tooltip"

type DockButtonBaseProps = {
  label: string
  icon: LucideIcon
  active?: boolean
  panelActive?: boolean
  className?: string
  onNavigate?: () => void
}

type DockButtonProps = DockButtonBaseProps &
  (
    | {
        href: string
        onClick?: never
      }
    | {
        href?: never
        onClick: () => void
      }
  )

const focusClasses =
  "outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"

export function DockButton({ label, icon: Icon, active, panelActive, className, onNavigate, ...props }: DockButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isHighlighted = active || panelActive

  const content = (
    <>
      <DockTooltip label={label} visible={showTooltip} />
      <motion.span
        className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:scale-[1.08]"
        whileHover={{ y: -2, scale: 1.08 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </motion.span>
      {active ? (
        <motion.span
          layoutId="dock-active-dot"
          className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#7C4DFF] shadow-[0_0_12px_rgba(124,77,255,0.45)]"
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
        />
      ) : null}
    </>
  )

  const buttonClasses = cn(
    "group relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-transparent text-[#46506B] transition-all duration-180 hover:-translate-y-0.5 hover:bg-[#F6F1FF] hover:text-[#7C4DFF] hover:shadow-[0_10px_24px_rgba(124,77,255,0.12)]",
    isHighlighted && "border-[#7C4DFF]/20 bg-[#EFE8FF] text-[#7C4DFF] shadow-[0_10px_28px_rgba(124,77,255,0.13)]",
    focusClasses,
    className,
  )

  const tooltipHandlers = {
    onMouseEnter: () => setShowTooltip(true),
    onMouseLeave: () => setShowTooltip(false),
    onFocus: () => setShowTooltip(true),
    onBlur: () => setShowTooltip(false),
  }

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={buttonClasses}
        onClick={onNavigate}
        {...tooltipHandlers}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={panelActive || undefined}
      className={buttonClasses}
      onClick={props.onClick}
      {...tooltipHandlers}
    >
      {content}
    </button>
  )
}
