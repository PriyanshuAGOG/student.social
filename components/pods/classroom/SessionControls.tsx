"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Video,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  ScreenShare,
  ScreenShareOff,
  Phone,
  PhoneOff,
  Loader2,
} from "lucide-react"
import type { SessionControlsProps } from "../types"

export function SessionControls({
  isInSession,
  isVideoOn,
  isAudioOn,
  isScreenSharing,
  onJoinSession,
  onLeaveSession,
  onVideoToggle,
  onAudioToggle,
  onScreenShare,
}: SessionControlsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          Session Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isInSession ? (
          <Button
            onClick={onJoinSession}
            className="w-full bg-green-600 hover:bg-green-700 h-10 sm:h-11"
          >
            <Video className="w-4 h-4 mr-2" />
            Join Live Session
          </Button>
        ) : (
          <>
            <Button
              onClick={onLeaveSession}
              variant="destructive"
              className="w-full h-10 sm:h-11"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Session
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={isVideoOn ? "default" : "secondary"}
                onClick={onVideoToggle}
                className="h-10 sm:h-11"
                title={isVideoOn ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoOn ? (
                  <Camera className="w-4 h-4 sm:mr-2" />
                ) : (
                  <CameraOff className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isVideoOn ? "Camera On" : "Camera Off"}
                </span>
              </Button>
              
              <Button
                size="sm"
                variant={isAudioOn ? "default" : "secondary"}
                onClick={onAudioToggle}
                className="h-10 sm:h-11"
                title={isAudioOn ? "Mute" : "Unmute"}
              >
                {isAudioOn ? (
                  <Mic className="w-4 h-4 sm:mr-2" />
                ) : (
                  <MicOff className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isAudioOn ? "Mic On" : "Mic Off"}
                </span>
              </Button>
            </div>

            <Button
              size="sm"
              variant={isScreenSharing ? "default" : "outline"}
              onClick={onScreenShare}
              className="w-full h-10 sm:h-11 bg-transparent"
            >
              {isScreenSharing ? (
                <>
                  <ScreenShareOff className="w-4 h-4 mr-2" />
                  Stop Sharing
                </>
              ) : (
                <>
                  <ScreenShare className="w-4 h-4 mr-2" />
                  Share Screen
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionControls
