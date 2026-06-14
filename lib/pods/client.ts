"use client"

import type { PodBundle, PodCheckin, PodDocument, PodMessage, PodResource, PodTaskSubmission } from "./types"

async function json<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.error || payload?.message || `Request failed with ${response.status}`
    throw new Error(message)
  }
  return (payload?.data ?? payload) as T
}

async function multipart<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    body: formData,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.error || payload?.message || `Request failed with ${response.status}`
    throw new Error(message)
  }
  return (payload?.data ?? payload) as T
}

export const pod2Api = {
  listPods(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params)
    return json<{ pods: PodDocument[]; myPods: PodDocument[] }>(`/api/pods2${query.size ? `?${query}` : ""}`)
  },
  getBundle(podId: string) {
    return json<PodBundle>(`/api/pods2/${encodeURIComponent(podId)}/bundle`)
  },
  createPod(input: Record<string, unknown>) {
    return json<{ pod: PodDocument }>(`/api/pods2`, { method: "POST", body: JSON.stringify(input) })
  },
  updatePod(podId: string, input: Record<string, unknown>) {
    return json<{ pod: PodDocument }>(`/api/pods2/${encodeURIComponent(podId)}`, { method: "PATCH", body: JSON.stringify(input) })
  },
  joinPod(podId: string) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/join`, { method: "POST" })
  },
  createRoadmap(podId: string, input: Record<string, unknown>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/roadmap`, { method: "POST", body: JSON.stringify(input) })
  },
  createTask(podId: string, input: Record<string, unknown>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/tasks`, { method: "POST", body: JSON.stringify(input) })
  },
  submitTask(podId: string, taskId: string, input: Partial<PodTaskSubmission>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/tasks/${encodeURIComponent(taskId)}/submit`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  },
  createSession(podId: string, input: Record<string, unknown>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/sessions`, { method: "POST", body: JSON.stringify(input) })
  },
  createResource(podId: string, input: Partial<PodResource>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/resources`, { method: "POST", body: JSON.stringify(input) })
  },
  uploadResource(podId: string, formData: FormData) {
    return multipart<{ resource: PodResource; file: { fileId: string; fileUrl: string; fileName: string; fileSize: number; fileType: string } }>(`/api/pods2/${encodeURIComponent(podId)}/resources/upload`, formData)
  },
  uploadChatAttachment(podId: string, formData: FormData) {
    return multipart<{ attachment: { fileId: string; fileUrl: string; fileName: string; fileSize: number; fileType: string } }>(`/api/pods2/${encodeURIComponent(podId)}/chat-attachments/upload`, formData)
  },
  getSessionToken(podId: string, sessionId: string, displayName?: string) {
    return json<{ token: { token: string; url: string; identity: string; roomName: string }; roomName: string; meetingUrl: string }>(`/api/pods2/${encodeURIComponent(podId)}/sessions/${encodeURIComponent(sessionId)}/token`, {
      method: "POST",
      body: JSON.stringify({ displayName }),
    })
  },
  createCheckin(podId: string, input: Partial<PodCheckin>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/checkins`, { method: "POST", body: JSON.stringify(input) })
  },
  sendMessage(podId: string, channelId: string, input: Partial<PodMessage>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/channels/${encodeURIComponent(channelId)}/messages`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  },
  updateMessage(podId: string, messageId: string, input: Partial<PodMessage>) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/messages/${encodeURIComponent(messageId)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  },
  deleteMessage(podId: string, messageId: string) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/messages/${encodeURIComponent(messageId)}`, { method: "DELETE" })
  },
  toggleReaction(podId: string, messageId: string, emoji: string) {
    return json(`/api/pods2/${encodeURIComponent(podId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    })
  },
  getInvite(inviteCode: string) {
    return json<{ invite: any; pod: PodDocument }>(`/api/pods2/invites/${encodeURIComponent(inviteCode)}`)
  },
  acceptInvite(inviteCode: string) {
    return json<{ pod: PodDocument; membership: any }>(`/api/pods2/invites/${encodeURIComponent(inviteCode)}/accept`, { method: "POST" })
  },
  runAutomationJobs() {
    return json(`/api/pods2/jobs/run`, { method: "POST" })
  },
}
