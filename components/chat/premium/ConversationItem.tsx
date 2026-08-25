"use client";

import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";
import { GraduationCap, UsersRound } from "lucide-react";

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
  onContextMenu?: (event: React.MouseEvent) => void;
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
    ? formatDistanceToNowStrict(new Date(timestamp), { addSuffix: false })
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`group mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76556d]/50 ${isSelected ? "bg-[#76556d]/[0.10]" : "hover:bg-muted/75"}`}
      aria-current={isSelected ? "page" : undefined}
    >
      <div className="relative shrink-0">
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#eadfe7,#c7aebd)] text-sm font-semibold text-[#4f3547] dark:bg-[linear-gradient(145deg,#76556d,#4a3544)] dark:text-white">
          {avatar ? <Image src={avatar} alt={name} fill unoptimized sizes="48px" className="object-cover" /> : <span>{name.trim().charAt(0).toUpperCase() || "P"}</span>}
        </div>
        {isOnline ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-[#8f9b6d]" aria-label="Online" /> : null}
      </div>

      <div className="min-w-0 flex-1 border-b border-border/45 py-1.5 group-last:border-transparent">
        <div className="flex items-center justify-between gap-3">
          <h3 className={`truncate text-[15px] font-semibold tracking-[-0.01em] ${unreadCount ? "text-foreground" : "text-foreground/90"}`}>{name}</h3>
          {timeFormatted ? <span className={`shrink-0 text-[11px] ${unreadCount ? "font-medium text-primary" : "text-muted-foreground"}`}>{timeFormatted}</span> : null}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {type === "pod" ? <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Pod chat" /> : null}
          {type === "group" ? <UsersRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Group chat" /> : null}
          <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">{lastMessage || "Start the conversation"}</p>
          {unreadCount && unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
