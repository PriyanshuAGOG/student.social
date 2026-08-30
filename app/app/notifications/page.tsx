// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  Check,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Trophy,
  Heart,
  UserPlus,
  MoreHorizontal,
  Clock,
  Zap,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { podService } from "@/lib/appwrite"
import { notificationService } from "@/lib/appwrite/notifications"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AppPageHeader } from "@/components/internal/AppPageHeader"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Notification {
  $id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  timestamp: string
  actionUrl?: string
  actionText?: string
  imageUrl?: string
  podId?: string
  podName?: string
  actionRequired?: boolean
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (!Number.isFinite(date.getTime())) return "Recently"
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  } catch {
    return dateString
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [preferenceState, setPreferenceState] = useState({
    sessionReminders: true,
    podInvites: true,
    newResources: true,
    comments: true,
    likes: true,
    followers: false,
  })
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Load notifications from database
  const loadNotifications = useCallback(async (showRefreshState = false) => {
    if (!user?.$id) return

    if (showRefreshState) {
      setIsRefreshing(true)
    }

    try {
      const result = await notificationService.getUserNotifications(user.$id, 100)
      
      // Transform notifications to match expected format
      const transformedNotifications = result.documents.map((doc: any) => ({
        $id: doc.$id,
        userId: doc.userId,
        title: doc.title || "Student.social update",
        message: doc.message || doc.body || "You have a new update.",
        type: doc.type || "info",
        isRead: doc.isRead || false,
        timestamp: doc.timestamp || doc.createdAt || new Date().toISOString(),
        actionUrl: doc.actionUrl,
        actionText: doc.actionText,
        imageUrl: doc.imageUrl,
        podId: doc.podId,
        podName: doc.podName,
        actionRequired: ["pod_invite", "pod-invite", "session_reminder", "session-reminder", "streak_warning", "streak-warning"].includes(doc.type),
      }))

      setNotifications(transformedNotifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [user, toast])

  useEffect(() => {
    if (!authLoading && user) {
      loadNotifications()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, loadNotifications, router])

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.$id) return
      try {
        const response = await fetch('/api/notifications/preferences', {
          headers: {
            'x-user-id': user.$id,
          },
        })
        const data = await response.json()
        if (data?.data) {
          setPreferenceState({
            sessionReminders: data.data.calendarPush !== false,
            podInvites: data.data.socialPush !== false,
            newResources: data.data.studyPush !== false,
            comments: data.data.socialEmail !== false,
            likes: data.data.socialPush !== false,
            followers: data.data.marketingEmail === true,
          })
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error)
      }
    }

    loadPreferences()
  }, [user?.$id])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((notif) => (notif.$id === id ? { ...notif, isRead: true } : notif)))
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read",
      })
    } catch (error) {
      console.error("Failed to mark as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.$id) return

    try {
      await notificationService.markAllAsRead(user.$id)
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
      toast({
        title: "All notifications marked as read",
        description: "All your notifications have been marked as read",
      })
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((current) => current.filter((notification) => notification.$id !== id))
      toast({ title: "Notification removed" })
    } catch (error) {
      console.error("Failed to delete notification:", error)
      toast({ title: "Notification was not removed", description: "Please try again.", variant: "destructive" })
    }
  }

  const handleClearRead = async () => {
    try {
      const deleted = await notificationService.clearRead()
      setNotifications((current) => current.filter((notification) => !notification.isRead))
      toast({ title: deleted ? `${deleted} read notification${deleted === 1 ? "" : "s"} cleared` : "Nothing to clear" })
    } catch (error) {
      console.error("Failed to clear read notifications:", error)
      toast({ title: "Notifications were not cleared", description: "Please try again.", variant: "destructive" })
    }
  }

  const handleAcceptInvite = async (notification: Notification) => {
    if (!notification.podId || !user?.$id) {
      toast({
        title: "Error",
        description: "Invalid pod invitation",
        variant: "destructive",
      })
      return
    }

    try {
      const email =
        typeof user.email === "string"
          ? user.email
          : typeof (user.prefs as Record<string, unknown> | undefined)?.email === "string"
            ? ((user.prefs as Record<string, unknown>).email as string)
            : undefined

      await podService.joinPod(notification.podId, user.$id, email)
      await handleMarkAsRead(notification.$id)
      toast({
        title: "Invitation Accepted",
        description: `You've joined ${notification.podName || "the pod"}!`,
      })
      router.push(`/app/pods/${notification.podId}`)
    } catch (error: any) {
      console.error("Failed to accept invite:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join pod",
        variant: "destructive",
      })
    }
  }

  const handleDeclineInvite = async (notification: Notification) => {
    await handleMarkAsRead(notification.$id)
    toast({
      title: "Invitation Declined",
      description: `You've declined the invitation to ${notification.podName || "the pod"}`,
    })
  }

  const handleJoinSession = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.podId) {
      router.push(`/app/pods/${notification.podId}`)
    }
    toast({
      title: "Joining Session",
      description: `Connecting you to ${notification.podName || "the"} session...`,
    })
  }

  const handleSavePreferences = async () => {
    if (!user?.$id) return
    setIsSavingPreferences(true)
    try {
      const payload = {
        calendarPush: preferenceState.sessionReminders,
        socialPush: preferenceState.podInvites || preferenceState.likes,
        studyPush: preferenceState.newResources,
        socialEmail: preferenceState.comments,
        marketingEmail: preferenceState.followers,
      }

      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.$id,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast({
        title: "Preferences Saved",
        description: "Your notification settings have been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "pod-invite":
      case "pod_invite":
        return <UserPlus className="w-5 h-5 text-blue-500" />
      case "session-reminder":
      case "session_reminder":
        return <Calendar className="w-5 h-5 text-accent" />
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case "comment":
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case "resource-shared":
      case "resource_shared":
        return <BookOpen className="w-5 h-5 text-purple-500" />
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />
      case "streak-warning":
      case "streak_warning":
        return <Zap className="w-5 h-5 text-accent" />
      case "pod-update":
      case "pod_update":
      case "pod_join":
        return <Users className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    switch (filter) {
      case "unread":
        return !notif.isRead
      case "action-required":
        return notif.actionRequired
      case "pods":
        return ["pod-invite", "pod_invite", "session-reminder", "session_reminder", "pod-update", "pod_update", "pod_join"].includes(notif.type)
      case "social":
        return ["comment", "like", "resource-shared", "resource_shared"].includes(notif.type)
      default:
        return true
    }
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const tabCounts = {
    all: notifications.length,
    unread: unreadCount,
    "action-required": notifications.filter((n) => n.actionRequired).length,
    pods: notifications.filter((n) => ["pod-invite", "pod_invite", "session-reminder", "session_reminder", "pod-update", "pod_update", "pod_join"].includes(n.type)).length,
    social: notifications.filter((n) => ["comment", "like", "resource-shared", "resource_shared"].includes(n.type)).length,
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-4 md:px-8 md:pt-6">
        <AppPageHeader
          title="Notifications"
          meta={<span>{unreadCount} unread</span>}
          actions={<><Button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}><Check />Mark all read</Button><Button variant="outline" onClick={handleClearRead} disabled={!notifications.some((item) => item.isRead)}><Trash2 />Clear read</Button><Button variant="outline" onClick={() => loadNotifications(true)} disabled={isRefreshing}><RefreshCw className={isRefreshing ? "animate-spin" : ""} />Refresh</Button></>}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        <div className="space-y-4">
          <div className="student-notification-filters grid w-full grid-cols-5 gap-1 rounded-2xl bg-secondary/50 p-1" role="tablist" aria-label="Notification filters">
            {[
              { value: "all", label: "All", count: tabCounts.all },
              { value: "unread", label: "Unread", count: tabCounts.unread },
              { value: "action-required", label: "Action Required", count: tabCounts["action-required"] },
              { value: "pods", label: "Pods", count: tabCounts.pods },
              { value: "social", label: "Social", count: tabCounts.social },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={`min-w-0 rounded-xl px-2 py-2 text-sm font-medium transition-all ${
                  filter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <Badge variant={tab.count > 0 ? "secondary" : "outline"} className="ml-2 h-5 min-w-5 justify-center px-1 text-[10px]">
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
                  {filter === "all"
                    ? "You're all caught up! No new notifications. Invite podmates, schedule sessions, or adjust preferences below to control what you receive."
                    : `No ${filter.replace("-", " ")} notifications at the moment.`}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => document.getElementById("notification-preferences")?.scrollIntoView({ behavior: "smooth" })}>
                  Review preferences
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.$id}
                  className={`transition-colors hover:bg-secondary/50 ${
                    !notification.isRead ? "border-primary/20 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm">{notification.title}</h4>
                              {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatRelativeTime(notification.timestamp)}</span>
                              {notification.podName && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {notification.podName}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.$id)} aria-label={`Mark ${notification.title} as read`}>
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" aria-label={`Open actions for ${notification.title}`}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.isRead ? <DropdownMenuItem onClick={() => handleMarkAsRead(notification.$id)}><Check className="mr-2 h-4 w-4" />Mark as read</DropdownMenuItem> : null}
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(notification.$id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {notification.actionRequired && (
                          <div className="flex items-center space-x-2 mt-3">
                            {(notification.type === "pod-invite" || notification.type === "pod_invite") && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => handleAcceptInvite(notification)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineInvite(notification)}
                                  className="bg-transparent"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {(notification.type === "session-reminder" || notification.type === "session_reminder") && (
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => handleJoinSession(notification)}
                              >
                                Join Session
                              </Button>
                            )}
                            {(notification.type === "streak-warning" || notification.type === "streak_warning") && (
                              <Button size="sm" className="bg-accent hover:bg-accent/90">
                                Start Studying
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Notification Settings */}
          <Card className="mt-6">
            <CardHeader id="notification-preferences">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Pod Notifications</h4>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.sessionReminders} onChange={(e) => setPreferenceState(prev => ({ ...prev, sessionReminders: e.target.checked }))} className="rounded" />
                      <span>Session reminders</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.podInvites} onChange={(e) => setPreferenceState(prev => ({ ...prev, podInvites: e.target.checked }))} className="rounded" />
                      <span>Pod invitations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.newResources} onChange={(e) => setPreferenceState(prev => ({ ...prev, newResources: e.target.checked }))} className="rounded" />
                      <span>New resources shared</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Social Notifications</h4>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.comments} onChange={(e) => setPreferenceState(prev => ({ ...prev, comments: e.target.checked }))} className="rounded" />
                      <span>Comments on posts</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.likes} onChange={(e) => setPreferenceState(prev => ({ ...prev, likes: e.target.checked }))} className="rounded" />
                      <span>Likes and reactions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={preferenceState.followers} onChange={(e) => setPreferenceState(prev => ({ ...prev, followers: e.target.checked }))} className="rounded" />
                      <span>New followers</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button className="bg-primary hover:bg-primary/90" onClick={handleSavePreferences} disabled={isSavingPreferences}>
                  {isSavingPreferences ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
