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
  status: "generating" | "structuring" | "completed" | "error"
  progress: number
  chapters?: Chapter[]
  notes?: string[]
  assignments?: Assignment[]
  dailyTasks?: DailyTask[]
  createdAt?: string
  createdBy?: string
}

interface Chapter {
  id?: string
  chapterNumber?: number
  title: string
  description: string
  objectives?: string[]
  learningObjectives?: string[]
  estimatedMinutes?: number
  duration?: number
  locked: boolean
  contentGenerated: boolean
  content?: string
  keyPoints?: string[]
  assignments?: Assignment[]
  notes?: string[]
  resources?: string[]
  error?: string
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
            // Parse JSON fields from strings
            const parsedCourse = {
              ...data.course,
              chapters: typeof data.course.chapters === 'string' ? JSON.parse(data.course.chapters || '[]') : data.course.chapters,
              assignments: typeof data.course.assignments === 'string' ? JSON.parse(data.course.assignments || '[]') : data.course.assignments,
              dailyTasks: typeof data.course.dailyTasks === 'string' ? JSON.parse(data.course.dailyTasks || '[]') : data.course.dailyTasks,
              notes: typeof data.course.notes === 'string' ? JSON.parse(data.course.notes || '[]') : data.course.notes,
            }
            setCourse(parsedCourse)
          }
        }
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
      const response = await fetch("/api/pods/generate-course-streaming", {
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
      // Parse JSON fields from strings
      const parsedCourse = {
        ...data.course,
        chapters: Array.isArray(data.course.chapters) 
          ? data.course.chapters 
          : typeof data.course.chapters === 'string' 
            ? JSON.parse(data.course.chapters || '[]') 
            : [],
        assignments: typeof data.course.assignments === 'string' ? JSON.parse(data.course.assignments || '[]') : data.course.assignments || [],
        dailyTasks: typeof data.course.dailyTasks === 'string' ? JSON.parse(data.course.dailyTasks || '[]') : data.course.dailyTasks || [],
        notes: typeof data.course.notes === 'string' ? JSON.parse(data.course.notes || '[]') : data.course.notes || [],
      }
      setCourse(parsedCourse)
      setYoutubeUrl("")
      setCourseTitle("")

      toast({
        title: "Course Structure Created",
        description: "Chapter stubs are ready! Content is being generated in the background. Check back soon!",
      })

      // Start polling for updates
      pollCourseProgress(data.course.$id)
    } catch (error) {
      toast({
        title: "Error Generating Course",
        description: error instanceof Error ? error.message : "Failed to start course generation",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Poll for course updates
  const pollCourseProgress = async (courseId: string) => {
    const maxAttempts = 60 // 5 minutes
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) return

      try {
        const response = await fetch(`/api/pods/get-course?podId=${podId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.course) {
            const parsedCourse = {
              ...data.course,
              chapters: typeof data.course.chapters === 'string' ? JSON.parse(data.course.chapters || '[]') : data.course.chapters,
            }
            setCourse(parsedCourse)

            if (parsedCourse.status === 'error') {
              toast({
                title: "Course Generation Failed",
                description: "There was an error generating the course. Please try again.",
                variant: "destructive",
              })
              return
            }

            if (parsedCourse.status !== 'completed') {
              attempts++
              setTimeout(poll, 5000) // Poll every 5 seconds
            } else {
              toast({
                title: "Course Ready!",
                description: "Your course has been fully generated. Start learning!",
              })
            }
          }
        }
      } catch (error) {
        console.error("Poll error:", error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    poll()
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
                  <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                    Generating course content: {course.progress || 0}% complete
                  </p>
                  <Progress value={course.progress || 0} className="h-2" />
                </div>
              )}

              {course.status === "structuring" && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    ✓ Course structure created! Chapter content is being generated in the background.
                  </p>
                </div>
              )}

              {course.status === "error" && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-900 dark:text-red-100">
                    ⚠️ Course generation failed. Please try again or contact support.
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
              {course.chapters.map((chapter, idx) => {
                const isLocked = chapter.locked
                const isGenerating = !chapter.contentGenerated
                
                return (
                  <Card 
                    key={chapter.chapterNumber || idx} 
                    className={`transition-all ${isLocked ? 'opacity-60' : 'hover:shadow-md'}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              Chapter {chapter.chapterNumber || idx + 1}: {chapter.title}
                            </CardTitle>
                            {isLocked && (
                              <Badge variant="secondary" className="ml-auto">
                                🔒 Locked
                              </Badge>
                            )}
                            {isGenerating && !isLocked && (
                              <Badge variant="outline" className="ml-auto">
                                ⏳ Generating...
                              </Badge>
                            )}
                            {!isLocked && !isGenerating && (
                              <Badge variant="default" className="ml-auto">
                                ✓ Ready
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{chapter.description}</CardDescription>
                          {chapter.objectives && chapter.objectives.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {chapter.objectives.join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{chapter.estimatedMinutes || 15} min</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {!isLocked && chapter.content && (
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Content</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chapter.content}</p>
                        </div>
                        
                        {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Points</h4>
                            <ul className="space-y-1">
                              {chapter.keyPoints.map((point, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {chapter.resources && chapter.resources.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Resources</h4>
                            <ul className="space-y-1">
                              {chapter.resources.map((resource, i) => (
                                <li key={i} className="text-sm">
                                  <a href={resource} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {resource}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    )}

                    {isLocked && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-4">
                          📚 Complete the previous chapter to unlock this content
                        </p>
                      </CardContent>
                    )}

                    {isGenerating && !isLocked && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating chapter content...
                        </p>
                      </CardContent>
                    )}

                    {chapter.error && (
                      <CardContent>
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded p-2">
                          ⚠️ Error generating content: {chapter.error}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Chapters will appear here once course generation starts</p>
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
