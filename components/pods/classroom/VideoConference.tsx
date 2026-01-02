"use client"

/**
 * VideoConference Component
 * 
 * Integrates Jitsi Meet for real-time video conferencing within pods.
 * Handles camera/microphone permissions, join/leave flows, media controls.
 * 
 * Features:
 * - Full video call with multiple participants via Jitsi
 * - Camera and microphone toggle controls
 * - Screen sharing support
 * - Permission request handling with error recovery
 * - Mobile-responsive design with touch targets
 * - Connection state management (connecting, connected, error)
 * 
 * @example
 * <VideoConference 
 *   podId="pod-123" 
 *   podName="Advanced Calculus" 
 *   onJoin={() => console.log('joined')}
 *   onLeave={() => console.log('left')}
 * />
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Maximize, 
  Minimize,
  Users,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { VideoConferenceProps } from "../types"

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

interface JitsiConfig {
  roomName: string
  width: string
  height: string
  parentNode: HTMLElement
  userInfo?: {
    displayName: string
  }
  configOverwrite?: Record<string, unknown>
  interfaceConfigOverwrite?: Record<string, unknown>
}

export function VideoConference({ 
  podId, 
  podName, 
  onJoin, 
  onLeave 
}: VideoConferenceProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  
  const [isJoined, setIsJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [jitsiLoaded, setJitsiLoaded] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<"good" | "moderate" | "poor" | null>(null)
  const [isWaitingForHost, setIsWaitingForHost] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3

  // Load Jitsi External API script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.JitsiMeetExternalAPI) {
      const script = document.createElement("script")
      script.src = "https://meet.jit.si/external_api.js"
      script.async = true
      script.onload = () => {
        setJitsiLoaded(true)
      }
      script.onerror = () => {
        setError("Failed to load video conferencing. Please refresh and try again.")
      }
      document.head.appendChild(script)

      return () => {
        // Cleanup script on unmount
        try {
          document.head.removeChild(script)
        } catch (e) {
          // Script may already be removed
        }
      }
    } else if (window.JitsiMeetExternalAPI) {
      setJitsiLoaded(true)
    }
  }, [])

  // Cleanup Jitsi on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose()
        } catch (e) {
          console.warn("Jitsi cleanup error:", e)
        }
        apiRef.current = null
      }
    }
  }, [])

  const generateRoomName = useCallback(() => {
    // Create a unique room name based on podId
    const sanitized = podId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    return `peerspark-pod-${sanitized}`
  }, [podId])

  const joinMeeting = useCallback(async () => {
    if (!jitsiLoaded || !containerRef.current) {
      toast({
        title: "Loading...",
        description: "Video conferencing is still loading. Please wait.",
      })
      return
    }

    if (apiRef.current) {
      // Already in a meeting
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request camera/mic permissions
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (permError: any) {
        if (permError.name === "NotAllowedError") {
          toast({
            title: "Permission Denied",
            description: "Please allow camera and microphone access to join the session.",
            variant: "destructive",
          })
          setError("Camera/microphone permission denied. Please allow access in your browser settings.")
          setIsConnecting(false)
          return
        }
        // Continue without media if other error
        console.warn("Media access warning:", permError)
      }

      const roomName = generateRoomName()
      
      const config: JitsiConfig = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        userInfo: {
          displayName: "Pod Member",
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableClosePage: false,
          disableInviteFunctions: true,
          enableWelcomePage: false,
          enableNoAudioDetection: true,
          enableNoisyMicDetection: true,
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720, max: 720, min: 180 },
              width: { ideal: 1280, max: 1280, min: 320 },
            },
          },
          // Mobile optimizations
          disableSimulcast: false,
          enableLayerSuspension: true,
          p2p: {
            enabled: true,
            stunServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: "",
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          DISABLE_RINGING: true,
          FILM_STRIP_MAX_HEIGHT: 120,
          VERTICAL_FILMSTRIP: true,
          CLOSE_PAGE_GUEST_HINT: false,
          DEFAULT_BACKGROUND: "#1a1a2e",
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "hangup",
            "chat",
            "raisehand",
            "tileview",
            "settings",
          ],
        },
      }

      const api = new window.JitsiMeetExternalAPI("meet.jit.si", config)
      apiRef.current = api

      // Event listeners
      api.addListener("videoConferenceJoined", () => {
        setIsJoined(true)
        setIsConnecting(false)
        onJoin?.()
        toast({
          title: "Joined Session",
          description: `Welcome to ${podName} classroom!`,
        })
      })

      api.addListener("videoConferenceLeft", () => {
        setIsJoined(false)
        setParticipantCount(0)
        onLeave?.()
      })

      api.addListener("participantJoined", () => {
        setParticipantCount((prev) => prev + 1)
      })

      api.addListener("participantLeft", () => {
        setParticipantCount((prev) => Math.max(0, prev - 1))
      })

      api.addListener("audioMuteStatusChanged", (data: { muted: boolean }) => {
        setIsAudioMuted(data.muted)
      })

      api.addListener("videoMuteStatusChanged", (data: { muted: boolean }) => {
        setIsVideoMuted(data.muted)
      })

      api.addListener("screenSharingStatusChanged", (data: { on: boolean }) => {
        setIsScreenSharing(data.on)
      })

      api.addListener("connectionQualityChanged", (data: { connectionQuality: string }) => {
        // Map Jitsi quality levels to simple states
        if (data.connectionQuality === "good" || data.connectionQuality === "2") {
          setConnectionQuality("good")
        } else if (data.connectionQuality === "moderate" || data.connectionQuality === "1") {
          setConnectionQuality("moderate")
        } else {
          setConnectionQuality("poor")
        }
      })

      api.addListener("conferenceWillJoin", () => {
        // Will join the conference (waiting for host or other conditions)
        setIsWaitingForHost(true)
      })

      api.addListener("readyToClose", () => {
        handleLeave()
      })

      api.addListener("errorOccurred", (error: any) => {
        console.error("Jitsi error:", error)
        
        // Attempt to reconnect on connection errors
        if (error?.type === "CONNECTION_ERROR" && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1
          setIsReconnecting(true)
          setTimeout(() => {
            setIsReconnecting(false)
            joinMeeting()
          }, 3000 + (reconnectAttempts.current * 1000)) // Exponential backoff
        } else {
          setError("Connection error occurred. Please try again.")
          setIsConnecting(false)
        }
      })

    } catch (e: any) {
      console.error("Failed to join meeting:", e)
      setError(e?.message || "Failed to start video call. Please try again.")
      setIsConnecting(false)
      toast({
        title: "Connection Failed",
        description: "Could not join the video session. Please try again.",
        variant: "destructive",
      })
    }
  }, [jitsiLoaded, generateRoomName, podName, onJoin, onLeave, toast])

  const handleLeave = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand("hangup")
        apiRef.current.dispose()
      } catch (e) {
        console.warn("Error leaving meeting:", e)
      }
      apiRef.current = null
    }
    setIsJoined(false)
    setIsConnecting(false)
    setParticipantCount(0)
    onLeave?.()
    toast({
      title: "Left Session",
      description: "You've left the virtual classroom",
    })
  }, [onLeave, toast])

  const toggleAudio = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleAudio")
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleVideo")
    }
  }, [])

  const toggleScreenShare = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleShareScreen")
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const retryConnection = useCallback(() => {
    setError(null)
    joinMeeting()
  }, [joinMeeting])

  return (
    <Card className="overflow-hidden bg-gray-900 dark:bg-black text-white border-0 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <CardContent className="p-0 relative">
        {/* Video Container with Enhanced Dark Mode */}
        <div 
          ref={containerRef}
          className={`
            w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-950 dark:to-gray-900
            ${isJoined ? "min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]" : "aspect-video"}
          `}
        >
          {/* Pre-join State */}
          {!isJoined && !isConnecting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-blue-600/20 flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                <Video className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 text-center">{podName} Classroom</h3>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 text-center max-w-xs sm:max-w-md">
                Join the live video session to collaborate with your pod members
              </p>
              <Button
                onClick={joinMeeting}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg h-auto"
                disabled={!jitsiLoaded}
              >
                {jitsiLoaded ? (
                  <>
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Join Session
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                )}
              </Button>
              <p className="text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4 text-center">
                Camera and microphone access required
              </p>
            </div>
          )}

          {/* Connecting State */}
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-300">Connecting to session...</p>
            </div>
          )}

          {/* Waiting for Host State */}
          {isWaitingForHost && !isConnecting && isJoined && (
            <div className="absolute bottom-4 left-4 right-4 bg-amber-600/20 border border-amber-600/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 text-sm font-medium">Waiting for session to start</p>
                <p className="text-amber-100/70 text-xs mt-1">The instructor will begin shortly</p>
              </div>
            </div>
          )}

          {/* Reconnecting State */}
          {isReconnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
              <p className="text-gray-300">Reconnecting...</p>
              <p className="text-gray-500 text-sm mt-2">Attempt {reconnectAttempts.current} of {maxReconnectAttempts}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Connection Error</h3>
              <p className="text-gray-400 text-sm mb-6 text-center max-w-md">{error}</p>
              <Button onClick={retryConnection} variant="outline" className="border-gray-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Control Bar - Only visible when in session */}
        {isJoined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-black/50 p-2 sm:p-3 md:p-4">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap px-2">
              {/* Audio Toggle */}
              <Button
                onClick={toggleAudio}
                variant={isAudioMuted ? "destructive" : "secondary"}
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full"
                title={isAudioMuted ? "Unmute" : "Mute"}
              >
                {isAudioMuted ? (
                  <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>

              {/* Video Toggle */}
              <Button
                onClick={toggleVideo}
                variant={isVideoMuted ? "destructive" : "secondary"}
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full"
                title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoMuted ? (
                  <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>

              {/* Screen Share */}
              <Button
                onClick={toggleScreenShare}
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full hidden sm:flex"
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Hang Up */}
              <Button
                onClick={handleLeave}
                variant="destructive"
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full"
                title="Leave session"
              >
                <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              {/* Fullscreen - Tablet and desktop only */}
              <Button
                onClick={toggleFullscreen}
                variant="secondary"
                size="icon"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full hidden md:flex"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>

            {/* Participant Count */}
            {participantCount > 0 && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-black/70 rounded-full px-2 sm:px-3 py-1 flex items-center gap-2 text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{participantCount + 1}</span>
              </div>
            )}

            {/* Connection Quality Indicator */}
            {connectionQuality && (
              <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full px-2 sm:px-3 py-1 flex items-center gap-2 text-xs sm:text-sm font-medium ${
                connectionQuality === "good" ? "bg-green-600/50 text-green-200" :
                connectionQuality === "moderate" ? "bg-amber-600/50 text-amber-200" :
                "bg-red-600/50 text-red-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionQuality === "good" ? "bg-green-400" :
                  connectionQuality === "moderate" ? "bg-amber-400" :
                  "bg-red-400"
                }`} />
                <span className="hidden sm:inline">
                  {connectionQuality === "good" && "Good"}
                  {connectionQuality === "moderate" && "Moderate"}
                  {connectionQuality === "poor" && "Weak"}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VideoConference
