"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Brain, CalendarDays, Command, FileText, MessageSquareText, Search, Sparkles, Trophy, UsersRound, Zap } from "lucide-react"

import { cn } from "@/lib/utils"

const suggestions = [
  { label: "Ask AI to build a study plan", href: "/app/ai", icon: Sparkles, meta: "AI" },
  { label: "Find active study pods", href: "/app/pods", icon: UsersRound, meta: "Pods" },
  { label: "Search saved notes and PDFs", href: "/app/vault", icon: BookOpen, meta: "Vault" },
  { label: "Generate flashcards from a resource", href: "/app/ai?flashcards=true", icon: Brain, meta: "Cards" },
  { label: "Open study discussions", href: "/app/chat", icon: MessageSquareText, meta: "Chat" },
  { label: "Review upcoming sessions", href: "/app/calendar", icon: CalendarDays, meta: "Calendar" },
]

const scopes = [
  { label: "Users", icon: UsersRound },
  { label: "Pods", icon: Zap },
  { label: "Notes", icon: FileText },
  { label: "Challenges", icon: Trophy },
]

export function GlobalSearch() {
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState("")

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[70] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 md:top-6">
      <div
        className={cn(
          "pointer-events-auto mx-auto overflow-hidden rounded-[28px] border border-[rgba(17,17,17,0.06)] bg-white/82 shadow-[0_18px_60px_rgba(0,0,0,0.055),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all duration-300",
          focused ? "w-full ring-4 ring-[#7C4DFF]/10" : "w-[min(560px,100%)]",
        )}
      >
        <label className="flex h-12 items-center gap-3 px-4 text-[#6E6E73] md:h-14 md:px-5">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            placeholder="Search people, pods, notes, flashcards, AI summaries…"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111111] outline-none placeholder:text-[#A1A1AA]"
            aria-label="Search PeerSpark"
          />
          <span className="hidden items-center gap-1 rounded-full border border-black/[0.06] bg-[#F7F7FA] px-2 py-1 text-[11px] font-black text-[#A1A1AA] md:flex">
            <Command className="h-3 w-3" aria-hidden="true" />K
          </span>
        </label>

        <div className={cn("grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", focused ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden">
            <div className="border-t border-black/[0.06] p-2">
              <div className="mb-2 flex gap-2 overflow-x-auto p-1 scrollbar-none">
                {scopes.map((scope) => {
                  const Icon = scope.icon
                  return (
                    <span key={scope.label} className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#FCFCFD] px-3 py-1.5 text-[11px] font-black text-[#6E6E73]">
                      <Icon className="h-3.5 w-3.5 text-[#7C4DFF]" aria-hidden="true" />
                      {scope.label}
                    </span>
                  )
                })}
              </div>
              {suggestions.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 hover:bg-[#F6F1FF]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#EFE8FF] text-[#7C4DFF] transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 font-bold text-[#111111]">{query ? item.label.replace(/Search|Find|Open|Ask|Generate|Review/i, "Search") : item.label}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#A1A1AA] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">{item.meta}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
