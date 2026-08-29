"use client";

import React, { Fragment } from "react";
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
  readBy?: string[];
  deliveredBy?: string[];
  receipts?: Array<{ userId: string; deliveredAt?: string | null; readAt?: string | null }>;
}

interface MessageGroupProps {
  messages: Message[]
  currentUserId: string
  onReply?: (message: Message) => void
  onDelete?: (messageId: string) => void
  onEdit?: (message: Message, content?: string) => void
  onCopy?: (message: Message) => void
  onReact?: (messageId: string, emoji: string) => void
  showDateDivider?: boolean
  highlightQuery?: string
  onShowReceiptDetails?: (message: Message) => void
}

export function MessageGroup({
  messages,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  onCopy,
  onReact,
  showDateDivider = true,
  highlightQuery = '',
  onShowReceiptDetails,
}: MessageGroupProps) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {messages.map((message, index) => {
        const isOwn = message.authorId === currentUserId;
        const previousMessage = messages[index - 1];
        const showDivider =
          showDateDivider &&
          Boolean(message.timestamp) &&
          (!previousMessage ||
            !isSameDay(
              new Date(message.timestamp),
              new Date(previousMessage.timestamp),
            ));

        return (
          <Fragment key={message.$id}>
            {showDivider ? (
              <div className="flex justify-center py-4">
                <span className="rounded-full border border-border/45 bg-card/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
                  {format(new Date(message.timestamp), "MMMM d, yyyy")}
                </span>
              </div>
            ) : null}
            <ChatBubble
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
              metadata={message.metadata}
              currentUserId={currentUserId}
              onReply={() => onReply?.(message)}
              onDelete={() => onDelete?.(message.$id)}
              onEdit={() => onEdit?.(message)}
              onReact={(emoji) => onReact?.(message.$id, emoji)}
              highlightQuery={highlightQuery}
              onDeliveryDetails={isOwn ? () => onShowReceiptDetails?.(message) : undefined}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
