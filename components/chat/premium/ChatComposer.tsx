"use client";

import React, { useRef, useState, useEffect } from "react";
import { ImageIcon, Mic, Paperclip, Send, Smile, X } from "lucide-react";

const EMOJI_PALETTE = [
  "😀",
  "😂",
  "😍",
  "🔥",
  "👏",
  "👍",
  "🙏",
  "🎉",
  "💡",
  "✅",
  "🤔",
  "❤️",
];

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
  placeholder?: string;
  replyingTo?: any;
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
  placeholder = "Type a message...",
  replyingTo,
  onCancelReply,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 140);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
    if (e.key === "Escape") setShowEmojiPicker(false);
  };

  const handleAttachClick = () => {
    if (onAttach) {
      onAttach();
      return;
    }
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

  return (
    <div className="border-t border-border/70 bg-card/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      {replyingTo && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/60 px-4 py-2">
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-xs text-muted-foreground">
              Replying to {replyingTo.authorName}
            </div>
            <div className="truncate text-sm text-foreground">
              {replyingTo.content?.substring(0, 100)}
            </div>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full right-12 z-50 mb-3 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="rounded-xl p-2 text-xl transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Insert emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-3xl border border-border bg-background px-3 py-3 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Attach file"
          />

          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isLoading}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isLoading}
            className="hidden rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50 sm:inline-flex"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            rows={1}
            aria-label="Message text"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={isLoading}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="Add emoji"
            aria-label="Add emoji"
            aria-expanded={showEmojiPicker}
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onVoice}
            disabled={isLoading}
            className={`rounded-full p-2 transition disabled:opacity-50 ${isListening ? "bg-red-500/15 text-red-600 ring-2 ring-red-500/30" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            title={isListening ? "Stop recording" : "Record voice message"}
            aria-label={
              isListening
                ? "Stop recording voice message"
                : "Record voice message"
            }
          >
            <Mic className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={isLoading || !value.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            title="Send message"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 px-4 text-xs text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
          Enter
        </kbd>{" "}
        to send,{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5">
          Shift+Enter
        </kbd>{" "}
        for a new line
      </div>
    </div>
  );
}
