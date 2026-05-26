'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, CheckCircle2, AlertCircle, CheckCircleIcon, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Notification {
  $id: string
  title: string
  body: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  icon?: string
  imageUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  isRead: boolean
  readAt?: string
  expiresAt?: string
  createdAt: string
}

const categoryColors: Record<string, string> = {
  study: 'bg-blue-100 text-blue-800',
  class: 'bg-purple-100 text-purple-800',
  deadline: 'bg-red-100 text-red-800',
  calendar: 'bg-green-100 text-green-800',
  progress: 'bg-cyan-100 text-cyan-800',
  streak: 'bg-orange-100 text-orange-800',
  goal: 'bg-pink-100 text-pink-800',
  habit: 'bg-indigo-100 text-indigo-800',
  social: 'bg-amber-100 text-amber-800',
  system: 'bg-gray-100 text-gray-800',
  security: 'bg-red-100 text-red-800',
  admin: 'bg-slate-100 text-slate-800',
  marketing: 'bg-emerald-100 text-emerald-800',
  reengagement: 'bg-teal-100 text-teal-800',
  digest: 'bg-violet-100 text-violet-800',
}

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.$id) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [user?.$id])

  const loadNotifications = async () => {
    if (!user?.$id) return
    try {
      const response = await fetch('/api/notifications/inbox', {
        headers: {
          'x-user-id': user.$id,
        },
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.$id) return
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user.$id,
        },
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.$id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
      toast.error('Failed to update notification')
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!user?.$id) return
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.$id,
        },
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.$id !== notificationId))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading notifications...</div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={loadNotifications}>
            Refresh
          </Button>
        </div>
        <CardDescription>Stay updated with your learning progress</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[600px] w-full pr-4">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.$id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        notification.isRead
                          ? 'bg-background border-border'
                          : 'bg-blue-50 border-blue-200 dark:bg-slate-900 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={categoryColors[notification.category] || categoryColors.system}
                          >
                            {notification.category}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>

                          {notification.priority === 'critical' && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              Critical
                            </div>
                          )}

                          {notification.ctaUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => {
                                if (!notification.isRead) {
                                  handleMarkAsRead(notification.$id)
                                }
                              }}
                            >
                              <a href={notification.ctaUrl} target="_blank" rel="noopener noreferrer">
                                {notification.ctaLabel || 'View'}
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMarkAsRead(notification.$id)}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(notification.$id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
