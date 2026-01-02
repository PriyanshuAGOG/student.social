"use client"

/**
 * OverviewTab Component
 * 
 * Displays pod progress, accountability metrics, and quick actions.
 * Includes member leaderboard, activity highlights, and commitment tracking.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Target, Calendar, Trophy, Video, MessageSquare, FolderOpen } from "lucide-react"
import { OverviewTabProps } from "../types"
import { PodSidebar } from "../shared/PodSidebar"

export function OverviewTab({
  pod,
  computedStats,
  activityItems,
  upcomingEvent,
  podStreak,
  pledge,
  setPledge,
  pledgeSaved,
  checkIns,
  checkInNote,
  setCheckInNote,
  studyWithMeEvents,
  rsvps,
  rsvpCounts,
  handleSavePledge,
  handleAddCheckIn,
  handleToggleRsvp,
  handleJoinUpcoming,
  handleOpenCalendar,
  handleOpenChat,
  handleOpenVault,
  onTabChange,
  memberProfiles,
  leaderboard,
  leaderboardStats,
  yourRank,
}: OverviewTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Your Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{pod.progress || 0}%</span>
                </div>
                <Progress value={pod.progress || 0} className="w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Study Streak</span>
                  <span className="text-sm text-muted-foreground">{pod.streak || 0} days</span>
                </div>
                <Progress value={((pod.streak || 0) / 30) * 100} className="w-full" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{computedStats.studyHours}</div>
                <div className="text-sm text-muted-foreground">Study Hours</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{computedStats.totalSessions}</div>
                <div className="text-sm text-muted-foreground">Sessions Attended</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{computedStats.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Pod Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet. Schedule a session or add a resource.</p>
            ) : (
              activityItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <Badge variant={item.type === "session" ? "secondary" : "outline"} className="text-xs">
                        {item.type === "session" ? "Session" : "Resource"}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">{item.meta}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {upcomingEvent && (
              <div className="col-span-2 md:col-span-4 p-3 border rounded-lg bg-muted/50 text-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold">Next session</p>
                  <p className="text-muted-foreground">{new Date(upcomingEvent.startTime).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleJoinUpcoming}>
                    Join
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleOpenCalendar}>
                    View
                  </Button>
                </div>
              </div>
            )}
            <Button
              onClick={() => onTabChange("classroom")}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Video className="w-6 h-6" />
              <span className="text-sm">Join Session</span>
            </Button>
            <Button
              onClick={handleOpenChat}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm">Pod Chat</span>
            </Button>
            <Button
              onClick={handleOpenVault}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <FolderOpen className="w-6 h-6" />
              <span className="text-sm">Resources</span>
            </Button>
            <Button
              onClick={handleOpenCalendar}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Schedule</span>
            </Button>
          </CardContent>
        </Card>

        {/* Accountability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Accountability & Commitments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg bg-muted/40">
                <p className="text-sm text-muted-foreground">Pod streak</p>
                <p className="text-2xl font-bold">{podStreak} days</p>
                <p className="text-xs text-muted-foreground">Based on completed sessions</p>
              </div>
              <div className="p-3 border rounded-lg bg-muted/40">
                <p className="text-sm text-muted-foreground">Weekly pledge</p>
                <p className="text-sm font-semibold line-clamp-2">{pledge || "Add a commitment for this week"}</p>
                <div className="text-xs text-muted-foreground">Keeps visible to your pod</div>
              </div>
              <div className="p-3 border rounded-lg bg-muted/40">
                <p className="text-sm text-muted-foreground">Live RSVPs</p>
                <p className="text-2xl font-bold">{Object.values(rsvpCounts).reduce((sum, val) => sum + val, 0)}</p>
                <p className="text-xs text-muted-foreground">Study-with-me RSVPs in this pod</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Set weekly commitment</p>
                <Textarea
                  placeholder="Example: 3 sessions + 2h review before Friday"
                  value={pledge}
                  onChange={(e) => setPledge(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <Button size="sm" onClick={handleSavePledge}>
                    Save pledge
                  </Button>
                  {pledgeSaved && <Badge variant="secondary" className="text-xs">Saved</Badge>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Peer check-in / standup</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="What did you finish? What's next?"
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddCheckIn}>
                    Post
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {checkIns.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No check-ins yet.</p>
                  ) : (
                    checkIns.map((c) => (
                      <div key={c.id} className="p-2 border rounded-md bg-muted/30">
                        <p className="text-sm font-medium">{c.by}</p>
                        <p className="text-xs text-muted-foreground">{new Date(c.at).toLocaleString()}</p>
                        <p className="text-sm mt-1">{c.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Study with me sessions</p>
              {studyWithMeEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No co-working sessions scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {studyWithMeEvents.filter(ev => ev.$id || ev.id).map((ev) => {
                    const eventId = (ev.$id || ev.id) as string
                    return (
                      <div key={eventId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium leading-tight">{ev.title || "Study with me"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(ev.startTime).toLocaleString()}</p>
                          <p className="text-[11px] text-muted-foreground">{rsvpCounts[eventId] || 0} going</p>
                        </div>
                        <Button size="sm" variant={rsvps[eventId] ? "secondary" : "outline"} onClick={() => handleToggleRsvp(eventId)}>
                          {rsvps[eventId] ? "RSVPed" : "RSVP"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pod Features */}
        <Card>
          <CardHeader>
            <CardTitle>Pod Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {(pod.features || []).map((feature: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <PodSidebar
        pod={pod}
        memberProfiles={memberProfiles}
        leaderboard={leaderboard}
        leaderboardStats={leaderboardStats}
        yourRank={yourRank}
        handleOpenChat={handleOpenChat}
      />
    </div>
  )
}
