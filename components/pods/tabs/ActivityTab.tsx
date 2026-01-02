"use client"

/**
 * ActivityTab Component
 * 
 * Real-time activity feed showing pod events, sessions, and resource additions.
 * Includes reaction system (cheers) and quick links to upcoming sessions.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Calendar, FolderOpen, ChevronRight, Star } from "lucide-react"
import { ActivityTabProps } from "../types"

export function ActivityTab({
  activityFeed,
  upcomingEvent,
  resources,
  reactionCounts,
  cheers,
  handleCheer,
  handleOpenCalendar,
  handleOpenVault,
  handleJoinUpcoming,
  formatAgo,
}: ActivityTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pod Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet. Add a session or resource to get things moving.</p>
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge variant={item.type === "session" ? "secondary" : "outline"} className="text-xs mt-0.5">
                      {item.type === "session" ? "Session" : "Resource"}
                    </Badge>
                    <div>
                      <p className="font-medium leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{formatAgo(item.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCheer(item.id, item.type)}
                      aria-label="Cheer"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-6 text-center">{reactionCounts[item.id] ?? cheers[item.id] ?? 0}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        item.type === "session"
                          ? handleOpenCalendar()
                          : handleOpenVault()
                      }
                      aria-label="Open"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvent ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{upcomingEvent.title || "Pod session"}</p>
                <p className="text-muted-foreground">{new Date(upcomingEvent.startTime).toLocaleString()}</p>
                <Button size="sm" onClick={handleJoinUpcoming} className="w-full">
                  Join
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Latest Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resources.slice(0, 3).map((res) => (
              <div key={res.$id} className="p-2 border rounded-md text-sm">
                <p className="font-medium truncate">{res.title}</p>
                <p className="text-xs text-muted-foreground truncate">{res.description || "Resource"}</p>
              </div>
            ))}
            {resources.length === 0 && (
              <p className="text-sm text-muted-foreground">No resources yet. Add some in the vault.</p>
            )}
            <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleOpenVault}>
              View Vault
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
