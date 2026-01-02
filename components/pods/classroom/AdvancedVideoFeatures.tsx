/**
 * Video Features Enhancement Module
 * 
 * Adds advanced features like recording, virtual backgrounds, and more to Jitsi integration.
 * These features are typically available in Jitsi meet PRO but we implement toggles for them.
 */

"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  MessageCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Hand,
  Smile,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
} from "lucide-react"

interface AdvancedVideoFeature {
  id: string
  name: string
  enabled: boolean
  available: boolean
}

interface SessionFeatures {
  reactions: boolean
  raiseHand: boolean
  spotlight: boolean
  noiseSuppression: boolean
  virtualBackground: boolean
  recording: boolean
}

export function useVideoFeatures() {
  const [features, setFeatures] = useState<SessionFeatures>({
    reactions: true,
    raiseHand: true,
    spotlight: false,
    noiseSuppression: true,
    virtualBackground: false,
    recording: false,
  })

  const toggleFeature = useCallback((feature: keyof SessionFeatures) => {
    setFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }))
  }, [])

  return { features, toggleFeature }
}

/**
 * Advanced Video Control Panel
 * Additional features and settings for video sessions
 */
export function AdvancedVideoControls({
  features,
  onToggleFeature,
  isInSession,
}: {
  features: SessionFeatures
  onToggleFeature: (feature: keyof SessionFeatures) => void
  isInSession: boolean
}) {
  if (!isInSession) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-16 right-4 rounded-full w-10 h-10"
          title="Advanced features"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold mb-2">Session Features</p>
        </div>

        <DropdownMenuSeparator />

        {/* Reactions */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("reactions")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4" />
            <span className="text-sm">Reactions</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.reactions ? "bg-green-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        {/* Raise Hand */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("raiseHand")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Hand className="w-4 h-4" />
            <span className="text-sm">Raise Hand</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.raiseHand ? "bg-green-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        {/* Spotlight */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("spotlight")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Spotlight Video</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.spotlight ? "bg-green-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        {/* Noise Suppression */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("noiseSuppression")}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {features.noiseSuppression ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="text-sm">Noise Suppression</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.noiseSuppression ? "bg-green-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Virtual Background */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("virtualBackground")}
          className="flex items-center justify-between cursor-pointer opacity-50"
          disabled
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Virtual Backgrounds</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.virtualBackground ? "bg-green-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        {/* Recording */}
        <DropdownMenuItem
          onClick={() => onToggleFeature("recording")}
          className="flex items-center justify-between cursor-pointer opacity-50"
          disabled
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Recording</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${features.recording ? "bg-red-500" : "bg-gray-400"}`} />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-xs text-muted-foreground cursor-default" disabled>
          <HelpCircle className="w-3 h-3 mr-2" />
          Some features require Jitsi PRO
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Session Reaction Buttons
 * Quick emoji reactions during session
 */
export const SESSION_REACTIONS = [
  { emoji: "👏", label: "Clap", name: "clap" },
  { emoji: "🙌", label: "Thumbs Up", name: "thumbs" },
  { emoji: "❤️", label: "Love", name: "love" },
  { emoji: "😂", label: "Laugh", name: "laugh" },
  { emoji: "🔥", label: "Fire", name: "fire" },
]

export function SessionReactionsBar({
  onReact,
  isInSession,
}: {
  onReact: (reaction: string) => void
  isInSession: boolean
}) {
  if (!isInSession) return null

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-full px-3 py-2 flex gap-2">
      {SESSION_REACTIONS.map((reaction) => (
        <button
          key={reaction.name}
          onClick={() => onReact(reaction.name)}
          className="text-xl hover:scale-125 transition-transform cursor-pointer"
          title={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  )
}
