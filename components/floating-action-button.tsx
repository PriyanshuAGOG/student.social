"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, PenTool, Users, Video, Calendar } from "lucide-react"
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
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border">
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              </div>
              <Button
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg bg-secondary hover:bg-secondary/80"
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
        className={cn(
          "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform",
          isExpanded && "rotate-45",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
