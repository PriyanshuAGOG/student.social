"use client";

import React from "react";
import { format, isSameDay } from "date-fns";
import { ChatBubble } from "./ChatBubble";

interface Message {
  $id: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: string;
  type?: string;
  replyTo?: string | null;
  replyToMessage?: Message | null;
  isEdited?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  deliveryState?: "sending" | "sent" | "delivered" | "read" | "failed";
  metadata?: Record<string, any>;
  deletedAt?: string | null;
}

interface MessageGroupProps {
  messages: Message[]
  currentUserId: string
  onReply?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onEdit?: (message: Message) => void
  onReact?: (messageId: string, emoji: string) => void
  showDateDivider?: boolean
  highlightQuery?: string
}

export function MessageGroup({
  messages,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  onReact,
  showDateDivider = true,
  highlightQuery = '',
}: MessageGroupProps) {
  if (messages.length === 0) return null;

  // Show date divider if messages are from different days
  const showDivider =
    showDateDivider &&
    messages.length > 0 &&
    messages[0].timestamp &&
    (messages[0].$id === messages[0].$id
      ? false
      : !isSameDay(
          new Date(messages[0].timestamp),
          new Date(messages[0].timestamp),
        ));

  return (
    <div className="space-y-1">
      {showDivider && (
        <div className="flex items-center gap-3 py-4 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs text-slate-500">
            {format(new Date(messages[0].timestamp), "MMMM d, yyyy")}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {messages.map((message) => {
        const isOwn = message.authorId === currentUserId;

        return (
          <ChatBubble
            key={message.$id}
            messageId={message.$id}
            content={message.content}
            isOwn={isOwn}
            timestamp={message.timestamp}
            authorName={message.authorName}
            authorAvatar={message.authorAvatar}
            fileUrl={message.fileUrl}
            fileName={message.fileName}
            type={message.type}
            replyToMessage={message.replyToMessage}
            isEdited={message.isEdited}
            deliveryState={message.deliveryState}
            reactions={message.metadata?.reactions}
            currentUserId={currentUserId}
            onReply={() => onReply?.(message)}
            onDelete={() => onDelete?.(message.$id)}
            onEdit={(content) => onEdit?.(message, content)}
            onCopy={() => onCopy?.(message)}
            onReact={(emoji) => onReact?.(message.$id, emoji)}
            highlightQuery={highlightQuery}
          />
        );
      })}
    </div>
  );
}
