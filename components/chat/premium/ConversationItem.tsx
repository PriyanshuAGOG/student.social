"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isSelected?: boolean;
  isOnline?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  type?: "direct" | "group" | "pod";
}

export function ConversationItem({
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount,
  isSelected,
  isOnline,
  onClick,
  onContextMenu,
  type = "direct",
}: ConversationItemProps) {
  const timeFormatted = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: false })
    : "";
  const badgeLabel = type === "pod" ? "Pod" : type === "group" ? "Group" : "DM";

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full border-l-2 px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected
          ? "border-l-primary bg-primary/10 shadow-inner"
          : "border-l-transparent hover:border-l-primary/40 hover:bg-muted/70"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-violet-500 text-sm font-semibold text-primary-foreground shadow-sm">
            {avatar && avatar.startsWith("http") ? (
              <img
                src={avatar}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{name[0]?.toUpperCase()}</span>
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-card bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {name}
            </h3>
            {timeFormatted && (
              <span className="flex-shrink-0 text-xs text-muted-foreground">
                {timeFormatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {badgeLabel}
            </span>
            <p className="truncate text-xs text-muted-foreground">
              {lastMessage || "No messages yet"}
            </p>
          </div>
        </div>

        {unreadCount && unreadCount > 0 ? (
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-xs font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
