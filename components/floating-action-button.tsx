"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, PenTool, Users, Video, Calendar, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()

  // Only show FAB on feed/home page
  const shouldShowFAB = pathname === "/app/feed" || pathname === "/app/home" || pathname === "/app"

  const actions = [
    {
      icon: PenTool,
      label: "Create Post",
      action: () => {
        toast({ title: "Create Post", description: "Opening post creator..." })
        setIsExpanded(false)
      },
    },
    {
      icon: Users,
      label: "Create Pod",
      action: () => {
        toast({ title: "Create Pod", description: "Opening pod creator..." })
        setIsExpanded(false)
      },
    },
    {
      icon: Video,
      label: "Start Session",
      action: () => {
        toast({ title: "Start Session", description: "Starting study session..." })
        setIsExpanded(false)
      },
    },
    {
      icon: Calendar,
      label: "Schedule Event",
      action: () => {
        toast({ title: "Schedule Event", description: "Opening calendar..." })
        setIsExpanded(false)
      },
    },
  ]

  if (!shouldShowFAB) {
    return null
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 md:hidden">
      <Link
        href="/app/ai"
        aria-label="Open AI assistant"
        className={cn(
          "absolute right-1 flex h-11 w-11 items-center justify-center rounded-full border border-[#7C5CFF]/35 bg-[#121216]/90 text-white shadow-[0_14px_34px_rgba(0,0,0,0.36),0_8px_22px_rgba(124,92,255,0.20),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105",
          isExpanded ? "bottom-72" : "bottom-16",
        )}
      >
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.24),transparent_68%)] blur-md" />
        <Bot className="relative h-5 w-5" strokeWidth={1.8} />
      </Link>

      {/* Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="rounded-full border border-white/10 bg-[#121216]/90 px-3 py-1 text-white shadow-lg backdrop-blur-xl">
                <span className="whitespace-nowrap text-sm font-medium">{action.label}</span>
              </div>
              <Button
                size="lg"
                className="h-12 w-12 rounded-full border border-white/10 bg-[#1A1A22] text-white shadow-[0_14px_34px_rgba(0,0,0,0.34)] hover:bg-[#7C5CFF]/25"
                onClick={action.action}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        aria-label="Create"
        className={cn(
          "h-14 w-14 rounded-full border border-[#7C5CFF]/35 bg-[#7C5CFF] text-white shadow-[0_18px_44px_rgba(124,92,255,0.32)] transition-transform hover:bg-[#6F50F5]",
          isExpanded && "rotate-45",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
