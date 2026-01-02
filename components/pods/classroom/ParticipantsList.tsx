"use client"

/**
 * ParticipantsList Component
 * 
 * Displays list of pod members in session with online status indicators.
 * Supports both compact and full display modes.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users } from "lucide-react"
import type { ParticipantsListProps } from "../types"

export function ParticipantsList({
  members,
  maxDisplay = 10,
  compact = false,
}: ParticipantsListProps) {
  const displayMembers = members.slice(0, maxDisplay)
  const remainingCount = Math.max(0, members.length - maxDisplay)

  if (compact) {
    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayMembers.slice(0, 5).map((member) => (
            <div key={member.id} className="relative">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xs">
                  {member.name?.slice(0, 2)?.toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              {member.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
          ))}
        </div>
        {members.length > 5 && (
          <span className="ml-2 text-sm text-muted-foreground">
            +{members.length - 5} more
          </span>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          Participants ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No participants yet. Join to see who&apos;s here.
          </p>
        ) : (
          <ScrollArea className="h-auto max-h-64">
            <div className="space-y-2 sm:space-y-3">
              {displayMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {member.name?.slice(0, 2)?.toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.role}
                    </p>
                  </div>
                  {member.streak > 0 && (
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      🔥 {member.streak}
                    </div>
                  )}
                </div>
              ))}
              
              {remainingCount > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{remainingCount} more members
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default ParticipantsList
