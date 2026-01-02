"use client"

/**
 * ClassroomTab Component
 * 
 * Main container for live session activities combining video conferencing
 * and collaborative whiteboarding. Provides controls, participant management,
 * and resource access during active study sessions.
 * 
 * Features:
 * - Toggle between video and whiteboard views
 * - Live participant counter
 * - Quick action buttons (raise hand, chat, share file, notes)
 * - Responsive grid layout for different screen sizes
 * - Resource player integration
 * - Session status indicators
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Video,
  PenTool,
  Play,
  Hand,
  MessageSquare,
  Upload,
  BookOpen,
  FolderOpen,
} from "lucide-react"
import { VideoConference } from "../classroom/VideoConference"
import { WhiteboardCanvas } from "../classroom/WhiteboardCanvas"
import { ParticipantsList } from "../classroom/ParticipantsList"
import { MobileActionButton } from "../classroom/MobileActionButton"
import type { ClassroomTabProps } from "../types"

export function ClassroomTab({
  podId,
  podName,
  members,
  resources,
  onOpenChat,
  onOpenVault,
}: ClassroomTabProps) {
  const [activeView, setActiveView] = useState<"video" | "whiteboard">("video")
  const [isInSession, setIsInSession] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<"controls" | "participants" | "resources">("participants")

  const handlePlayVideo = (url: string) => {
    // Handle video playback
    console.log("Play video:", url)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-bold mb-1">{podName}</h2>
          <div className="flex items-center gap-4">
            <Badge 
              variant={isInSession ? "default" : "secondary"} 
              className={`h-7 gap-2 ${isInSession ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <span className={`w-2 h-2 rounded-full ${isInSession ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              {isInSession ? "Live Session" : "Offline"}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {members.filter(m => m.isOnline).length} online
            </span>
          </div>
        </div>

        {/* View Toggle with Enhanced Dark Mode */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "video" | "whiteboard")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto h-10 bg-secondary dark:bg-gray-800">
            <TabsTrigger 
              value="video" 
              className="gap-2 text-sm sm:text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:ring-2 data-[state=active]:ring-blue-500 transition-all"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Video Call</span>
              <span className="sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger 
              value="whiteboard" 
              className="gap-2 text-sm sm:text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:ring-2 data-[state=active]:ring-blue-500 transition-all"
            >
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Whiteboard</span>
              <span className="sm:hidden">Board</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Area - Video or Whiteboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Card with Focus Indicator */}
          <div className="rounded-lg overflow-hidden border-2 transition-all duration-200 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            {activeView === "video" ? (
              <VideoConference
                podId={podId}
                podName={podName}
                onJoin={() => setIsInSession(true)}
                onLeave={() => setIsInSession(false)}
              />
            ) : (
              <WhiteboardCanvas
                podId={podId}
                onSave={(data: unknown) => console.log("Whiteboard saved:", data)}
              />
            )}
          </div>

          {/* Resources Section */}
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                  Pod Resources
                </CardTitle>
                {resources.length > 0 && (
                  <Badge variant="outline" className="rounded-full">
                    {resources.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {resources.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No resources yet. Add materials to your pod vault.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onOpenVault}
                    className="h-9"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Open Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.slice(0, 4).map((resource) => (
                    <div
                      key={resource.$id || resource.id}
                      className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group"
                    >
                      <div className="w-14 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description || "Pod resource"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePlayVideo(resource.fileUrl || resource.link || "")}
                        className="h-8 px-3 flex-shrink-0"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Play</span>
                      </Button>
                    </div>
                  ))}
                  
                  {resources.length > 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                      onClick={onOpenVault}
                    >
                      View all {resources.length} resources →
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Tabs */}
        <div className="lg:space-y-0">
          <Card className="border-gray-200 dark:border-gray-800 h-full">
            <div className="sticky top-0 z-10 border-b bg-white dark:bg-gray-950">
              <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-12 bg-transparent rounded-none border-b">
                  <TabsTrigger 
                    value="controls" 
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-600 data-[state=active]:bg-transparent"
                  >
                    <span className="hidden sm:inline text-xs">Controls</span>
                    <span className="sm:hidden text-xs">Quick</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="participants"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-600 data-[state=active]:bg-transparent"
                  >
                    <span className="text-xs">Members</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources"
                    className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-600 data-[state=active]:bg-transparent"
                  >
                    <span className="text-xs">Notes</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CardContent className="p-4">
              {/* Controls Tab */}
              {sidebarTab === "controls" && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-10 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 border-gray-200"
                  >
                    <Hand className="w-4 h-4 mr-3 text-blue-600" />
                    <span>Raise Hand</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-10 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 border-gray-200"
                    onClick={onOpenChat}
                  >
                    <MessageSquare className="w-4 h-4 mr-3 text-green-600" />
                    <span>Open Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-10 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 border-gray-200"
                  >
                    <Upload className="w-4 h-4 mr-3 text-purple-600" />
                    <span>Share File</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-10 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950 border-gray-200"
                  >
                    <BookOpen className="w-4 h-4 mr-3 text-orange-600" />
                    <span>Take Notes</span>
                  </Button>
                </div>
              )}

              {/* Participants Tab */}
              {sidebarTab === "participants" && (
                <ParticipantsList members={members} maxDisplay={15} />
              )}

              {/* Resources Tab */}
              {sidebarTab === "resources" && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p>Session notes appear here</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Floating Action Button - Only visible on mobile/tablet */}
      <MobileActionButton
        onRaiseHand={() => console.log('Raise hand')}
        onOpenChat={onOpenChat}
        onShareFile={() => console.log('Share file')}
        onTakeNotes={() => console.log('Take notes')}
      />
    </div>
  )
}

export default ClassroomTab
