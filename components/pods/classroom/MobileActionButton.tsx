"use client"

/**
 * MobileActionButton Component
 * 
 * Floating action button for mobile users in the classroom view.
 * Provides quick access to essential session controls when screen space is limited.
 * 
 * Features:
 * - Only visible on mobile/tablet devices (< 1024px)
 * - Expandable menu with primary actions
 * - Smooth animations and transitions
 * - Touch-optimized hit targets (56x56px FAB)
 * - Auto-collapse after action selection
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Hand, MessageSquare, Upload, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileActionButtonProps {
  onRaiseHand?: () => void
  onOpenChat?: () => void
  onShareFile?: () => void
  onTakeNotes?: () => void
}

export function MobileActionButton({
  onRaiseHand,
  onOpenChat,
  onShareFile,
  onTakeNotes,
}: MobileActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const actions = [
    {
      icon: Hand,
      label: "Raise Hand",
      action: () => {
        onRaiseHand?.()
        setIsExpanded(false)
      },
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: MessageSquare,
      label: "Chat",
      action: () => {
        onOpenChat?.()
        setIsExpanded(false)
      },
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      icon: Upload,
      label: "Share File",
      action: () => {
        onShareFile?.()
        setIsExpanded(false)
      },
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      icon: BookOpen,
      label: "Notes",
      action: () => {
        onTakeNotes?.()
        setIsExpanded(false)
      },
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ]

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container - Only visible on mobile/tablet */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden flex flex-col-reverse items-end gap-3">
        {/* Action Buttons - appear when expanded */}
        {isExpanded && (
          <div className="flex flex-col-reverse gap-3 animate-in fade-in-0 slide-in-from-bottom-5 duration-200">
            {actions.map((action, index) => (
              <div
                key={action.label}
                className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-right-5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="bg-black/80 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg transition-all",
                    action.color
                  )}
                  onClick={action.action}
                  aria-label={action.label}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
            isExpanded
              ? "bg-red-600 hover:bg-red-700 rotate-45"
              : "bg-blue-600 hover:bg-blue-700"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Close menu" : "Open quick actions"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-white rotate-45" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </>
  )
}

export default MobileActionButton
