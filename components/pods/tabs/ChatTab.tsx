"use client"

/**
 * ChatTab Component
 * 
 * Placeholder for pod chat interface enabling real-time messaging between members.
 * Provides quick access to full chat experience.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { ChatTabProps } from "../types"

export function ChatTab({ handleOpenChat }: ChatTabProps) {
  return (
    <div className="h-96">
      <Card className="h-full">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Pod Chat</h3>
            <p className="text-muted-foreground mb-4">Chat with other pod members</p>
            <Button onClick={handleOpenChat} className="bg-primary hover:bg-primary/90">
              Open Full Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
