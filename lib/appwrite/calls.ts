import { apiJson } from '@/lib/appwrite/http'

/** Canonical calling client: LiveKit sessions exposed by /api/calls/sessions. */
export const callService = {
  async startRoomCall(roomId: string, mediaType: 'voice' | 'video' = 'video', roomTitle?: string) {
    if (!roomId) throw new Error('Room ID is required')
    const response = await apiJson<any>('/api/calls/sessions', {
      method: 'POST',
      body: JSON.stringify({ roomId, mediaType, roomTitle }),
    })
    const session = response.session || response.data || response
    return {
      ...session,
      joinUrl: session?.joinUrl || response.joinUrl,
      participantMessage: response.participantMessage,
      participants: response.participants,
      invitedParticipants: response.invitedParticipants,
    }
  },

  async updateSession(sessionId: string, action: 'accept' | 'decline' | 'end' | 'join' | 'leave', reason?: string) {
    if (!sessionId) throw new Error('Session ID is required')
    const response = await apiJson<any>(`/api/calls/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    })
    return response.session || response.data || response
  },

  async getSessionToken(sessionId: string) {
    if (!sessionId) throw new Error('Session ID is required')
    return apiJson(`/api/calls/sessions/${encodeURIComponent(sessionId)}/token`, { method: 'POST' })
  },

  async getRoomCallHistory(roomId: string, limit = 20) {
    if (!roomId) throw new Error('Room ID is required')
    const response = await apiJson<any>(`/api/calls/sessions?roomId=${encodeURIComponent(roomId)}&limit=${encodeURIComponent(String(limit))}`)
    return { documents: response.sessions || response.documents || [], total: response.total || 0 }
  },
}
