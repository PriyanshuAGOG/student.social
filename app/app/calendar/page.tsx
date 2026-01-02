"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, Video, Bell, MoreVertical, Edit, Trash2, Copy, ExternalLink, ArrowLeft, CalendarIcon } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { jitsiService, calendarService } from "@/lib/appwrite"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface CalendarEvent {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  type: "study" | "meeting" | "deadline" | "exam" | "break"
  podId?: string
  podName?: string
  location?: string
  meetingUrl?: string
  attendees: string[]
  isRecurring: boolean
  reminders: number[]
  color: string
}

const eventTypes = [
  { value: "study", label: "Study Session", color: "bg-blue-500" },
  { value: "meeting", label: "Meeting", color: "bg-green-500" },
  { value: "deadline", label: "Deadline", color: "bg-red-500" },
  { value: "exam", label: "Exam", color: "bg-purple-500" },
  { value: "break", label: "Break", color: "bg-yellow-500" },
]

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Mathematics Study Session",
    description: "Calculus practice problems and review",
    startTime: new Date(2024, 11, 15, 14, 0),
    endTime: new Date(2024, 11, 15, 16, 0),
    type: "study",
    podId: "pod_1",
    podName: "Mathematics Study Group",
    location: "Library Room 201",
    attendees: ["user1", "user2", "user3"],
    isRecurring: false,
    reminders: [15, 60],
    color: "bg-blue-500",
  },
  {
    id: "2",
    title: "Computer Science Project Meeting",
    description: "Discuss final project requirements and timeline",
    startTime: new Date(2024, 11, 16, 10, 0),
    endTime: new Date(2024, 11, 16, 11, 30),
    type: "meeting",
    podId: "pod_2",
    podName: "Computer Science Hub",
    meetingUrl: "https://meet.jit.si/peerspark-cs-meeting",
    attendees: ["user1", "user4", "user5"],
    isRecurring: false,
    reminders: [15],
    color: "bg-green-500",
  },
  {
    id: "3",
    title: "Physics Assignment Due",
    description: "Submit quantum mechanics problem set",
    startTime: new Date(2024, 11, 18, 23, 59),
    endTime: new Date(2024, 11, 18, 23, 59),
    type: "deadline",
    attendees: [],
    isRecurring: false,
    reminders: [60, 1440], // 1 hour and 1 day
    color: "bg-red-500",
  },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load events from Appwrite
  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.$id) return
      setIsLoading(true)
      try {
        const result = await calendarService.getUserEvents(user.$id)
        const loaded = (result.documents || []).map((ev: any) => ({
          id: ev.$id,
          title: ev.title || "Untitled",
          description: ev.description || "",
          startTime: new Date(ev.startTime),
          endTime: new Date(ev.endTime || ev.startTime),
          type: ev.type || "study",
          podId: ev.podId,
          podName: ev.podName || "",
          location: ev.location || "",
          meetingUrl: ev.meetingUrl || "",
          attendees: ev.attendees || [],
          isRecurring: ev.isRecurring || false,
          reminders: ev.reminders || [15],
          color: eventTypes.find((t) => t.value === ev.type)?.color || "bg-blue-500",
        }))
        setEvents(loaded)
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadEvents()
  }, [user?.$id])

  // Open create dialog if mode=create or mode=schedule in URL
  useEffect(() => {
    const mode = searchParams?.get("mode")
    if (mode === "create" || mode === "schedule") {
      // Pre-fill with today's date
      const today = new Date()
      const dateStr = today.toISOString().split("T")[0]
      setFormData((prev) => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: "09:00",
        endTime: "10:00",
      }))
      setIsCreateDialogOpen(true)
    }
  }, [searchParams])

  // Form state for creating/editing events
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    type: "study" as CalendarEvent["type"],
    location: "",
    podId: "",
    isRecurring: false,
    reminders: [15],
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleCreateEvent = async () => {
    if (!user?.$id) {
      toast({ title: "Not authenticated", variant: "destructive" })
      return
    }

    // Validate required fields
    if (!formData.title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" })
      return
    }
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      toast({ title: "Please fill in all date and time fields", variant: "destructive" })
      return
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      // Validate dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({ title: "Invalid date or time", variant: "destructive" })
        return
      }

      // Create event in Appwrite
      const created = await calendarService.createEvent(
        user.$id,
        formData.title,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        {
          type: formData.type,
          podId: formData.podId || undefined,
        }
      )

      const newEvent: CalendarEvent = {
        id: created.$id,
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        type: formData.type,
        location: formData.location,
        podId: formData.podId || undefined,
        attendees: [],
        isRecurring: formData.isRecurring,
        reminders: formData.reminders,
        color: eventTypes.find((t) => t.value === formData.type)?.color || "bg-blue-500",
      }

      // If it's a meeting, create Jitsi room
      if (formData.type === "meeting" && formData.podId) {
        const meeting = await jitsiService.createPodMeeting(formData.podId, user.$id, formData.title)
        newEvent.meetingUrl = meeting.url
      }

      setEvents((prev) => [...prev, newEvent])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Event created",
        description: "Your event has been added to the calendar.",
      })
    } catch (error) {
      console.error("Failed to create event:", error)
      toast({
        title: "Failed to create event",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditEvent = async () => {
    if (!selectedEvent) return

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      // Update in Appwrite
      await calendarService.updateEvent(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        type: formData.type,
        location: formData.location,
        isRecurring: formData.isRecurring,
        reminders: formData.reminders,
      })

      const updatedEvent: CalendarEvent = {
        ...selectedEvent,
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        type: formData.type,
        location: formData.location,
        isRecurring: formData.isRecurring,
        reminders: formData.reminders,
        color: eventTypes.find((t) => t.value === formData.type)?.color || "bg-blue-500",
      }

      setEvents((prev) => prev.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)))
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      resetForm()

      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Failed to update event",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Delete from Appwrite
      await calendarService.deleteEvent(eventId)
      
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
      toast({
        title: "Event deleted",
        description: "The event has been removed from your calendar.",
      })
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Failed to delete event",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      type: "study",
      location: "",
      podId: "",
      isRecurring: false,
      reminders: [15],
    })
  }

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startTime.toISOString().split("T")[0],
      startTime: event.startTime.toTimeString().slice(0, 5),
      endDate: event.endTime.toISOString().split("T")[0],
      endTime: event.endTime.toTimeString().slice(0, 5),
      type: event.type,
      location: event.location || "",
      podId: event.podId || "",
      isRecurring: event.isRecurring,
      reminders: event.reminders,
    })
    setIsEditDialogOpen(true)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const days = getDaysInMonth(currentDate)
  const todayEvents = getEventsForDate(new Date())
  const upcomingEvents = events
    .filter((event) => event.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold min-w-[120px] text-center">
              {currentDate.toLocaleDateString([], { month: "short", year: "numeric" })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowMobileSidebar(true)}>
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Add a new event to your calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Event location"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent} disabled={!formData.title || !formData.startDate}>
                    Create Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-48 text-center">
                {currentDate.toLocaleDateString([], { month: "long", year: "numeric" })}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Add a new event to your calendar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Event location"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent} disabled={!formData.title || !formData.startDate}>
                    Create Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Calendar */}
        <div className="flex-1 flex flex-col">
          {/* Calendar Grid */}
          <div className="flex-1 p-2 md:p-4 overflow-auto">
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 min-h-full">
              {/* Day headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={index} className="p-1 md:p-2 text-center font-medium text-muted-foreground border-b text-xs md:text-sm">
                  <span className="md:hidden">{day}</span>
                  <span className="hidden md:inline">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]}</span>
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-1 md:p-2 border border-muted min-h-[60px] md:min-h-[100px]" />
                }

                const dayEvents = getEventsForDate(day)
                const isToday = day.toDateString() === new Date().toDateString()
                const isSelected = day.toDateString() === selectedDate.toDateString()

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-1 md:p-2 border border-muted cursor-pointer hover:bg-muted/50 transition-colors min-h-[60px] md:min-h-[100px] ${
                      isToday ? "bg-primary/10 border-primary" : ""
                    } ${isSelected ? "bg-muted" : ""}`}
                    onClick={() => {
                      setSelectedDate(day)
                      if (isMobile) {
                        setShowMobileSidebar(true)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs md:text-sm ${isToday ? "font-bold text-primary" : ""}`}>{day.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="h-4 w-4 md:h-5 md:w-5 p-0 text-xs">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-0.5 md:p-1 rounded text-white truncate ${event.color}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(event)
                            if (isMobile) {
                              setShowMobileSidebar(true)
                            }
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > (isMobile ? 1 : 2) && (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - (isMobile ? 1 : 2)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 border-l bg-card flex-col">
          {/* Today's Events */}
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Today&apos;s Events</h3>
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${event.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events today</p>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${event.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.startTime.toLocaleDateString()} at {formatTime(event.startTime)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </div>

          {/* Event Details */}
          {selectedEvent && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Event Details</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(selectedEvent)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(selectedEvent.meetingUrl || "")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Meeting Link
                    </DropdownMenuItem>
                    {selectedEvent.meetingUrl && (
                      <DropdownMenuItem onClick={() => window.open(selectedEvent.meetingUrl, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Meeting
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteEvent(selectedEvent.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEvent.color}`} />
                    <h4 className="font-medium">{selectedEvent.title}</h4>
                  </div>
                  {selectedEvent.description && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatDate(selectedEvent.startTime)} at {formatTime(selectedEvent.startTime)} -{" "}
                      {formatTime(selectedEvent.endTime)}
                    </span>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}

                  {selectedEvent.meetingUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => window.open(selectedEvent.meetingUrl, "_blank")}
                      >
                        Join Video Meeting
                      </Button>
                    </div>
                  )}

                  {selectedEvent.podName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.podName}</span>
                    </div>
                  )}

                  {selectedEvent.reminders.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span>Reminders: {selectedEvent.reminders.map((r) => `${r} min`).join(", ")} before</span>
                    </div>
                  )}
                </div>

                {selectedEvent.attendees.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Attendees ({selectedEvent.attendees.length})</h5>
                    <div className="flex -space-x-2">
                      {selectedEvent.attendees.slice(0, 5).map((attendeeId, index) => (
                        <Avatar key={attendeeId} className="h-8 w-8 border-2 border-background">
                          <AvatarImage
                            src={`/placeholder-icon.png?height=32&width=32&text=${index + 1}`}
                          />
                          <AvatarFallback>{index + 1}</AvatarFallback>
                        </Avatar>
                      ))}
                      {selectedEvent.attendees.length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{selectedEvent.attendees.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar/Bottom Sheet */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {selectedEvent ? "Event Details" : formatDate(selectedDate)}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowMobileSidebar(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {selectedEvent ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${selectedEvent.color}`} />
                      <h4 className="font-medium">{selectedEvent.title}</h4>
                    </div>
                    {selectedEvent.description && (
                      <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                      </span>
                    </div>

                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}

                    {selectedEvent.meetingUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => window.open(selectedEvent.meetingUrl, "_blank")}
                        >
                          Join Video Meeting
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedEvent)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium mb-3">Events for {formatDate(selectedDate)}</h4>
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-2">
                      {getEventsForDate(selectedDate).map((event) => (
                        <Card
                          key={event.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${event.color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No events on this day</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Make changes to your event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-type">Event Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={!formData.title || !formData.startDate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
