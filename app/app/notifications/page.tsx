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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { notificationService, podService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

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
        title: doc.title,
        message: doc.message,
        type: doc.type || "info",
        isRead: doc.isRead || false,
        timestamp: doc.timestamp,
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

  const handleAcceptInvite = async (notification: Notification) => {
    if (!notification.podId) {
      toast({
        title: "Error",
        description: "Invalid pod invitation",
        variant: "destructive",
      })
      return
    }

    try {
      await podService.joinPod(notification.podId)
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
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-3">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Stay updated with your community</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadNotifications(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
              <Check className="mr-2 h-4 w-4" />
              Mark All
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-3">
                    {unreadCount} new
                  </Badge>
                )}
              </h2>
              <p className="text-muted-foreground">Stay updated with your learning community</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => loadNotifications(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        <div className="space-y-4">
          <div className="flex space-x-1 bg-secondary/50 rounded-lg p-1 max-w-fit">
            {[
              { value: "all", label: "All" },
              { value: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
              { value: "action-required", label: "Action Required" },
              { value: "pods", label: "Pods" },
              { value: "social", label: "Social" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
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
                    ? "You're all caught up! No new notifications."
                    : `No ${filter.replace("-", " ")} notifications at the moment.`}
                </p>
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
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.$id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
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
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Pod Notifications</h4>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Session reminders</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Pod invitations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>New resources shared</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Social Notifications</h4>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Comments on posts</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>Likes and reactions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>New followers</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
