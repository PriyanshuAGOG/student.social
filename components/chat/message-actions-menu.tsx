"use client"

import { Copy, Edit3, Flag, Pin, Star, Trash2, MoreVertical, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ChatMessageActionTarget {
  $id: string
  content: string
  authorId: string
  fileUrl?: string | null
  fileName?: string | null
  metadata?: Record<string, any>
  deliveryState?: string
  deletedAt?: string | null
  isEdited?: boolean
}

interface MessageActionsMenuProps {
  message: ChatMessageActionTarget
  isOwnMessage: boolean
  isPinned?: boolean
  isStarred?: boolean
  onCopy: (message: ChatMessageActionTarget) => void
  onEdit?: (message: ChatMessageActionTarget) => void
  onDelete?: (message: ChatMessageActionTarget) => void
  onTogglePin?: (message: ChatMessageActionTarget) => void
  onToggleStar?: (message: ChatMessageActionTarget) => void
  onReport?: (message: ChatMessageActionTarget) => void
  onRequestCallback?: (message: ChatMessageActionTarget) => void
}

export function MessageActionsMenu({
  message,
  isOwnMessage,
  isPinned = false,
  isStarred = false,
  onCopy,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleStar,
  onReport,
  onRequestCallback,
}: MessageActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onCopy(message)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy text
        </DropdownMenuItem>
        {isOwnMessage && onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(message)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit message
          </DropdownMenuItem>
        )}
        {onTogglePin && (
          <DropdownMenuItem onSelect={() => onTogglePin(message)}>
            <Pin className="mr-2 h-4 w-4" />
            {isPinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
        )}
        {onToggleStar && (
          <DropdownMenuItem onSelect={() => onToggleStar(message)}>
            <Star className="mr-2 h-4 w-4" />
            {isStarred ? 'Unstar' : 'Star'}
          </DropdownMenuItem>
        )}
        {onRequestCallback && (
          <DropdownMenuItem onSelect={() => onRequestCallback(message)}>
            <Phone className="mr-2 h-4 w-4" />
            Request callback
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isOwnMessage && onDelete && (
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(message)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete message
          </DropdownMenuItem>
        )}
        {onReport && (
          <DropdownMenuItem onSelect={() => onReport(message)}>
            <Flag className="mr-2 h-4 w-4" />
            Report message
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}