"use client"

/**
 * CalendarTab Component
 * 
 * Placeholder for calendar integration showing upcoming pod sessions and events.
 * Provides quick link to full calendar view.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { CalendarTabProps } from "../types"

export function CalendarTab({ handleOpenCalendar }: CalendarTabProps) {
  return (
    <div className="h-96">
      <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Pod Calendar</h3>
            <p className="text-muted-foreground mb-4">View upcoming sessions and events</p>
            <Button onClick={handleOpenCalendar} className="bg-primary hover:bg-primary/90">
              Open Full Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
