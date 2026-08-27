let activeRoomId = ''

export function setActiveChatRoom(roomId: string) {
  activeRoomId = roomId
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('student-social:active-chat', { detail: { roomId } }))
  }
}

export function getActiveChatRoom(): string {
  return activeRoomId
}
