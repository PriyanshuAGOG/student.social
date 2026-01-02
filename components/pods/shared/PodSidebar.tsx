"use client"

/**
 * PodSidebar Component
 * 
 * Right sidebar displaying pod mentor information, participant list preview,
 * tags, and member leaderboard. Used on pod overview and detail pages.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Users, MessageSquare, Tag } from "lucide-react"
import type { Pod, PodMember, LeaderboardStats, YourRank } from "../types"
import { LeaderboardCard } from "./LeaderboardCard"

interface PodSidebarProps {
  pod: Pod
  memberProfiles: PodMember[]
  leaderboard: PodMember[]
  leaderboardStats: LeaderboardStats
  yourRank: YourRank | null
  handleOpenChat: () => void
}

export function PodSidebar({
  pod,
  memberProfiles,
  leaderboard,
  leaderboardStats,
  yourRank,
  handleOpenChat,
}: PodSidebarProps) {
  const displayMembers = memberProfiles.slice(0, 6)
  const remainingCount = Math.max(0, memberProfiles.length - 6)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mentor Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Pod Mentor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pod.mentor ? (
            <>
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                  <AvatarImage src={pod.mentor.avatar} alt={pod.mentor.name} />
                  <AvatarFallback>
                    {pod.mentor.name?.slice(0, 2)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{pod.mentor.name}</h4>
                  <p className="text-sm text-muted-foreground">{pod.mentor.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{pod.mentor.bio}</p>
              <Button className="w-full" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Mentor
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No mentor assigned yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Participants Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Participants ({memberProfiles.length || (typeof pod.members === 'number' ? pod.members : 0)})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total members</span>
            <span className="font-semibold text-foreground">
              {typeof pod.members === 'number' ? pod.members.toLocaleString() : memberProfiles.length}
            </span>
          </div>
          
          {memberProfiles.length === 0 ? (
            <p className="text-muted-foreground">
              No roster yet. Use chat to meet your podmates.
            </p>
          ) : (
            <div className="space-y-2">
              {displayMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name?.slice(0, 2)?.toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
              {remainingCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{remainingCount} more members
                </p>
              )}
            </div>
          )}
          
          <Button variant="outline" className="w-full" onClick={handleOpenChat}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Open pod chat
          </Button>
        </CardContent>
      </Card>

      {/* Tags */}
      {pod.tags && pod.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pod.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <LeaderboardCard
        members={leaderboard}
        stats={leaderboardStats}
        yourRank={yourRank}
      />
    </div>
  )
}

export default PodSidebar
