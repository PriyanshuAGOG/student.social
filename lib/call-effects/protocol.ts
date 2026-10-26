import type { CallReaction } from './gestures'

export const EFFECTS_TOPIC = 'student-social.call-reactions.v1'
const kinds = new Set<CallReaction>(['heart', 'thumbs-up', 'celebrate', 'hand'])
export type ReactionPacket = { v: 1; id: string; kind: CallReaction }
export function encodeReaction(kind: CallReaction, id: string) {
  return new TextEncoder().encode(JSON.stringify({ v: 1, id, kind }))
}
export function decodeReaction(data: Uint8Array): ReactionPacket | null {
  if (data.byteLength > 256) return null
  try {
    const value = JSON.parse(new TextDecoder().decode(data))
    if (value.v !== 1 || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(value.id) || !kinds.has(value.kind)) return null
    return { v: 1, id: value.id, kind: value.kind }
  } catch { return null }
}

/** Sender identity comes from LiveKit, never from a packet payload. */
export class ReactionGate {
  private senders = new Map<string, { at: number; ids: string[] }>()
  accept(sender: string, packet: ReactionPacket, now: number) {
    if (!sender || !Number.isFinite(now)) return false
    const previous = this.senders.get(sender)
    if (previous && (now - previous.at < 1800 || previous.ids.includes(packet.id))) return false
    if (this.senders.size >= 128 && !previous) this.senders.delete(this.senders.keys().next().value!)
    this.senders.set(sender, { at: now, ids: [...(previous?.ids || []), packet.id].slice(-20) })
    return true
  }
  remove(sender: string) { this.senders.delete(sender) }
}
