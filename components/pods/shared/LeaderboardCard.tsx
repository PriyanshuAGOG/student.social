"use client"

/**
 * LeaderboardCard Component
 * 
 * Displays pod member rankings with medals for top 3, stats, and progress bars.
 * Shows average metrics and current user ranking.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import type { PodMember, LeaderboardStats, YourRank } from "../types"

interface LeaderboardCardProps {
  members: PodMember[]
  stats: LeaderboardStats
  yourRank: YourRank | null
}

export function LeaderboardCard({ members, stats, yourRank }: LeaderboardCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          Pod Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs text-muted-foreground">
          <div className="p-2 border rounded-md">
            <p className="font-semibold text-foreground">Avg streak</p>
            <p className="text-lg font-bold text-primary">{stats.avgStreak} days</p>
          </div>
          <div className="p-2 border rounded-md">
            <p className="font-semibold text-foreground">Avg points</p>
            <p className="text-lg font-bold text-primary">{stats.avgPoints}</p>
          </div>
          {stats.topName && (
            <div className="p-2 border rounded-md col-span-2">
              <p className="font-semibold text-foreground">Top performer</p>
              <p className="text-sm text-muted-foreground">{stats.topName}</p>
            </div>
          )}
          {yourRank && (
            <div className="p-2 border rounded-md col-span-2 bg-muted/60">
              <p className="font-semibold text-foreground">Your rank</p>
              <p className="text-sm text-muted-foreground">
                #{yourRank.rank} • Streak {yourRank.streak} • {yourRank.points} pts
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Members will appear here once profiles are loaded.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center gap-2 sm:gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-6 text-xs font-semibold text-center ${
                    idx === 0
                      ? "text-yellow-500"
                      : idx === 1
                        ? "text-gray-400"
                        : idx === 2
                          ? "text-amber-600"
                          : "text-muted-foreground"
                  }`}
                >
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </div>
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.name?.slice(0, 2)?.toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    🔥 {member.streak || 0} • {member.points || 0} pts
                  </p>
                </div>
                <div className="w-16 sm:w-20 hidden sm:block">
                  <Progress
                    value={Math.min(100, (member.streak || 0) * 3)}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LeaderboardCard
