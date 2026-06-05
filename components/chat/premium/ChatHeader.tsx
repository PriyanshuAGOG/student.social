"use client";

import React from "react";
import {
  MoreVertical,
  Phone,
  Search,
  Settings,
  Video,
  VolumeX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  onlineCount?: number;
  totalMembers?: number;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMoreOptions?: () => void;
  onSearchMessages?: () => void;
  onMuteConversation?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  callStatusText?: string;
}

export function ChatHeader({
  title,
  subtitle,
  avatar,
  onlineCount,
  totalMembers,
  onCall,
  onVideoCall,
  onMoreOptions,
  onSearchMessages,
  onMuteConversation,
  onBack,
  showBackButton = false,
  callStatusText = "LiveKit-ready voice/video room",
}: ChatHeaderProps) {
  const memberSubtitle = totalMembers
    ? `${onlineCount || 0} online · ${totalMembers} member${totalMembers === 1 ? "" : "s"}`
    : subtitle;

  return (
    <div className="border-b border-border/70 bg-card/95 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Back to conversations"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-cyan-500 to-violet-500 text-sm font-semibold text-primary-foreground shadow-md">
            {avatar?.startsWith("http") ? (
              <img
                src={avatar}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{title[0] || "C"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
              {title}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {memberSubtitle || callStatusText}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onVideoCall}
            disabled={!onVideoCall}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-cyan-500/60 hover:bg-cyan-500/10 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            title="Start video call"
            aria-label="Start video call"
          >
            <Video className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onCall}
            disabled={!onCall}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Start voice call"
            aria-label="Start voice call"
          >
            <Phone className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="More options"
                aria-label="Open conversation options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-60">
              <DropdownMenuItem
                onSelect={onSearchMessages}
                className="cursor-pointer"
              >
                <Search className="mr-2 h-4 w-4" />
                Search messages
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onMuteConversation}
                className="cursor-pointer"
              >
                <VolumeX className="mr-2 h-4 w-4" />
                Mute conversation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onMoreOptions}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Chat settings & details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
