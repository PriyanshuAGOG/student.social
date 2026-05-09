"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Sparkles, UsersRound, BookOpen, MessageSquareText, Command } from "lucide-react"

import { cn } from "@/lib/utils"

const suggestions = [
  { label: "Ask AI to build a study plan", href: "/app/ai", icon: Sparkles, meta: "AI" },
  { label: "Find active study pods", href: "/app/pods", icon: UsersRound, meta: "Pods" },
  { label: "Search saved notes and PDFs", href: "/app/vault", icon: BookOpen, meta: "Vault" },
  { label: "Open study messages", href: "/app/chat", icon: MessageSquareText, meta: "Chat" },
]

export function GlobalSearch() {
  const [focused, setFocused] = useState(false)
  const [query, setQuery] = useState("")

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[70] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 md:top-6">
      <div
        className={cn(
          "pointer-events-auto mx-auto overflow-hidden rounded-[26px] border border-[rgba(17,17,17,0.06)] bg-white/78 shadow-[0_18px_60px_rgba(0,0,0,0.055)] backdrop-blur-2xl transition-all duration-300",
          focused ? "w-full ring-4 ring-[#7C4DFF]/10" : "w-[min(520px,100%)]",
        )}
      >
        <label className="flex h-12 items-center gap-3 px-4 text-[#6E6E73] md:h-13 md:px-5">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            placeholder="Search people, pods, notes, AI summaries..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#111111] outline-none placeholder:text-[#A1A1AA]"
            aria-label="Search PeerSpark"
          />
          <span className="hidden items-center gap-1 rounded-full border border-black/[0.06] bg-[#F7F7FA] px-2 py-1 text-[11px] font-semibold text-[#A1A1AA] md:flex">
            <Command className="h-3 w-3" aria-hidden="true" />K
          </span>
        </label>

        <div
          className={cn(
            "grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            focused ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-black/[0.06] p-2">
              {suggestions.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 hover:bg-[#F6F1FF]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#EFE8FF] text-[#7C4DFF] transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 font-semibold text-[#111111]">{query ? item.label.replace(/Search|Find|Open|Ask/i, "Search") : item.label}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#A1A1AA] shadow-[0_8px_20px_rgba(0,0,0,0.04)]">{item.meta}</span>
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
