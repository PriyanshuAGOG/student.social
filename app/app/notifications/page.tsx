"use client"

import { useState } from "react"
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
  Settings,
  MoreHorizontal,
  Clock,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const NOTIFICATIONS = [
  {
    id: "1",
    type: "pod-invite",
    title: "Pod Invitation",
    message: "Arjun Patel invited you to join 'Advanced DSA Bootcamp'",
    timestamp: "2 minutes ago",
    read: false,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: true,
    podName: "Advanced DSA Bootcamp",
  },
  {
    id: "2",
    type: "session-reminder",
    title: "Session Starting Soon",
    message: "Biology Study Group starts in 15 minutes",
    timestamp: "15 minutes ago",
    read: false,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: true,
    podName: "NEET Biology Squad",
  },
  {
    id: "3",
    type: "achievement",
    title: "Achievement Unlocked!",
    message: "You earned the 'Study Streak Master' badge for maintaining a 15-day streak",
    timestamp: "1 hour ago",
    read: false,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: false,
  },
  {
    id: "4",
    type: "comment",
    title: "New Comment",
    message: "Riya Sharma commented on your post about dynamic programming",
    timestamp: "2 hours ago",
    read: true,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: false,
  },
  {
    id: "5",
    type: "resource-shared",
    title: "Resource Shared",
    message: "New notes on 'React Hooks' shared in Design Thinking Hub",
    timestamp: "4 hours ago",
    read: true,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: false,
    podName: "Design Thinking Hub",
  },
  {
    id: "6",
    type: "like",
    title: "Post Liked",
    message: "Priya Gupta and 12 others liked your study progress post",
    timestamp: "6 hours ago",
    read: true,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: false,
  },
  {
    id: "7",
    type: "streak-warning",
    title: "Streak Alert",
    message: "Don't break your 15-day streak! Study for at least 30 minutes today",
    timestamp: "1 day ago",
    read: true,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: true,
  },
  {
    id: "8",
    type: "pod-update",
    title: "Pod Update",
    message: "DSA Masters pod schedule has been updated for next week",
    timestamp: "2 days ago",
    read: true,
    avatar: "/placeholder.svg?height=32&width=32",
    actionRequired: false,
    podName: "DSA Masters",
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [filter, setFilter] = useState("all")
  const { toast } = useToast()

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    toast({
      title: "Marked as read",
      description: "Notification has been marked as read",
    })
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    toast({
      title: "All notifications marked as read",
      description: "All your notifications have been marked as read",
    })
  }

  const handleAcceptInvite = (podName: string) => {
    toast({
      title: "Invitation Accepted",
      description: `You've joined ${podName}!`,
    })
  }

  const handleDeclineInvite = (podName: string) => {
    toast({
      title: "Invitation Declined",
      description: `You've declined the invitation to ${podName}`,
    })
  }

  const handleJoinSession = (podName: string) => {
    toast({
      title: "Joining Session",
      description: `Connecting you to ${podName} session...`,
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "pod-invite":
        return <UserPlus className="w-5 h-5 text-blue-500" />
      case "session-reminder":
        return <Calendar className="w-5 h-5 text-accent" />
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case "comment":
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case "resource-shared":
        return <BookOpen className="w-5 h-5 text-purple-500" />
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />
      case "streak-warning":
        return <Zap className="w-5 h-5 text-accent" />
      case "pod-update":
        return <Users className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    switch (filter) {
      case "unread":
        return !notif.read
      case "action-required":
        return notif.actionRequired
      case "pods":
        return ["pod-invite", "session-reminder", "pod-update"].includes(notif.type)
      case "social":
        return ["comment", "like", "resource-shared"].includes(notif.type)
      default:
        return true
    }
  })

  const unreadCount = notifications.filter((n) => !n.read).length

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
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark All
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
              <Settings className="h-4 w-4" />
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
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
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
                  key={notification.id}
                  className={`transition-colors hover:bg-secondary/50 ${
                    !notification.read ? "border-primary/20 bg-primary/5" : ""
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
                              {!notification.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{notification.timestamp}</span>
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
                            {!notification.read && (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
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
                            {notification.type === "pod-invite" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={() => handleAcceptInvite(notification.podName!)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineInvite(notification.podName!)}
                                  className="bg-transparent"
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {notification.type === "session-reminder" && (
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => handleJoinSession(notification.podName!)}
                              >
                                Join Session
                              </Button>
                            )}
                            {notification.type === "streak-warning" && (
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
