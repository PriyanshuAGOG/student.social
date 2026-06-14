"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useCallContext } from "@/components/call/CallProvider";
import { callService, chatService } from "@/lib/appwrite";
import {
  normalizeMessage,
  type StandardizedMessage,
} from "@/lib/message-normalizer";
import { LeftRail } from "@/components/chat/premium/LeftRail";
import { ConversationList } from "@/components/chat/premium/ConversationList";
import { ChatHeader } from "@/components/chat/premium/ChatHeader";
import { MessageGroup } from "@/components/chat/premium/MessageGroup";
import { ChatComposer } from "@/components/chat/premium/ChatComposer";
import { TypingIndicator } from "@/components/chat/premium/TypingIndicator";
import { LiveKitCallStage } from "@/components/call/LiveKitCallStage";
import { profileService } from "@/lib/appwrite";

interface ChatRoom {
  $id: string;
  name?: string;
  type: "direct" | "group" | "pod";
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  participants?: string[];
  podId?: string | null;
}

interface ConversationItem {
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

export default function PremiumChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const callContext = useCallContext();

  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<StandardizedMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [replyingTo, setReplyingTo] = useState<StandardizedMessage | null>(
    null,
  );
  const [leftRailExpanded, setLeftRailExpanded] = useState(false);
  const [showMobileChatList, setShowMobileChatList] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [typingUsers] = useState<string[]>([]);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<
    "all" | "direct" | "group" | "pod"
  >("all");
  const [chatDetailsOpen, setChatDetailsOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [activeCallStage, setActiveCallStage] = useState<{
    sessionId: string;
    mediaType: "voice" | "video";
    title: string;
  } | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatMode, setNewChatMode] = useState<"direct" | "group">("direct");
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Load rooms on mount
  useEffect(() => {
    if (!user?.$id) return;
    loadRooms();
  }, [user?.$id]);

  // Handle room selection from URL
  useEffect(() => {
    const roomId = searchParams.get("room");
    if (roomId && rooms.length > 0) {
      const room = rooms.find((r) => r.$id === roomId);
      if (room) {
        setSelectedRoom(room);
        setShowMobileChatList(false);
      }
    }
  }, [searchParams, rooms]);

  useEffect(() => {
    const call = searchParams.get("call");
    const callType = searchParams.get("callType") === "voice" ? "voice" : "video";
    if (call) {
      setActiveCallStage({
        sessionId: call,
        mediaType: callType,
        title: "PeerSpark room call",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isNewChatOpen || !user?.$id) return;
    let cancelled = false;
    profileService.getAllProfiles(80, 0).then((res: any) => {
      if (cancelled) return;
      setAvailableProfiles((res.documents || []).filter((profile: any) => profile.$id !== user.$id));
    }).catch(() => {
      if (!cancelled) setAvailableProfiles([]);
    });
    return () => {
      cancelled = true;
    };
  }, [isNewChatOpen, user?.$id]);

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoom?.$id) return;
    loadMessages();

    const unsubscribe = chatService.subscribeToMessages(
      selectedRoom.$id,
      (newMsg: any) => {
        const normalized = normalizeMessage(newMsg, user?.$id);
        setMessages((prev) => {
          const exists = prev.some((m) => m.$id === normalized.$id);
          return exists ? prev : [...prev, normalized];
        });
      },
    );

    return () => unsubscribe?.();
  }, [selectedRoom?.$id, user?.$id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRooms = async () => {
    if (!user?.$id) return;
    setIsLoadingRooms(true);
    try {
      const res = await chatService.getUserChatRooms(user.$id);
      // Combine direct and pod rooms
      const allRooms = [...(res.directRooms || []), ...(res.podRooms || [])];
      const normalizedRooms = allRooms.map((room: any) => ({
        $id: room.$id,
        name: room.name || "Unknown",
        type: room.type || "direct",
        avatar: room.avatar,
        lastMessage: room.lastMessage || "",
        lastMessageTime: room.lastMessageTime || "",
        unreadCount: room.unreadCount || 0,
        isOnline: room.isOnline || false,
        participants: room.participants,
        podId: room.podId,
      }));
      setRooms(normalizedRooms);
    } catch (error: any) {
      toast({
        title: "Failed to load conversations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedRoom?.$id) return;
    setIsLoading(true);
    try {
      const res = await chatService.getMessages(selectedRoom.$id, 50);
      const normalized = (res.documents || [])
        .map((msg: any) => normalizeMessage(msg, user?.$id))
        .sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      setMessages(normalized);
    } catch (error: any) {
      toast({
        title: "Failed to load messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRoom || !user?.$id) return;

    setIsLoading(true);
    try {
      const response = await chatService.sendMessage(
        selectedRoom.$id,
        user.$id,
        inputValue.trim(),
        "text",
        { replyTo: replyingTo?.$id },
      );

      const normalized = normalizeMessage(response, user.$id);
      setMessages((prev) => [...prev, normalized]);
      setInputValue("");
      setReplyingTo(null);
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = window.confirm("Delete this message for everyone?");
    if (!confirmed) return;
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.$id !== messageId));
    } catch (error: any) {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user?.$id) return;
    const previousMessages = messages;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.$id !== messageId) return m;
        const reactions = { ...(m.metadata?.reactions || {}) };
        const existingUsers = Array.from(
          new Set((reactions[emoji] || []).filter(Boolean)),
        );
        const nextUsers = existingUsers.includes(user.$id)
          ? existingUsers.filter((id) => id !== user.$id)
          : [...existingUsers, user.$id];
        if (nextUsers.length > 0) reactions[emoji] = nextUsers;
        else delete reactions[emoji];
        return { ...m, metadata: { ...m.metadata, reactions } };
      }),
    );

    try {
      const updated = await chatService.toggleReaction(messageId, emoji);
      setMessages((prev) =>
        prev.map((message) =>
          message.$id === messageId
            ? normalizeMessage(updated, user.$id)
            : message,
        ),
      );
    } catch (error: any) {
      setMessages(previousMessages);
      toast({
        title: "Reaction not saved",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMessage = async (message: StandardizedMessage) => {
    const nextContent = window.prompt("Edit message", message.content);
    if (
      nextContent === null ||
      !nextContent.trim() ||
      nextContent.trim() === message.content
    )
      return;
    try {
      const updated = await chatService.updateMessage(message.$id, "edit", {
        content: nextContent.trim(),
      });
      setMessages((prev) =>
        prev.map((entry) =>
          entry.$id === message.$id
            ? normalizeMessage(updated, user?.$id)
            : entry,
        ),
      );
      toast({ title: "Message updated" });
    } catch (error: any) {
      toast({
        title: "Failed to edit message",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendAttachmentMessage = async (file: File, content = "") => {
    if (!selectedRoom || !user?.$id) return;
    setIsUploadingAttachment(true);
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const attachment = await chatService.uploadAttachment(file, user.$id);
      const type = file.type.startsWith("audio/")
        ? "voice"
        : file.type.startsWith("image/")
          ? "image"
          : "file";
      const response = await chatService.sendMessage(
        selectedRoom.$id,
        user.$id,
        content || (type === "voice" ? "Voice message" : attachment.fileName),
        type as any,
        {
          fileUrl: attachment.fileUrl,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
        },
      );
      setMessages((prev) => [...prev, normalizeMessage(response, user.$id)]);
      toast({
        title: type === "voice" ? "Voice message sent" : "Attachment sent",
        description: attachment.fileName,
      });
      setUploadStatus("");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAttachment(false);
      setUploadStatus("");
    }
  };

  const handleToggleVoiceRecording = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast({
        title: "Voice recording unavailable",
        description: "Your browser does not support in-app audio recording.",
        variant: "destructive",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size > 0) {
          void sendAttachmentMessage(
            new File([blob], `voice-${Date.now()}.webm`, { type: blob.type }),
            "Voice message",
          );
        }
      };
      recorder.start();
      setIsListening(true);
      toast({
        title: "Recording voice message",
        description: "Tap the mic again to send.",
      });
    } catch (error: any) {
      setIsListening(false);
      toast({
        title: "Microphone unavailable",
        description:
          error?.message || "Please allow microphone access and try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartRoomCall = async (mediaType: "voice" | "video") => {
    if (!selectedRoom) return;
    const receiverId =
      selectedRoom.type === "direct"
        ? getDirectCallReceiverId(selectedRoom)
        : null;
    try {
      if (receiverId) {
        await callContext.startCall(
          receiverId,
          selectedRoom.$id,
          mediaType === "voice" ? "audio" : "video",
        );
      } else {
        const session = await callService.startRoomCall(
          selectedRoom.$id,
          mediaType,
        );
        const sessionId = session?.session?.$id || session?.session?.providerSessionId || session?.$id;
        if (sessionId) {
          setActiveCallStage({
            sessionId,
            mediaType,
            title: selectedRoom.name || "PeerSpark room call",
          });
        } else if (session?.joinUrl) {
          window.open(session.joinUrl, "_blank", "noopener,noreferrer");
        }
        toast({
          title: `${mediaType === "video" ? "Video" : "Voice"} room ready`,
          description:
            session?.participantMessage || "Participants were invited to join.",
        });
      }
    } catch (error: any) {
      toast({
        title: `Failed to start ${mediaType} call`,
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDirectCallReceiverId = (room: ChatRoom) => {
    return (
      room.participants?.find(
        (participantId) => participantId && participantId !== user?.$id,
      ) || null
    );
  };

  const handleHeaderSearch = () => {
    setIsMessageSearchOpen((prev) => !prev);
    setTimeout(
      () => document.getElementById("chat-message-search")?.focus(),
      0,
    );
  };

  const visibleMessages = messageSearchQuery.trim()
    ? messages.filter((message) =>
        `${message.content} ${message.authorName || ""} ${message.fileName || ""}`
          .toLowerCase()
          .includes(messageSearchQuery.trim().toLowerCase()),
      )
    : messages;

  const handleHeaderMute = () => {
    toast({
      title: "Conversation muted",
      description:
        "Notification preferences for this chat were updated locally.",
    });
  };

  const handleHeaderDetails = () => {
    if (!selectedRoom) return;
    setChatDetailsOpen((prev) => !prev);
  };

  const openNewChat = () => {
    setIsNewChatOpen(true);
    setSelectedProfileIds([]);
    setGroupName("");
  };

  const toggleSelectedProfile = (profileId: string) => {
    setSelectedProfileIds((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : newChatMode === "direct"
          ? [profileId]
          : [...prev, profileId],
    );
  };

  const createNewChat = async () => {
    if (!user?.$id || selectedProfileIds.length === 0) return;
    setIsCreatingChat(true);
    try {
      const room = newChatMode === "direct"
        ? await chatService.getOrCreateDirectRoom(user.$id, selectedProfileIds[0])
        : await chatService.createGroupRoom(groupName.trim() || "Group chat", selectedProfileIds);
      await loadRooms();
      setSelectedRoom(room);
      setShowMobileChatList(false);
      setIsNewChatOpen(false);
      toast({ title: "Chat ready" });
    } catch (error: any) {
      toast({
        title: "Could not create chat",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const leftRailItems = [
    {
      id: "all",
      label: "All chats",
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
      isActive: conversationFilter === "all",
      onClick: () => setConversationFilter("all"),
    },
    {
      id: "direct",
      label: "DMs",
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
      isActive: conversationFilter === "direct",
      onClick: () => setConversationFilter("direct"),
    },
    {
      id: "groups",
      label: "Groups",
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      isActive: conversationFilter === "group",
      onClick: () => setConversationFilter("group"),
    },
    {
      id: "pods",
      label: "Pods",
      icon: (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm-7 8.18l7 3.5 7-3.5V16l-7 3.5L5 16v-4.82z" />
        </svg>
      ),
      isActive: conversationFilter === "pod",
      onClick: () => setConversationFilter("pod"),
    },
  ];

  const filteredRooms =
    conversationFilter === "all"
      ? rooms
      : rooms.filter((room) => room.type === conversationFilter);

  const conversationItems: ConversationItem[] = filteredRooms.map((room) => ({
    $id: room.$id,
    name: room.name || "Unknown",
    avatar: room.avatar,
    lastMessage: room.lastMessage,
    timestamp: room.lastMessageTime,
    unreadCount: room.unreadCount,
    isOnline: room.isOnline,
    type: room.type,
    participants: room.participants,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background text-foreground">
      {/* Left Rail - Navigation */}
      <LeftRail
        isExpanded={leftRailExpanded}
        onToggle={() => setLeftRailExpanded(!leftRailExpanded)}
        items={leftRailItems}
        userAvatar={user?.email?.[0]?.toUpperCase() || "U"}
        onSettings={() => router.push("/app/settings")}
        onProfile={() => router.push("/app/profile")}
      />

      {/* Conversation List - Desktop visible, Mobile hidden when chat selected */}
      {(showMobileChatList || isDesktop) && (
        <ConversationList
          conversations={conversationItems}
          selectedId={selectedRoom?.$id}
          onSelect={(conv) => {
            const room = rooms.find((r) => r.$id === conv.$id);
            if (room) {
              setSelectedRoom(room);
              setShowMobileChatList(false);
            }
          }}
          isLoading={isLoadingRooms}
          showSearchBox={true}
          onNewChat={openNewChat}
        />
      )}

      {/* Chat Area */}
      {selectedRoom && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background/80">
          {/* Header */}
          <ChatHeader
            title={selectedRoom.name || "Unknown"}
            avatar={selectedRoom.avatar}
            onlineCount={selectedRoom.isOnline ? 1 : 0}
            totalMembers={selectedRoom.participants?.length || 1}
            showBackButton={!isDesktop}
            onBack={() => setShowMobileChatList(true)}
            onCall={() => handleStartRoomCall("voice")}
            onVideoCall={() => handleStartRoomCall("video")}
            onSearchMessages={handleHeaderSearch}
            onMuteConversation={handleHeaderMute}
            onMoreOptions={handleHeaderDetails}
          />

          {isMessageSearchOpen && (
            <div className="border-b border-border bg-card/90 px-6 py-3">
              <div className="relative">
                <input
                  id="chat-message-search"
                  value={messageSearchQuery}
                  onChange={(event) =>
                    setMessageSearchQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setMessageSearchQuery("");
                      setIsMessageSearchOpen(false);
                    }
                  }}
                  placeholder="Search messages in this conversation..."
                  aria-label="Search messages in this conversation"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {messageSearchQuery && (
                  <button
                    type="button"
                    aria-label="Clear message search"
                    onClick={() => setMessageSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    ×
                  </button>
                )}
              </div>
              {messageSearchQuery && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {visibleMessages.length} matching message
                  {visibleMessages.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          )}

          {chatDetailsOpen && selectedRoom && (
            <div className="border-b border-border bg-card/90 px-6 py-4 text-sm text-foreground">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Type
                  </p>
                  <p className="font-medium capitalize">{selectedRoom.type}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Members
                  </p>
                  <p className="font-medium">
                    {selectedRoom.participants?.length || 1}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Calls
                  </p>
                  <p className="font-medium">LiveKit voice/video enabled</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--muted)),transparent_35%)] px-4 py-6 md:px-6 space-y-2">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground text-sm">
                  Loading messages...
                </div>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <svg
                  className="w-16 h-16 mb-4 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm font-medium">
                  {messageSearchQuery
                    ? "No messages match your search"
                    : "Start a conversation"}
                </p>
              </div>
            ) : (
              <>
                <MessageGroup
                  messages={visibleMessages}
                  currentUserId={user?.$id || ""}
                  highlightQuery={messageSearchQuery}
                  onReply={(message: any) => setReplyingTo(message)}
                  onDelete={handleDeleteMessage}
                  onEdit={(message: any) =>
                    handleEditMessage(message as StandardizedMessage)
                  }
                  onReact={handleReact}
                />
                {typingUsers.length > 0 && (
                  <TypingIndicator names={typingUsers} isTyping={true} />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {uploadStatus && (
            <div className="border-t border-border bg-card px-6 py-2 text-xs text-muted-foreground">
              {uploadStatus}
            </div>
          )}

          {/* Composer */}
          <ChatComposer
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            onAttachFile={sendAttachmentMessage}
            onEmoji={(emoji) => setInputValue((prev) => `${prev}${emoji}`)}
            onVoice={handleToggleVoiceRecording}
            isLoading={isLoading || isUploadingAttachment}
            isListening={isListening}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            placeholder="Type a message..."
          />
        </div>
      )}

      {activeCallStage && (
        <LiveKitCallStage
          sessionId={activeCallStage.sessionId}
          mediaType={activeCallStage.mediaType}
          roomTitle={activeCallStage.title}
          onClose={() => {
            setActiveCallStage(null);
            const params = new URLSearchParams(searchParams.toString());
            params.delete("call");
            params.delete("callType");
            const nextQuery = params.toString();
            router.replace(nextQuery ? `/app/chat?${nextQuery}` : "/app/chat", { scroll: false });
          }}
        />
      )}

      {isNewChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Start a new chat"
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Start a new chat
                </h2>
                <p className="text-sm text-muted-foreground">
                  Create a DM or group chat outside pods.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Close new chat dialog"
              >
                ×
              </button>
            </div>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewChatMode("direct");
                  setSelectedProfileIds([]);
                }}
                className={`rounded-full border px-3 py-1 text-sm ${newChatMode === "direct" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                DM
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewChatMode("group");
                  setSelectedProfileIds([]);
                }}
                className={`rounded-full border px-3 py-1 text-sm ${newChatMode === "group" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                Group
              </button>
            </div>
            {newChatMode === "group" && (
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Group name"
                className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-2">
              {availableProfiles.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No people found.
                </p>
              ) : (
                availableProfiles.map((profile) => {
                  const selected = selectedProfileIds.includes(profile.$id);
                  return (
                    <button
                      key={profile.$id}
                      type="button"
                      onClick={() => toggleSelectedProfile(profile.$id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selected ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                      aria-pressed={selected}
                    >
                      <span>
                        <span className="block font-medium">
                          {profile.name ||
                            profile.username ||
                            profile.email ||
                            "PeerSpark user"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {profile.email || profile.username || profile.$id}
                        </span>
                      </span>
                      <span>{selected ? "✓" : "+"}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNewChat}
                disabled={isCreatingChat || selectedProfileIds.length === 0}
                className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreatingChat ? "Creating…" : "Create chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for desktop without room selected */}
      {!selectedRoom && isDesktop && (
        <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
          <svg
            className="w-20 h-20 mb-4 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg font-medium">Select a conversation to start</p>
        </div>
      )}
    </div>
  );
}
