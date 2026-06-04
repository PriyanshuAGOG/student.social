"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Check,
  Copy,
  Edit3,
  MoreHorizontal,
  Reply,
  Smile,
  Trash2,
  X,
} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

interface ChatBubbleProps {
  messageId: string;
  content: string;
  isOwn: boolean;
  timestamp: string;
  authorName?: string;
  authorAvatar?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  type?: string;
  replyToMessage?: any;
  isEdited?: boolean;
  deliveryState?: "sending" | "sent" | "delivered" | "read" | "failed";
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: (content: string) => void;
  onReact?: (emoji: string) => void;
  onCopy?: () => void;
  reactions?: Record<string, string[]>;
  highlightQuery?: string;
  currentUserId?: string;
  isSearchActive?: boolean;
}

export function ChatBubble({
  messageId,
  content,
  isOwn,
  timestamp,
  authorName,
  authorAvatar,
  fileUrl,
  fileName,
  type,
  replyToMessage,
  isEdited,
  deliveryState,
  onReply,
  onDelete,
  onEdit,
  onReact,
  onCopy,
  reactions,
  highlightQuery = "",
  currentUserId = "",
  isSearchActive = false,
}: ChatBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const date = new Date(timestamp);
  const timeFormatted = Number.isNaN(date.getTime())
    ? ""
    : format(date, "HH:mm");
  const isImage =
    fileUrl && /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i.test(fileUrl);
  const isAudio =
    type === "voice" ||
    Boolean(fileUrl && /\.(webm|mp3|wav|m4a|ogg)(\?|$)/i.test(fileUrl));
  const normalizedReactions = useMemo(() => {
    return Object.entries(reactions || {})
      .map(([emoji, users]) => ({
        emoji,
        users: Array.from(new Set((users || []).filter(Boolean))),
      }))
      .filter((entry) => entry.users.length > 0);
  }, [reactions]);

  const renderHighlightedText = (text: string) => {
    const query = highlightQuery.trim();
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "ig"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-yellow-300 px-0.5 text-black"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      ),
    );
  };

  const saveEdit = () => {
    const next = draft.trim();
    if (!next || next === content) {
      setDraft(content);
      setIsEditing(false);
      return;
    }
    onEdit?.(next);
    setIsEditing(false);
  };

  return (
    <div
      id={`message-${messageId}`}
      data-message-id={messageId}
      className={`group flex gap-3 py-2 transition-opacity duration-200 ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setShowActions(true);
      }}
    >
      {!isOwn && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary via-cyan-500 to-violet-500 text-xs font-semibold text-primary-foreground shadow-sm">
          {authorAvatar?.startsWith("http") ? (
            <img
              src={authorAvatar}
              alt={authorName || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{authorName?.[0] || "?"}</span>
          )}
        </div>
      )}

      <div
        className={`flex max-w-[72%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
      >
        {replyToMessage && (
          <button
            type="button"
            onClick={() =>
              replyToMessage.$id &&
              document
                .getElementById(`message-${replyToMessage.$id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            className="max-w-full rounded-xl border-l-4 border-primary bg-muted/70 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-muted"
            aria-label="Jump to replied message"
          >
            <div className="mb-1 font-medium text-foreground">
              {replyToMessage.authorName}
            </div>
            <div className="truncate">
              {replyToMessage.content?.substring(0, 70)}
            </div>
          </button>
        )}

        <div
          className={`relative rounded-3xl px-4 py-3 shadow-sm transition-all duration-150 ${
            isOwn
              ? "rounded-br-lg bg-primary text-primary-foreground"
              : "rounded-bl-lg border border-border bg-card text-card-foreground"
          } ${showActions ? "shadow-lg" : ""} ${isSearchActive ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background" : ""}`}
        >
          {fileUrl && !isImage && !isAudio && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              download={fileName}
              className={`mb-2 flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm underline-offset-2 hover:underline ${isOwn ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-muted/70"}`}
            >
              <span aria-hidden>📎</span>
              <span className="truncate">
                {fileName || "Download attachment"}
              </span>
            </a>
          )}

          {isAudio && fileUrl && (
            <div
              className={`mb-2 rounded-2xl border p-2 ${isOwn ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-muted/70"}`}
            >
              <p className="mb-1 text-xs font-medium">
                {fileName || "Voice message"}
              </p>
              <audio controls src={fileUrl} className="h-9 w-64 max-w-full" />
            </div>
          )}

          {isImage && (
            <a
              href={fileUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="mb-2 block overflow-hidden rounded-2xl"
            >
              <img
                src={fileUrl || ""}
                alt={fileName || "Attachment"}
                className="max-h-72 max-w-full object-cover"
              />
            </a>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-24 w-72 max-w-full rounded-xl border border-border bg-background p-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                aria-label="Edit message text"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(content);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground hover:bg-muted"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {renderHighlightedText(content)}
            </p>
          )}
          {isEdited && !isEditing && (
            <span
              className={`mt-1 block text-xs ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}
            >
              (edited)
            </span>
          )}
        </div>

        {normalizedReactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {normalizedReactions.map(({ emoji, users }) => {
              const active = currentUserId
                ? users.includes(currentUserId)
                : false;
              return (
                <button
                  type="button"
                  key={emoji}
                  className={`rounded-full border px-2 py-1 text-xs shadow-sm transition hover:scale-105 ${active ? "border-primary/60 bg-primary/15 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                  onClick={() => onReact?.(emoji)}
                  aria-pressed={active}
                  aria-label={`${active ? "Remove" : "Add"} ${emoji} reaction`}
                >
                  {emoji} {users.length}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <span>{timeFormatted}</span>
          {isOwn && (
            <span>
              {deliveryState === "read"
                ? "✓✓"
                : deliveryState === "failed"
                  ? "failed"
                  : deliveryState === "sending"
                    ? "sending…"
                    : "✓"}
            </span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="relative flex items-center gap-1 self-center rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-xl">
          <button
            type="button"
            onClick={onReply}
            className="rounded-xl p-1.5 transition hover:bg-muted"
            title="Reply"
            aria-label="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-xl p-1.5 transition hover:bg-muted"
            title="Copy"
            aria-label="Copy message"
          >
            <Copy className="h-4 w-4" />
          </button>
          {onReact && (
            <button
              type="button"
              onClick={() => setShowReactionPicker((prev) => !prev)}
              className="rounded-xl p-1.5 transition hover:bg-muted"
              title="React"
              aria-label="React to message"
              aria-expanded={showReactionPicker}
            >
              <Smile className="h-4 w-4" />
            </button>
          )}
          {onEdit && isOwn && (
            <button
              type="button"
              onClick={() => {
                setDraft(content);
                setIsEditing(true);
              }}
              className="rounded-xl p-1.5 transition hover:bg-muted"
              title="Edit"
              aria-label="Edit message"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          {onDelete && isOwn && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl p-1.5 text-destructive transition hover:bg-destructive/10"
              title="Delete"
              aria-label="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!onEdit && !onDelete && (
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          )}

          {showReactionPicker && (
            <div className="absolute bottom-full right-0 mb-2 flex gap-1 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact?.(emoji);
                    setShowReactionPicker(false);
                  }}
                  className="rounded-xl p-2 text-lg transition hover:bg-muted"
                  aria-label={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
