"use client";

import Image from "next/image";
import { Fragment, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CircleAlert, Edit3, MoreHorizontal, Pause, Play, Reply, Smile, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "🎉"];

interface ChatBubbleProps {
  messageId?: string;
  content: string;
  isOwn: boolean;
  timestamp: string;
  authorName?: string;
  authorAvatar?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  type?: string;
  replyToMessage?: { authorName?: string; content?: string } | null;
  isEdited?: boolean;
  deliveryState?: "sending" | "sent" | "delivered" | "read" | "failed";
  onReply?: () => void;
  onDelete?: () => void;
  onEdit?: (content?: string) => void;
  onReact?: (emoji: string) => void;
  onCopy?: () => void;
  reactions?: Record<string, string[]>;
  highlightQuery?: string;
  currentUserId?: string;
  onDeliveryDetails?: () => void;
}

function DeliverySignal({ state, onClick }: { state?: ChatBubbleProps["deliveryState"]; onClick?: () => void }) {
  if (state === "failed") return <span className="inline-flex items-center gap-1 text-red-600"><CircleAlert className="h-3 w-3" /> Failed</span>;
  const reached = state === 'delivered' || state === 'read'
  const seen = state === 'read'
  const label = state === 'sending' ? 'Sending' : seen ? 'Seen' : reached ? 'Reached' : 'Sent'
  return (
    <button type="button" onClick={onClick} disabled={!onClick || state === 'sending'} className="inline-flex items-center gap-1 rounded-full px-0.5 font-medium disabled:cursor-default" aria-label={`${label}${onClick ? ', open message journey' : ''}`}>
      <span className="inline-flex items-center gap-[2px]" aria-hidden>
        <span className={`h-1.5 w-1.5 rounded-full ${state === 'sending' ? 'animate-pulse bg-current/35' : 'bg-current/80'}`} />
        <span className={`h-1.5 w-1.5 rounded-full ${reached ? (seen ? 'bg-[#76556d]' : 'bg-[#6f6a4f]') : 'border border-current/45'}`} />
        <span className={`h-1.5 w-1.5 rounded-full ${seen ? 'bg-[#76556d]' : 'border border-current/45'}`} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ChatBubble({
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
  reactions,
  highlightQuery = "",
  currentUserId = "",
  onDeliveryDetails,
}: ChatBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const date = new Date(timestamp);
  const timeFormatted = Number.isNaN(date.getTime()) ? "" : format(date, "HH:mm");
  const isImage = Boolean(fileUrl && /\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?|$)/i.test(fileUrl));
  const isVoice = Boolean(fileUrl && type === "voice");
  const normalizedReactions = useMemo(
    () =>
      Object.entries(reactions || {})
        .map(([emoji, users]) => ({ emoji, users: Array.from(new Set((users || []).filter(Boolean))) }))
        .filter((entry) => entry.users.length > 0),
    [reactions],
  );

  const renderHighlightedText = (text: string) => {
    const query = highlightQuery.trim();
    if (!query) return text;
    const escaped = query.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${escaped})`, "ig")).map((part, index) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={`${part}-${index}`} className="rounded bg-yellow-300 px-0.5 text-black">{part}</mark>
        : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
    );
  };

  return (
    <div className={cn("group flex items-end gap-2 py-0.5", isOwn ? "justify-end" : "justify-start")} onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>
      {!isOwn ? (
        <div className="relative mb-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#76556d]/15 text-[10px] font-semibold text-[#76556d] dark:text-[#d9b8d0]">
          {authorAvatar ? <Image src={authorAvatar} alt={authorName || "User"} fill unoptimized sizes="28px" className="object-cover" /> : <span>{authorName?.charAt(0).toUpperCase() || "?"}</span>}
        </div>
      ) : null}

      <div className={cn("relative flex max-w-[86%] flex-col sm:max-w-[74%] lg:max-w-[68%]", isOwn ? "items-end" : "items-start")}>
        <div className="relative flex items-start gap-1">
          {isOwn ? (
            <button type="button" onClick={() => setShowActions((open) => !open)} className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-100 transition hover:bg-muted md:opacity-0 md:group-hover:opacity-100" aria-label="Message actions" aria-expanded={showActions}><MoreHorizontal className="h-4 w-4" /></button>
          ) : null}

          <div className={cn(
            "relative min-w-24 rounded-2xl px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
            isOwn
              ? "rounded-br-md bg-[#ead8cf] text-[#352822] dark:bg-[#684737] dark:text-white"
              : "rounded-bl-md border border-border/35 bg-card text-card-foreground",
          )}>
            {!isOwn && authorName ? <p className="mb-1 text-[11px] font-semibold text-[#76556d] dark:text-[#d9b8d0]">{authorName}</p> : null}
            {replyToMessage ? (
              <div className={cn("mb-2 rounded-xl border-l-4 border-primary px-2.5 py-2 text-xs", isOwn ? "bg-black/[0.05] dark:bg-black/15" : "bg-muted/70")}>
                <p className="font-semibold text-primary">{replyToMessage.authorName || "Reply"}</p>
                <p className="mt-0.5 truncate opacity-65">{replyToMessage.content?.slice(0, 90)}</p>
              </div>
            ) : null}

            {isVoice ? (
              <VoiceNotePlayer src={fileUrl || ""} label={fileName || "Voice message"} />
            ) : null}
            {fileUrl && !isImage && !isVoice ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" download={fileName || undefined} className="mb-2 flex items-center gap-2 rounded-xl bg-black/[0.06] px-3 py-2 text-sm underline-offset-2 hover:underline"><span aria-hidden>📎</span><span className="truncate">{fileName || "Download attachment"}</span></a>
            ) : null}
            {isImage ? (
              <a href={fileUrl || "#"} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl">
                <Image src={fileUrl || ""} alt={fileName || "Attachment"} width={720} height={480} unoptimized className="max-h-80 w-auto max-w-full object-cover" />
              </a>
            ) : null}

            <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.42]">
              {renderHighlightedText(content)}
              <span className="ml-2 inline-flex translate-y-[2px] items-center gap-0.5 whitespace-nowrap text-[10px] opacity-55">
                {isEdited ? <span>edited ·</span> : null}
                {timeFormatted}
                {isOwn ? <DeliverySignal state={deliveryState} onClick={onDeliveryDetails} /> : null}
              </span>
            </p>
          </div>

          {!isOwn ? (
            <button type="button" onClick={() => setShowActions((open) => !open)} className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-100 transition hover:bg-muted md:opacity-0 md:group-hover:opacity-100" aria-label="Message actions" aria-expanded={showActions}><MoreHorizontal className="h-4 w-4" /></button>
          ) : null}
        </div>

        {normalizedReactions.length > 0 ? (
          <div className="-mt-1.5 z-10 flex flex-wrap gap-1 px-2">
            {normalizedReactions.map(({ emoji, users }) => {
              const active = currentUserId ? users.includes(currentUserId) : false;
              return <button type="button" key={emoji} onClick={() => onReact?.(emoji)} aria-pressed={active} className={cn("rounded-full border bg-card px-2 py-0.5 text-[11px] shadow-sm", active ? "border-[#76556d]/50 text-[#76556d] dark:text-[#d9b8d0]" : "border-border")}>{emoji} {users.length}</button>;
            })}
          </div>
        ) : null}

        {showActions ? (
          <div className={cn("absolute top-full z-30 mt-1 flex items-center gap-0.5 rounded-full border border-border bg-popover p-1 text-popover-foreground shadow-xl", isOwn ? "right-0" : "left-0")}>
            <button type="button" onClick={onReply} className="rounded-full p-2 hover:bg-muted" aria-label="Reply"><Reply className="h-4 w-4" /></button>
            {onReact ? <button type="button" onClick={() => setShowReactionPicker((open) => !open)} className="rounded-full p-2 hover:bg-muted" aria-label="React to message"><Smile className="h-4 w-4" /></button> : null}
            {onEdit && isOwn ? <button type="button" onClick={() => onEdit()} className="rounded-full p-2 hover:bg-muted" aria-label="Edit message"><Edit3 className="h-4 w-4" /></button> : null}
            {onDelete && isOwn ? <button type="button" onClick={onDelete} className="rounded-full p-2 text-destructive hover:bg-destructive/10" aria-label="Delete message"><Trash2 className="h-4 w-4" /></button> : null}
            {showReactionPicker ? (
              <div className={cn("absolute bottom-full mb-2 flex gap-0.5 rounded-full border border-border bg-popover p-1.5 shadow-2xl", isOwn ? "right-0" : "left-0")}>
                {QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" onClick={() => { onReact?.(emoji); setShowReactionPicker(false); setShowActions(false); }} className="rounded-full p-1.5 text-lg hover:bg-muted" aria-label={`React ${emoji}`}>{emoji}</button>)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatAudioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function VoiceNotePlayer({ src, label }: { src: string; label: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play().catch(() => undefined);
    else audio.pause();
  };

  return (
    <div className="mb-2 flex min-w-52 items-center gap-2.5 rounded-xl bg-black/[0.06] px-2.5 py-2" aria-label={label}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
      <button type="button" onClick={togglePlayback} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label={isPlaying ? "Pause voice message" : "Play voice message"}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(duration, 0.1)}
        step={0.1}
        value={Math.min(currentTime, Math.max(duration, 0.1))}
        onChange={(event) => {
          const next = Number(event.target.value);
          setCurrentTime(next);
          if (audioRef.current) audioRef.current.currentTime = next;
        }}
        className="h-1 min-w-0 flex-1 accent-primary"
        aria-label="Voice message position"
      />
      <span className="w-9 text-right text-[10px] tabular-nums opacity-60">{formatAudioTime(duration || currentTime)}</span>
    </div>
  );
}
