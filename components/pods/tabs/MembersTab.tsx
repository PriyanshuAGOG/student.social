"use client"

/**
 * MembersTab Component
 * 
 * Complete pod member roster with profile information and online status.
 * Responsive grid layout for viewing all members at once.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MembersTabProps } from "../types"

export function MembersTab({ pod, memberProfiles }: MembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pod Members ({pod.members?.toLocaleString?.() || 0})</h3>
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          {memberProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members loaded yet. Join the pod chat to meet others.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {memberProfiles.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name?.slice(0, 2)?.toUpperCase?.() || "M"}</AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    {member.bio && <p className="text-xs text-muted-foreground truncate">{member.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
