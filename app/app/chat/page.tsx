"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useCallContext } from "@/components/call/CallProvider";
import { chatService, profileService } from "@/lib/appwrite";
import {
  normalizeMessage,
  type StandardizedMessage,
} from "@/lib/message-normalizer";
import { ConversationList } from "@/components/chat/premium/ConversationList";
import { ChatHeader } from "@/components/chat/premium/ChatHeader";
import { MessageGroup } from "@/components/chat/premium/MessageGroup";
import { ChatComposer } from "@/components/chat/premium/ChatComposer";
import { TypingIndicator } from "@/components/chat/premium/TypingIndicator";
import { MessageReceiptDetails } from "@/components/chat/premium/MessageReceiptDetails";
import { createOutboxMessage, useChatOutbox } from "@/hooks/use-chat-outbox";
import { useChatPresence } from "@/hooks/use-chat-presence";
import { deriveDeliveryState, mergeReceipt, receiptAudience } from "@/lib/chat-receipts";
import { setActiveChatRoom } from "@/lib/chat-runtime";
import { Check, MessageCircleMore, Plus, UserRound, UsersRound, X } from "lucide-react";

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

function roomParticipants(room: any): string[] {
  for (const value of [room?.members, room?.participants, room?.memberIds]) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        // Continue to the next canonical or legacy member field.
      }
    }
  }
  return [];
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

interface ChatProfile {
  $id: string;
  name?: string;
  username?: string;
  email?: string;
}

interface RoomMemberProfile {
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
}

const MESSAGE_CACHE_TTL_MS = 2 * 60 * 1000;
const messageCache = new Map<string, { messages: StandardizedMessage[]; cachedAt: number }>();
const RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

function preferredRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function voiceFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function mergeMessages(current: StandardizedMessage[], incoming: StandardizedMessage[]): StandardizedMessage[] {
  const byId = new Map<string, StandardizedMessage>();
  for (const message of [...current, ...incoming]) {
    const key = message.clientMessageId || message.$id;
    byId.set(key, { ...(byId.get(key) || {}), ...message } as StandardizedMessage);
  }
  return Array.from(byId.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
  const [showMobileChatList, setShowMobileChatList] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<
    "all" | "direct" | "group" | "pod"
  >("all");
  const [chatDetailsOpen, setChatDetailsOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatMode, setNewChatMode] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<ChatProfile[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [roomMemberProfiles, setRoomMemberProfiles] = useState<RoomMemberProfile[]>([]);
  const [receiptMessage, setReceiptMessage] = useState<StandardizedMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const activeRoomIdRef = useRef<string>("");
  const deepLinkedUserRef = useRef<string>("");
  const deepLinkedPodRef = useRef<string>("");
  const deepLinkedPodRequestRef = useRef<string>("");
  const deepLinkRequestRef = useRef<{ targetUserId: string; promise: Promise<[any, any]> } | null>(null);
  activeRoomIdRef.current = selectedRoom?.$id || "";
  const outbox = useChatOutbox(selectedRoom?.$id || "");
  const chatPresence = useChatPresence(selectedRoom?.$id || "", user?.$id);
  const typingUsers = useMemo(() => {
    const namesById = new Map(roomMemberProfiles.map((member) => [member.userId, member.name || member.username || ""]))
    return Array.from(new Set(chatPresence.otherTypingEntries.map((entry) => {
      const userId = entry.userId || ""
      const resolvedName = namesById.get(userId)
      if (resolvedName) return resolvedName
      if (selectedRoom?.type === "direct" && selectedRoom.name && !/^(student|direct messages?|dm)$/i.test(selectedRoom.name.trim())) {
        return selectedRoom.name
      }
      return "Someone"
    })))
  }, [chatPresence.otherTypingEntries, roomMemberProfiles, selectedRoom?.name, selectedRoom?.type]);

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== "inactive") recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    if (!isListening) return;
    const startedAt = Date.now();
    setRecordingSeconds(0);
    const timer = window.setInterval(() => setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [isListening]);

  useEffect(() => {
    const queued = outbox.outboxMessages.find((message) => message.deliveryState === "queued");
    if (!queued || !user?.$id || typeof navigator === "undefined" || !navigator.onLine) return;
    outbox.markMessageSending(queued.clientMessageId);
    setMessages((prev) => prev.map((message: any) =>
      message.clientMessageId === queued.clientMessageId || message.$id === queued.clientMessageId
        ? { ...message, deliveryState: "sending" }
        : message,
    ));
    void chatService.sendMessage(queued.roomId, user.$id, queued.content, queued.type as any, {
      replyTo: queued.replyTo,
      fileUrl: queued.fileUrl || undefined,
      fileName: queued.fileName || undefined,
      fileSize: queued.fileSize || undefined,
      clientMessageId: queued.clientMessageId,
    }).then((response) => {
      const normalized = normalizeMessage(response, user.$id);
      if (activeRoomIdRef.current === queued.roomId) {
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((message: any) => message.clientMessageId !== queued.clientMessageId && message.$id !== queued.clientMessageId);
          return withoutOptimistic.some((message) => message.$id === normalized.$id) ? withoutOptimistic : [...withoutOptimistic, normalized];
        });
      }
      outbox.removeMessage(queued.clientMessageId);
    }).catch((error: any) => {
      outbox.markMessageFailed(queued.clientMessageId, error?.message);
      if (activeRoomIdRef.current === queued.roomId) {
        setMessages((prev) => prev.map((message: any) =>
          message.clientMessageId === queued.clientMessageId || message.$id === queued.clientMessageId
            ? { ...message, deliveryState: "failed" }
            : message,
        ));
      }
    });
  }, [outbox.outboxMessages, selectedRoom?.$id, user?.$id]);

  useEffect(() => {
    const retry = () => outbox.retryFailedMessages();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [selectedRoom?.$id]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const focused = !isDesktop && Boolean(selectedRoom) && !showMobileChatList;
    window.dispatchEvent(new CustomEvent("student:chat-focus", { detail: { focused } }));
    return () => {
      window.dispatchEvent(new CustomEvent("student:chat-focus", { detail: { focused: false } }));
    };
  }, [isDesktop, selectedRoom?.$id, showMobileChatList]);

  // Load rooms on mount
  useEffect(() => {
    if (!user?.$id) return;
    void loadRooms();
  }, [user?.$id]);

  useEffect(() => {
    if (!user?.$id) return;
    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void loadRooms(true), 180);
    };
    const unsubscribe = chatService.subscribeToChatRooms(user.$id, scheduleRefresh);
    window.addEventListener('student-social:notifications-changed', scheduleRefresh);
    return () => {
      window.clearTimeout(refreshTimer);
      unsubscribe?.();
      window.removeEventListener('student-social:notifications-changed', scheduleRefresh);
    };
  }, [user?.$id]);

  // Canonical entry point for profile -> message links. Resolve the user to a
  // direct room here so every DM uses this page's realtime/outbox/call stack.
  useEffect(() => {
    const targetUserId = searchParams.get("user");
    if (!user?.$id || !targetUserId || targetUserId === user.$id || deepLinkedUserRef.current === targetUserId) return;
    let cancelled = false;

    const existingRequest = deepLinkRequestRef.current;
    const request = existingRequest?.targetUserId === targetUserId
      ? existingRequest
      : {
          targetUserId,
          promise: Promise.all([
            chatService.getOrCreateDirectRoom(user.$id, targetUserId),
            profileService.getProfile(targetUserId).catch(() => null),
          ]) as Promise<[any, any]>,
        };
    deepLinkRequestRef.current = request;

    void request.promise.then(([room, targetProfile]) => {
      if (cancelled) return;
      deepLinkedUserRef.current = targetUserId;
      const normalizedRoom: ChatRoom = {
        $id: room.$id,
        name: targetProfile?.name || targetProfile?.username || room.name || "Direct message",
        type: "direct",
        avatar: targetProfile?.avatar || room.avatar,
        lastMessage: room.lastMessage || "",
        lastMessageTime: room.lastMessageTime || "",
        unreadCount: room.unreadCount || 0,
        isOnline: room.isOnline || false,
        participants: roomParticipants(room).length > 0 ? roomParticipants(room) : [user.$id, targetUserId],
      };
      setRooms((current) => current.some((entry) => entry.$id === normalizedRoom.$id) ? current : [normalizedRoom, ...current]);
      setSelectedRoom(normalizedRoom);
      setShowMobileChatList(false);
      const next = new URLSearchParams(searchParams.toString());
      next.set("room", normalizedRoom.$id);
      router.replace(`/app/chat?${next.toString()}`, { scroll: false });
    }).catch((error: any) => {
      if (cancelled) return;
      if (deepLinkRequestRef.current === request) deepLinkRequestRef.current = null;
      toast({ title: "Failed to open conversation", description: error?.message || "Please try again.", variant: "destructive" });
    });

    return () => { cancelled = true; };
  }, [router, searchParams, toast, user?.$id]);

  // Pod links resolve to the same canonical room shown under the Pods chat filter.
  useEffect(() => {
    const podId = searchParams.get("pod");
    const podName = searchParams.get("name") || "Pod";
    if (!user?.$id || !podId || deepLinkedPodRef.current === podId || deepLinkedPodRequestRef.current === podId) return;
    let cancelled = false;

    const existingRoom = rooms.find((room) => room.type === "pod" && room.podId === podId);
    if (existingRoom) {
      const namedRoom = { ...existingRoom, name: podName || existingRoom.name || "Pod chat" };
      deepLinkedPodRef.current = podId;
      setRooms((current) => current.map((room) => room.$id === namedRoom.$id ? namedRoom : room));
      setSelectedRoom(namedRoom);
      setShowMobileChatList(false);
      const next = new URLSearchParams(searchParams.toString());
      next.set("room", namedRoom.$id);
      router.replace(`/app/chat?${next.toString()}`, { scroll: false });
      return;
    }

    deepLinkedPodRequestRef.current = podId;
    void chatService.getOrCreatePodRoom(podId, podName).then((room: any) => {
      if (deepLinkedPodRequestRef.current === podId) deepLinkedPodRequestRef.current = "";
      if (cancelled) return;
      const normalizedRoom: ChatRoom = {
        $id: room.$id,
        name: podName,
        type: "pod",
        avatar: room.avatar,
        lastMessage: room.lastMessage || "",
        lastMessageTime: room.lastMessageTime || "",
        unreadCount: room.unreadCount || 0,
        participants: roomParticipants(room),
        podId,
      };
      deepLinkedPodRef.current = podId;
      setRooms((current) => current.some((entry) => entry.$id === normalizedRoom.$id) ? current.map((entry) => entry.$id === normalizedRoom.$id ? normalizedRoom : entry) : [normalizedRoom, ...current]);
      setSelectedRoom(normalizedRoom);
      setShowMobileChatList(false);
      const next = new URLSearchParams(searchParams.toString());
      next.set("room", normalizedRoom.$id);
      router.replace(`/app/chat?${next.toString()}`, { scroll: false });
    }).catch((error: any) => {
      deepLinkedPodRequestRef.current = "";
      if (!cancelled) toast({ title: "Could not open pod chat", description: error?.message || "Please try again.", variant: "destructive" });
    });

    return () => { cancelled = true; };
  }, [rooms, router, searchParams, toast, user?.$id]);

  useEffect(() => {
    if (!isNewChatOpen || !user?.$id) return;
    let cancelled = false;

    const loadProfiles = async () => {
      try {
        const res = await profileService.getAllProfiles(100, 0);
        if (cancelled) return;
        setAvailableProfiles(
          (res.documents || []).filter((profile: ChatProfile) => profile.$id !== user.$id),
        );
      } catch (error: any) {
        toast({
          title: "Could not load people",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    };

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [isNewChatOpen, toast, user?.$id]);

  // Handle room selection from URL
  useEffect(() => {
    const roomId = searchParams.get("room");
    if (roomId && rooms.length > 0) {
      if (selectedRoom?.$id === roomId) return;
      const room = rooms.find((r) => r.$id === roomId);
      if (room) {
        setSelectedRoom(room);
        setShowMobileChatList(false);
      }
    }
  }, [searchParams, rooms, selectedRoom?.$id]);

  // Load messages when room changes
  useEffect(() => {
    if (!selectedRoom?.$id) return;
    const roomId = selectedRoom.$id;
    setActiveChatRoom(roomId);
    const cacheKey = `${user?.$id || "anonymous"}:${roomId}`;
    const cached = messageCache.get(cacheKey);
    const hasFreshCache = Boolean(cached && Date.now() - cached.cachedAt < MESSAGE_CACHE_TTL_MS);
    setMessages(hasFreshCache ? cached!.messages : []);
    setIsLoading(!hasFreshCache);

    const unsubscribe = chatService.subscribeToMessages(
      roomId,
      (newMsg: any) => {
        const normalized = normalizeMessage(newMsg, user?.$id);
        setMessages((prev) => {
          const next = mergeMessages(prev, [normalized]);
          messageCache.set(cacheKey, { messages: next, cachedAt: Date.now() });
          return next;
        });
        if (user?.$id && normalized.authorId !== user.$id && document.visibilityState === 'visible') {
          void chatService.markRoomMessages(roomId, [normalized.$id], "read").catch(() => undefined);
        }
      },
    );

    const unsubscribeReceipts = chatService.subscribeToReceipts(roomId, (receipt: any) => {
      if (!receipt?.messageId || !receipt?.userId || (!receipt?.deliveredAt && !receipt?.readAt)) return;
      setMessages((prev) => {
        const next = prev.map((message) => {
          if (message.$id !== receipt.messageId) return message;
          const receipts = mergeReceipt(message.receipts || [], receipt);
          const audience = receiptAudience(receipts);
          return {
            ...message,
            receipts,
            deliveredBy: audience.deliveredBy,
            readBy: Array.from(new Set([...(message.readBy || []), ...audience.readBy])),
            deliveryState: deriveDeliveryState(receipts, message.deliveryState),
          };
        });
        messageCache.set(cacheKey, { messages: next, cachedAt: Date.now() });
        return next;
      });
    });

    void loadMessages(roomId);
    const recover = () => void loadMessages(roomId, { silent: true });
    const interval = window.setInterval(recover, 3000);
    window.addEventListener('focus', recover);
    window.addEventListener('online', recover);
    document.addEventListener('visibilitychange', recover);

    return () => {
      setActiveChatRoom('');
      unsubscribe?.();
      unsubscribeReceipts?.();
      window.clearInterval(interval);
      window.removeEventListener('focus', recover);
      window.removeEventListener('online', recover);
      document.removeEventListener('visibilitychange', recover);
    };
  }, [selectedRoom?.$id, user?.$id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRooms = async (silent = false) => {
    if (!user?.$id) return;
    if (!silent) setIsLoadingRooms(true);
    try {
      const [res, podsResponse] = await Promise.all([
        chatService.getUserChatRooms(user.$id),
        fetch("/api/pods2").then((response) => response.ok ? response.json() : {}).catch(() => ({})),
      ]);
      const podsPayload = podsResponse as any;
      const podDocuments = podsPayload.data?.pods || podsPayload.pods || [];
      const podNames = new Map(podDocuments.map((pod: any) => [String(pod.$id || pod.id), String(pod.name || "Pod")]));
      // Combine direct and pod rooms
      const allRooms = [...(res.directRooms || []), ...(res.podRooms || [])];
      const normalizedRooms = allRooms.map((room: any) => {
        const type = room.type === "dm" ? "direct" : room.type || "direct";
        const directPeer = room.otherUser || room.peer || room.recipient;
        const roomName = String(room.name || "");
        const genericDirectName = !roomName || /^(direct message|direct messages|dm|unknown)$/i.test(roomName.trim());
        const resolvedPodName = type === "pod" ? podNames.get(String(room.podId || "")) : "";
        return {
          $id: room.$id,
          name: type === "direct" && (directPeer?.name || directPeer?.username)
            ? directPeer.name || directPeer.username
            : genericDirectName && type === "direct" ? "Student" : resolvedPodName || roomName || "Study chat",
          type,
          avatar: type === "direct" ? directPeer?.avatar || room.avatar : room.avatar,
          lastMessage: room.lastMessage || "",
          lastMessageTime: room.lastMessageTime || "",
          unreadCount: room.unreadCount || 0,
          isOnline: type === "direct" ? directPeer?.isOnline || room.isOnline || false : room.isOnline || false,
          participants: roomParticipants(room),
          podId: room.podId,
        } as ChatRoom;
      });
      setRooms(normalizedRooms);
    } catch (error: any) {
      if (!silent) {
        toast({
          title: "Failed to load conversations",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setIsLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId: string, options: { silent?: boolean } = {}) => {
    if (!roomId) return;
    const cacheKey = `${user?.$id || "anonymous"}:${roomId}`;
    try {
      const res = await chatService.getMessages(roomId, 50);
      if (Array.isArray(res.members)) setRoomMemberProfiles(res.members);
      const normalized = (res.documents || [])
        .map((msg: any) => normalizeMessage(msg, user?.$id))
        .sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      if (activeRoomIdRef.current !== roomId) return;
      setMessages((current) => {
        const next = mergeMessages(current, normalized);
        messageCache.set(cacheKey, { messages: next, cachedAt: Date.now() });
        return next;
      });
      const unreadIds = normalized
        .filter((message: any) => message.authorId !== user?.$id && !(message.readBy || []).includes(user?.$id))
        .map((message: any) => message.$id);
      if (unreadIds.length > 0) {
        void chatService.markRoomMessages(roomId, unreadIds, "read").catch(() => undefined);
      }
    } catch (error: any) {
      if (!options.silent) {
        toast({
          title: "Failed to load messages",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (activeRoomIdRef.current === roomId) setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRoom || !user?.$id) return;
    const optimistic = createOutboxMessage({
      roomId: selectedRoom.$id,
      authorId: user.$id,
      authorName: user.name || "You",
      content: inputValue.trim(),
      replyTo: replyingTo?.$id,
      replyToMessage: replyingTo,
      deliveryState: navigator.onLine ? "queued" : "queued",
    });
    outbox.queueMessage(optimistic);
    setMessages((prev) => [...prev, normalizeMessage(optimistic, user.$id)]);
    setInputValue("");
    setReplyingTo(null);
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
      const attachment = await chatService.uploadAttachment(file, user.$id, selectedRoom.$id);
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
          fileId: attachment.fileId,
          fileType: attachment.fileType,
        },
      );
      setMessages((prev) => [...prev, normalizeMessage(response, user.$id)]);
      toast({
        title: type === "voice" ? "Voice message sent" : "Attachment sent",
        description: attachment.fileName,
      });
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
      discardRecordingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioChunksRef.current = [];
      const mimeType = preferredRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setIsListening(false);
        toast({ title: "Recording stopped", description: "The browser could not continue recording. Please try again.", variant: "destructive" });
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setIsListening(false);
        setRecordingSeconds(0);
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!discardRecordingRef.current && blob.size > 0) {
          const extension = voiceFileExtension(blob.type);
          void sendAttachmentMessage(
            new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type || "audio/webm" }),
            "Voice message",
          );
        }
      };
      recorder.start(750);
      setIsListening(true);
      toast({
        title: "Recording voice message",
        description: "Tap send when you are ready, or discard it without posting.",
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

  const handleCancelVoiceRecording = () => {
    discardRecordingRef.current = true;
    mediaRecorderRef.current?.stop();
    setIsListening(false);
    setRecordingSeconds(0);
  };

  const handleStartRoomCall = async (mediaType: "voice" | "video") => {
    if (!selectedRoom) return;
    const receiverId =
      selectedRoom.type === "direct"
        ? getDirectCallReceiverId(selectedRoom)
        : null;
    try {
      // All direct, group, pod, and classroom calls are owned by CallProvider.
      // Keeping one stage prevents duplicate LiveKit clients joining a room with
      // the same identity when the durable active-call poll catches up.
      await callContext.startCall(
        receiverId || "room",
        selectedRoom.$id,
        mediaType === "voice" ? "audio" : "video",
        { title: selectedRoom.name || (selectedRoom.type === "pod" ? "Pod study call" : "Student.social call") },
      );
      toast({
        title: `${mediaType === "video" ? "Video" : "Voice"} call placed`,
        description: selectedRoom.type === "direct" ? "Ringing now…" : "Everyone in the room is being invited.",
      });
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
    setSelectedProfileIds([]);
    setGroupName("");
    setNewChatMode("direct");
    setIsNewChatOpen(true);
  };

  const toggleSelectedProfile = (profileId: string) => {
    setSelectedProfileIds((prev) => {
      if (newChatMode === "direct") {
        return prev.includes(profileId) ? [] : [profileId];
      }
      return prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId];
    });
  };

  const createNewChat = async () => {
    if (!user?.$id || selectedProfileIds.length === 0) return;
    setIsCreatingChat(true);
    try {
      const room =
        newChatMode === "direct"
          ? await chatService.getOrCreateDirectRoom(user.$id, selectedProfileIds[0])
          : await chatService.createGroupRoom(
              groupName.trim() || "New group",
              Array.from(new Set([user.$id, ...selectedProfileIds])),
            );

      const normalizedRoom: ChatRoom = {
        $id: room.$id,
        name: newChatMode === "direct"
          ? availableProfiles.find((profile) => profile.$id === selectedProfileIds[0])?.name || availableProfiles.find((profile) => profile.$id === selectedProfileIds[0])?.username || room.otherUser?.name || "Student"
          : room.name || groupName.trim() || "New group",
        type: room.type || newChatMode,
        avatar: newChatMode === "direct" ? room.otherUser?.avatar || room.avatar : room.avatar,
        lastMessage: room.lastMessage || "",
        lastMessageTime: room.lastMessageTime || "",
        unreadCount: room.unreadCount || 0,
        isOnline: room.isOnline || false,
        participants: room.participants || room.memberIds || [user.$id, ...selectedProfileIds],
        podId: room.podId,
      };

      setRooms((prev) => {
        const exists = prev.some((item) => item.$id === normalizedRoom.$id);
        return exists
          ? prev.map((item) => (item.$id === normalizedRoom.$id ? { ...item, ...normalizedRoom } : item))
          : [normalizedRoom, ...prev];
      });
      setSelectedRoom(normalizedRoom);
      setShowMobileChatList(false);
      setIsNewChatOpen(false);
      toast({ title: "Chat ready", description: normalizedRoom.name });
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
    <div className="peer-chat-shell flex overflow-hidden bg-background text-foreground">
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
          activeFilter={conversationFilter}
          onFilterChange={setConversationFilter}
        />
      )}

      {/* Chat Area */}
      {selectedRoom && (!showMobileChatList || isDesktop) && (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
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
            <div className="border-b border-border/45 bg-card/92 px-3 py-3 backdrop-blur-xl md:px-5">
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
                  className="h-10 w-full rounded-full border border-border/55 bg-background px-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/10"
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
            <div className="border-b border-border/45 bg-card/92 px-4 py-4 text-sm text-foreground backdrop-blur-xl md:px-6">
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
                  <p className="font-medium">Encrypted voice & video</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="peer-chat-canvas flex-1 space-y-2 overflow-y-auto px-2.5 py-4 sm:px-4 md:px-7 md:py-5">
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
                  onShowReceiptDetails={(message: any) => setReceiptMessage(message as StandardizedMessage)}
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
            onChange={(value) => {
              setInputValue(value);
              chatPresence.setTyping(Boolean(value.trim()));
            }}
            onSend={handleSendMessage}
            onAttachFile={sendAttachmentMessage}
            onEmoji={(emoji) => setInputValue((prev) => `${prev}${emoji}`)}
            onVoice={handleToggleVoiceRecording}
            // History can hydrate in the background; messaging and recording
            // should be available immediately after the room opens.
            isLoading={isUploadingAttachment}
            isListening={isListening}
            recordingSeconds={recordingSeconds}
            onCancelVoice={handleCancelVoiceRecording}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            placeholder="Type a message..."
          />
        </div>
      )}

      {isNewChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Start a new chat"
        >
          <div className="w-full max-w-lg rounded-t-[28px] border border-border/60 bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">New conversation</h2>
                <p className="mt-1 text-sm text-muted-foreground">Message a peer or bring a study group together.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close new chat dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted/65 p-1">
              <button
                type="button"
                onClick={() => {
                  setNewChatMode("direct");
                  setSelectedProfileIds([]);
                }}
                className={newChatMode === "direct" ? "flex items-center justify-center gap-2 rounded-full bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm" : "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground"}
              >
                <UserRound className="h-4 w-4" /> Direct
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewChatMode("group");
                  setSelectedProfileIds([]);
                }}
                className={newChatMode === "group" ? "flex items-center justify-center gap-2 rounded-full bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm" : "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground"}
              >
                <UsersRound className="h-4 w-4" /> Group
              </button>
            </div>
            {newChatMode === "group" && (
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Study group name"
                className="mb-4 h-11 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            )}
            <div className="max-h-[42dvh] space-y-1 overflow-y-auto rounded-2xl border border-border/55 bg-background p-1.5 sm:max-h-72">
              {availableProfiles.length === 0 ? (
                <div className="grid place-items-center px-6 py-10 text-center"><MessageCircleMore className="h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">No peers found</p><p className="mt-1 text-xs text-muted-foreground">Invite someone to Student.social to start learning together.</p></div>
              ) : (
                availableProfiles.map((profile) => {
                  const selected = selectedProfileIds.includes(profile.$id);
                  const profileName = profile.name || profile.username || "Student.social learner";
                  return (
                    <button
                      key={profile.$id}
                      type="button"
                      onClick={() => toggleSelectedProfile(profile.$id)}
                      className={selected ? "flex w-full items-center justify-between rounded-xl bg-[#76556d]/10 px-3 py-2.5 text-left text-sm text-[#76556d] transition dark:text-[#d9b8d0]" : "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted"}
                      aria-pressed={selected}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#76556d]/15 text-xs font-semibold text-[#76556d] dark:text-[#d9b8d0]">{profileName.charAt(0).toUpperCase()}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{profileName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{profile.username || "Student.social learner"}</span>
                        </span>
                      </span>
                      <span className={selected ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground" : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"}>{selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="h-11 rounded-full px-5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNewChat}
                disabled={isCreatingChat || selectedProfileIds.length === 0}
                className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreatingChat ? "Creating…" : "Create chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for desktop without room selected */}
      {!selectedRoom && isDesktop && (
        <div className="peer-chat-canvas flex flex-1 flex-col items-center justify-center px-8 text-center text-muted-foreground">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border/45 bg-card/80 text-[#76556d] shadow-sm backdrop-blur dark:text-[#d9b8d0]"><MessageCircleMore className="h-7 w-7" /></span>
          <p className="mt-5 text-xl font-semibold tracking-[-0.025em] text-foreground">Choose a conversation</p>
          <p className="mt-2 max-w-sm text-sm leading-6">Message a peer, plan with your group, or jump into a Pod study session.</p>
        </div>
      )}
      <MessageReceiptDetails
        open={Boolean(receiptMessage)}
        onOpenChange={(open) => { if (!open) setReceiptMessage(null); }}
        message={receiptMessage}
        members={roomMemberProfiles}
        currentUserId={user?.$id || ""}
      />
    </div>
  );
}
