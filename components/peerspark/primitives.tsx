import type React from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type Action = { label: string; href: string; icon?: LucideIcon }

export function PeerSparkPage({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: Action[]
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-8 pt-6 sm:px-6 lg:px-8", className)}>
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/78 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#7C4DFF] shadow-[0_10px_30px_rgba(0,0,0,0.035)] backdrop-blur-2xl">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="text-balance text-4xl font-black tracking-[-0.07em] text-[#111111] sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-pretty text-base font-medium leading-7 text-[#6E6E73] sm:text-lg">{description}</p>
        </div>
        {actions?.length ? (
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {actions.map((action, index) => {
              const Icon = action.icon || ArrowUpRight
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "group inline-flex h-12 items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-extrabold shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.06)]",
                    index === 0 ? "bg-[#7C4DFF] text-white" : "border border-black/[0.06] bg-white/82 text-[#111111] backdrop-blur-2xl",
                  )}
                >
                  {action.label}
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[32px] border border-black/[0.06] bg-white/82 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.06)]", className)}>
      {children}
    </div>
  )
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#A1A1AA]">{eyebrow}</p> : null}
        <h2 className="text-2xl font-black tracking-[-0.045em] text-[#111111]">{title}</h2>
      </div>
      {action ? <button className="rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-extrabold text-[#7C4DFF] shadow-[0_8px_22px_rgba(0,0,0,0.03)]">{action}</button> : null}
    </div>
  )
}

export function Metric({ label, value, detail, tone = "violet" }: { label: string; value: string; detail: string; tone?: "violet" | "green" | "amber" }) {
  const tones = {
    violet: "bg-[#F6F1FF] text-[#7C4DFF]",
    green: "bg-[#F0FDF4] text-[#22C55E]",
    amber: "bg-[#FFFBEB] text-[#F59E0B]",
  }
  return (
    <Surface className="p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A1A1AA]">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="font-mono text-3xl font-black tracking-[-0.06em] text-[#111111]">{value}</span>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-black", tones[tone])}>{detail}</span>
      </div>
    </Surface>
  )
}

export function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <span className={cn("inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-extrabold", active ? "border-[#7C4DFF]/20 bg-[#7C4DFF] text-white shadow-[0_12px_30px_rgba(124,77,255,0.18)]" : "border-black/[0.06] bg-white/80 text-[#6E6E73]")}>{children}</span>
}

export function IconTile({ icon: Icon, tone = "violet" }: { icon: LucideIcon; tone?: "violet" | "green" | "amber" | "rose" }) {
  const tones = {
    violet: "bg-[#EFE8FF] text-[#7C4DFF]",
    green: "bg-[#F0FDF4] text-[#22C55E]",
    amber: "bg-[#FFFBEB] text-[#F59E0B]",
    rose: "bg-[#FFF1F2] text-[#EF4444]",
  }
  return <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-black/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]", tones[tone])}><Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" /></span>
}

export function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.map((name, index) => (
        <span key={name} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#EFE8FF] text-xs font-black text-[#7C4DFF] shadow-[0_8px_20px_rgba(0,0,0,0.05)]" style={{ zIndex: names.length - index }}>
          {name.slice(0, 1)}
        </span>
      ))}
    </div>
  )
}
