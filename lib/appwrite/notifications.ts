import { apiJson } from '@/lib/appwrite/http'

type NotificationDocument = { $id: string; isRead?: boolean; [key: string]: unknown }

/** Canonical in-app notification client. All writes pass through owned API routes. */
export const notificationService = {
  async getUserNotifications(_userId: string, limit = 50, offset = 0) {
    const response = await apiJson<{ data: NotificationDocument[]; total: number }>(
      `/api/notifications/inbox?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`,
    )
    return { documents: response.data || [], total: response.total || 0 }
  },

  async markAsRead(notificationId: string) {
    const response = await apiJson<{ data: NotificationDocument }>(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: 'PATCH' },
    )
    return response.data
  },

  async markAllAsRead(userId: string) {
    const notifications = await this.getUserNotifications(userId, 100)
    await Promise.all(notifications.documents.filter((item) => !item.isRead).map((item) => this.markAsRead(item.$id)))
    return true
  },

  subscribeToNotifications(userId: string, callback: (notification: NotificationDocument) => void) {
    const poll = async () => {
      const result = await this.getUserNotifications(userId, 1).catch(() => null)
      if (result?.documents[0]) callback(result.documents[0])
    }
    const interval = window.setInterval(poll, 10_000)
    return () => window.clearInterval(interval)
  },
}
