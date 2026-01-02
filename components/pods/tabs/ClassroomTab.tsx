"use client"

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
import { VideoConference } from "./VideoConference"
import { WhiteboardCanvas } from "./WhiteboardCanvas"
import { ParticipantsList } from "./ParticipantsList"
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

  const handlePlayVideo = (url: string) => {
    // Handle video playback
    console.log("Play video:", url)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* View Toggle - Mobile friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={isInSession ? "default" : "secondary"} className="h-6">
            {isInSession ? "🟢 Live" : "⚪ Offline"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {members.filter(m => m.isOnline).length} online
          </span>
        </div>
        
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "video" | "whiteboard")} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="video" className="gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Video Call</span>
              <span className="sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className="gap-2">
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">Whiteboard</span>
              <span className="sm:hidden">Board</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Area - Video or Whiteboard */}
        <div className="lg:col-span-2 space-y-4">
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
              onSave={(data) => console.log("Whiteboard saved:", data)}
            />
          )}

          {/* Video Resources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Pod Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-6">
                  <FolderOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No resources yet. Add some in the vault.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={onOpenVault}
                  >
                    Open Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {resources.slice(0, 4).map((resource) => (
                    <div
                      key={resource.$id || resource.id}
                      className="flex items-center gap-3 p-2 sm:p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-12 h-10 sm:w-16 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description || "Pod resource"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePlayVideo(resource.fileUrl || resource.link || "")}
                        className="h-8 px-2 sm:px-3 flex-shrink-0"
                      >
                        <Play className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Play</span>
                      </Button>
                    </div>
                  ))}
                  
                  {resources.length > 4 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={onOpenVault}
                    >
                      View all {resources.length} resources
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <ParticipantsList members={members} maxDisplay={8} />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-10 bg-transparent"
              >
                <Hand className="w-4 h-4 mr-2" />
                Raise Hand
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-10 bg-transparent"
                onClick={onOpenChat}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-10 bg-transparent"
              >
                <Upload className="w-4 h-4 mr-2" />
                Share File
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-10 bg-transparent"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Take Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ClassroomTab
