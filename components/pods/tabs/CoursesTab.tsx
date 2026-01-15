"use client"

/**
 * CoursesTab Component
 * 
 * Allows pod members to collaboratively generate a course from a YouTube video.
 * Includes notes, assignments, daily tasks, and shared learning materials.
 * Each pod can only have 1 course generation.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Loader2, AlertCircle, FileText, CheckSquare, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CoursesTabProps {
  podId: string
  podName: string
}

interface CourseData {
  $id?: string
  podId: string
  courseTitle: string
  youtubeUrl: string
  status: "generating" | "completed" | "error"
  progress: number
  chapters?: Chapter[]
  notes?: string[]
  assignments?: Assignment[]
  dailyTasks?: DailyTask[]
  createdAt?: string
  createdBy?: string
}

interface Chapter {
  id: string
  title: string
  description: string
  learningObjectives: string[]
  duration: number
}

interface Assignment {
  id: string
  chapterId: string
  title: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  submissionsCount?: number
  averageScore?: number
}

interface DailyTask {
  id: string
  dayNumber: number
  title: string
  description: string
  estimatedTime: number
  resources: string[]
}

export function CoursesTab({ podId, podName }: CoursesTabProps) {
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [courseTitle, setCourseTitle] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // Load existing course for this pod
  useEffect(() => {
    const loadPodCourse = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/pods/get-course?podId=${podId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.course) {
            setCourse(data.course)
          }
        }
      } catch (error) {
        console.error("Error loading pod course:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPodCourse()
  }, [podId])

  const handleGenerateCourse = async () => {
    if (!youtubeUrl.trim() || !courseTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a YouTube URL and course title",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/pods/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          podId,
          youtubeUrl,
          courseTitle,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate course")
      }

      const data = await response.json()
      setCourse(data.course)
      setYoutubeUrl("")
      setCourseTitle("")

      toast({
        title: "Course Generation Started",
        description: "Your pod course is being generated. This may take a few minutes.",
      })
    } catch (error) {
      console.error("Error generating course:", error)
      toast({
        title: "Error Generating Course",
        description: error instanceof Error ? error.message : "Failed to start course generation",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // No course yet
  if (!course) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Create a Course for {podName}
            </CardTitle>
            <CardDescription>
              Generate a comprehensive course from a YouTube video with chapters, notes, assignments, and daily tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ℹ️ Each pod can only have one course. All pod members will have access to the course materials.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Course Title</label>
                <Input
                  placeholder="e.g., Web Development Fundamentals"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="text-sm font-medium">YouTube Video URL</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">What will be generated:</p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                  <li>✓ Chapter-wise course structure from video transcript</li>
                  <li>✓ Detailed notes and learning objectives per chapter</li>
                  <li>✓ Multiple assignments (easy, medium, hard)</li>
                  <li>✓ Daily learning tasks and schedule</li>
                  <li>✓ Progress tracking for all members</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerateCourse}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isGenerating ? "Generating Course..." : "Generate Course"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Course exists - show course content
  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{course.courseTitle}</CardTitle>
              <CardDescription>Created on {new Date(course.createdAt || "").toLocaleDateString()}</CardDescription>
            </div>
            {course.status === "generating" && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generating
              </Badge>
            )}
            {course.status === "completed" && <Badge>Ready</Badge>}
            {course.status === "error" && <Badge variant="destructive">Error</Badge>}
          </div>

          {course.status === "generating" && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Generation Progress: {course.progress}%</p>
              <Progress value={course.progress} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tabs for Course Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="chapters" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Chapters</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-1">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Course Stats</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{course.chapters?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Chapters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{course.assignments?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Assignments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{course.dailyTasks?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Daily Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{course.notes?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Notes</p>
                  </div>
                </div>
              </div>

              {course.status === "generating" && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Your course is being generated. Check back in a few minutes for updates!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chapters Tab */}
        <TabsContent value="chapters" className="space-y-4">
          {course.chapters && course.chapters.length > 0 ? (
            <div className="space-y-3">
              {course.chapters.map((chapter, idx) => (
                <Card key={chapter.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          Chapter {idx + 1}: {chapter.title}
                        </CardTitle>
                        <CardDescription>{chapter.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{chapter.duration} min</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                      <ul className="space-y-1">
                        {chapter.learningObjectives.map((obj, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Chapters will appear here once course generation is complete</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {course.assignments && course.assignments.length > 0 ? (
            <div className="space-y-3">
              {course.assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          assignment.difficulty === "easy"
                            ? "secondary"
                            : assignment.difficulty === "medium"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {assignment.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  {(assignment.submissionsCount !== undefined || assignment.averageScore !== undefined) && (
                    <CardContent className="flex justify-between text-sm text-muted-foreground">
                      <span>{assignment.submissionsCount || 0} submissions</span>
                      <span>{assignment.averageScore || 0}% avg score</span>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Assignments will appear here once course generation is complete</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Daily Tasks Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {course.dailyTasks && course.dailyTasks.length > 0 ? (
            <div className="space-y-3">
              {course.dailyTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">Day {task.dayNumber}: {task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{task.estimatedTime} min</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.resources.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Resources:</p>
                        <ul className="space-y-1">
                          {task.resources.map((resource, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="text-primary">→</span>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Daily tasks will appear here once course generation is complete</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
