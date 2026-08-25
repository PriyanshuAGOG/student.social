"use client";

import Image from "next/image";
import { ArrowLeft, MoreVertical, Phone, Search, Settings, Video, VolumeX } from "lucide-react";
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

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 disabled:cursor-not-allowed disabled:opacity-40"
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
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
  callStatusText = "Voice and video ready",
}: ChatHeaderProps) {
  const memberSubtitle = totalMembers
    ? `${onlineCount || 0} online · ${totalMembers} member${totalMembers === 1 ? "" : "s"}`
    : subtitle || callStatusText;

  return (
    <header className="flex h-[62px] shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-card/92 px-2.5 backdrop-blur-xl md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {showBackButton ? (
          <HeaderIconButton label="Back to conversations" onClick={onBack}><ArrowLeft className="h-5 w-5" /></HeaderIconButton>
        ) : null}

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#eadfe7,#c7aebd)] text-sm font-semibold text-[#4f3547] dark:bg-[linear-gradient(145deg,#76556d,#4a3544)] dark:text-white">
          {avatar ? <Image src={avatar} alt={title} fill unoptimized sizes="40px" className="object-cover" /> : <span>{title.trim().charAt(0).toUpperCase() || "P"}</span>}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-foreground md:text-base">{title}</h1>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:text-xs">
            {onlineCount ? <span className="text-[#78815f] dark:text-[#b8c39a]">{memberSubtitle}</span> : memberSubtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <HeaderIconButton label="Start video call" onClick={onVideoCall}><Video className="h-[19px] w-[19px]" /></HeaderIconButton>
        <HeaderIconButton label="Start voice call" onClick={onCall}><Phone className="h-[18px] w-[18px]" /></HeaderIconButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open conversation options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-60 rounded-2xl p-1.5">
            <DropdownMenuItem onSelect={onSearchMessages} className="cursor-pointer rounded-xl"><Search className="mr-2 h-4 w-4" />Search messages</DropdownMenuItem>
            <DropdownMenuItem onSelect={onMuteConversation} className="cursor-pointer rounded-xl"><VolumeX className="mr-2 h-4 w-4" />Mute conversation</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onMoreOptions} className="cursor-pointer rounded-xl"><Settings className="mr-2 h-4 w-4" />Chat details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
