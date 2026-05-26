"use client"

/**
 * CalendarTab Component
 * 
 * Compact calendar preview for the pod workspace.
 * Provides a polished entry point to the full calendar experience.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock3, Sparkles, Video, Bell } from "lucide-react"
import { CalendarTabProps } from "../types"

export function CalendarTab({ handleOpenCalendar }: CalendarTabProps) {
  return (
    <div className="h-96">
      <Card className="h-full overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="h-full p-4 md:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Schedule</p>
                <h3 className="text-xl font-semibold mt-1">Pod Calendar</h3>
              </div>
              <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-background/70 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Video className="w-4 h-4 text-primary" />
                  Live sessions
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Join study calls, reviews, and pod meetups from one place.</p>
              </div>
              <div className="rounded-xl border bg-background/70 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bell className="w-4 h-4 text-accent" />
                  Smart reminders
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Keep deadlines, check-ins, and recurring sessions visible.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Clock3 className="w-3 h-3" />
                Weekly sync
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="w-3 h-3" />
                Focus sessions
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleOpenCalendar} className="bg-primary hover:bg-primary/90">
              Open Full Calendar
            </Button>
            <Button variant="outline" onClick={handleOpenCalendar}>
              Review upcoming events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
