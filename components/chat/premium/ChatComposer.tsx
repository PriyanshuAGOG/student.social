"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, Smile, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_PALETTE = ["😀", "😂", "😍", "🔥", "👏", "👍", "🙏", "🎉", "💡", "✅", "🤔", "❤️"];

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onAttachFile?: (file: File) => void;
  onEmoji?: (emoji: string) => void;
  onVoice?: () => void;
  isLoading?: boolean;
  isListening?: boolean;
  recordingSeconds?: number;
  onCancelVoice?: () => void;
  placeholder?: string;
  replyingTo?: { authorName?: string; content?: string } | null;
  onCancelReply?: () => void;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onAttach,
  onAttachFile,
  onEmoji,
  onVoice,
  isLoading,
  isListening,
  recordingSeconds = 0,
  onCancelVoice,
  placeholder = "Message",
  replyingTo,
  onCancelReply,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const hasMessage = Boolean(value.trim());

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (hasMessage) onSend();
    }
    if (event.key === "Escape") setShowEmojiPicker(false);
  };

  const handleAttachClick = () => {
    if (onAttach) return onAttach();
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onAttachFile?.(file);
  };

  const insertEmoji = (emoji: string) => {
    if (onEmoji) onEmoji(emoji);
    else onChange(`${value}${emoji}`);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const recordingTime = `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`;

  return (
    <footer className="shrink-0 border-t border-border/45 bg-card/92 px-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl md:px-4 md:pb-3">
      <div className="mx-auto w-full max-w-5xl">
        {replyingTo ? (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border-l-4 border-primary bg-muted/60 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">Replying to {replyingTo.authorName || "message"}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{replyingTo.content?.slice(0, 100)}</p>
            </div>
            {onCancelReply ? <button type="button" onClick={onCancelReply} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Cancel reply"><X className="h-4 w-4" /></button> : null}
          </div>
        ) : null}

        {isListening ? (
          <div className="flex min-h-14 items-center gap-2 rounded-[24px] border border-[#76556d]/25 bg-[#76556d]/[0.07] px-2 py-2 shadow-sm" role="status" aria-label={`Recording voice message, ${recordingTime}`}>
            <button type="button" onClick={onCancelVoice} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-destructive" aria-label="Discard voice recording"><Trash2 className="h-4.5 w-4.5" /></button>
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#76556d]" aria-hidden />
            <span className="w-10 text-xs font-semibold tabular-nums text-[#76556d] dark:text-[#d9b8d0]">{recordingTime}</span>
            <div className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[3px] overflow-hidden" aria-hidden>
              {Array.from({ length: 28 }, (_, index) => (
                <span
                  key={index}
                  className="w-[3px] rounded-full bg-[#76556d]/75 motion-safe:animate-pulse"
                  style={{ height: `${8 + ((index * 11) % 22)}px`, animationDelay: `${(index % 7) * 90}ms`, animationDuration: `${650 + (index % 5) * 110}ms` }}
                />
              ))}
            </div>
            <button type="button" onClick={onVoice} disabled={isLoading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#76556d] text-white shadow-sm transition hover:bg-[#67475f] disabled:opacity-50" aria-label="Send voice message"><Send className="h-4.5 w-4.5" /></button>
          </div>
        ) : (
        <div className="relative flex items-end gap-2">
          {showEmojiPicker ? (
            <div className="absolute bottom-full left-0 z-50 mb-3 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
              {EMOJI_PALETTE.map((emoji) => (
                <button type="button" key={emoji} onClick={() => insertEmoji(emoji)} className="rounded-xl p-2 text-xl transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Insert emoji ${emoji}`}>{emoji}</button>
              ))}
            </div>
          ) : null}

          <div className="flex min-h-11 flex-1 items-end gap-1 rounded-[22px] border border-border/50 bg-background px-1.5 py-1 shadow-sm transition focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} aria-label="Attach file" />
            <button type="button" onClick={() => setShowEmojiPicker((open) => !open)} disabled={isLoading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Add emoji" aria-expanded={showEmojiPicker}><Smile className="h-5 w-5" /></button>
            <button type="button" onClick={() => onChange(`${value}${value && !value.endsWith(" ") ? " " : ""}@AI `)} disabled={isLoading} className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-semibold text-[#76556d] transition hover:bg-[#76556d]/10 disabled:opacity-50" aria-label="Mention the AI Tutor"><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">AI</span></button>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              rows={1}
              aria-label="Message text"
            />
            <button type="button" onClick={handleAttachClick} disabled={isLoading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Attach file"><Paperclip className="h-5 w-5" /></button>
          </div>

          <button
            type="button"
            onClick={hasMessage ? onSend : onVoice}
            disabled={isLoading || (!hasMessage && !onVoice)}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-45",
              "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label={hasMessage ? "Send message" : "Record voice message"}
          >
            {hasMessage ? <Send className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
        )}

        <p className="mt-1.5 hidden px-3 text-[10px] text-muted-foreground/70 md:block">Enter to send · Shift + Enter for a new line</p>
      </div>
    </footer>
  );
}
