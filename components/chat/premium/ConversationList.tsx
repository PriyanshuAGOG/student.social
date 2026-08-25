"use client";

import { useMemo, useState } from "react";
import { MessageCircleMore, Search, SquarePen, X } from "lucide-react";
import { ConversationItem } from "./ConversationItem";

interface Conversation {
  $id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
  type?: "direct" | "group" | "pod";
  participants?: string[];
}

type ConversationFilter = "all" | "direct" | "group" | "pod";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  showSearchBox?: boolean;
  onNewChat?: () => void;
  activeFilter?: ConversationFilter;
  onFilterChange?: (filter: ConversationFilter) => void;
}

const FILTERS: Array<{ value: ConversationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "direct", label: "DMs" },
  { value: "group", label: "Groups" },
  { value: "pod", label: "Pods" },
];

function ConversationSkeleton() {
  return (
    <div className="space-y-2 px-3 py-3" aria-label="Loading conversations">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl px-2 py-3">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded-full bg-muted" />
            <div className="h-3 w-4/5 rounded-full bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery = "",
  onSearchChange,
  isLoading = false,
  showSearchBox = true,
  onNewChat,
  activeFilter = "all",
  onFilterChange,
}: ConversationListProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const filteredConversations = useMemo(() => {
    if (!localQuery.trim()) return conversations;
    const query = localQuery.trim().toLowerCase();
    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.lastMessage?.toLowerCase().includes(query) ||
        conversation.participants?.some((participant) => participant.toLowerCase().includes(query)),
    );
  }, [conversations, localQuery]);

  const handleSearchChange = (query: string) => {
    setLocalQuery(query);
    onSearchChange?.(query);
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-border/60 bg-card/96 backdrop-blur-xl lg:w-[360px]" aria-label="Conversations">
      <div className="student-chat-list-header shrink-0 border-b border-border/45 px-4 pb-3 pt-3 md:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="student-chat-list-title font-semibold tracking-[-0.035em] text-foreground">Chats</h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">Messages and study groups</p>
          </div>
          {onNewChat ? (
            <button type="button" onClick={onNewChat} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(63,111,107,0.2)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" aria-label="Start a new chat">
              <SquarePen className="h-4.5 w-4.5" />
            </button>
          ) : null}
        </div>

        {showSearchBox ? (
          <div className="relative mt-3 md:mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search chats"
              value={localQuery}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-10 w-full rounded-full border border-transparent bg-muted/70 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/30 focus:bg-background focus:ring-2 focus:ring-primary/10"
            />
            {localQuery ? (
              <button type="button" aria-label="Clear conversation search" onClick={() => handleSearchChange("")} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex gap-1 overflow-x-auto" aria-label="Filter conversations">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange?.(filter.value)}
              aria-pressed={activeFilter === filter.value}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76556d]/50 ${activeFilter === filter.value ? "bg-[#76556d]/15 text-[#76556d] dark:text-[#d9b8d0]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {isLoading ? <ConversationSkeleton /> : filteredConversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#76556d]/10 text-[#76556d] dark:text-[#d9b8d0]"><MessageCircleMore className="h-6 w-6" /></span>
            <p className="mt-4 text-sm font-semibold text-foreground">{localQuery ? "No chats found" : "Your conversations live here"}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{localQuery ? "Try a different name or message." : "Start a DM, create a study group, or open a Pod chat."}</p>
          </div>
        ) : (
          <nav className="py-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.$id}
                id={conversation.$id}
                name={conversation.name}
                avatar={conversation.avatar}
                lastMessage={conversation.lastMessage}
                timestamp={conversation.timestamp}
                unreadCount={conversation.unreadCount}
                isSelected={selectedId === conversation.$id}
                isOnline={conversation.isOnline}
                type={conversation.type}
                onClick={() => onSelect(conversation)}
              />
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
