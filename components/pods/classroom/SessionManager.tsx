/**
 * Session Management Features
 * 
 * Provides timers, break reminders, and session goals tracking for study pods.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Coffee, CheckCircle2, AlertCircle, Play, Pause, RotateCcw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TIMER_PRESETS = [
  { label: "25 min (Pomodoro)", value: 25 * 60 },
  { label: "45 min", value: 45 * 60 },
  { label: "60 min", value: 60 * 60 },
  { label: "90 min", value: 90 * 60 },
  { label: "120 min", value: 120 * 60 },
]

const BREAK_DURATIONS = [
  { label: "5 min", value: 5 * 60 },
  { label: "10 min", value: 10 * 60 },
  { label: "15 min", value: 15 * 60 },
  { label: "30 min", value: 30 * 60 },
]

/**
 * Session Timer Hook
 * Manages study session timing with break tracking
 */
export function useSessionTimer() {
  const [timeRemaining, setTimeRemaining] = useState(25 * 60) // Start with 25 min
  const [isRunning, setIsRunning] = useState(false)
  const [isBreakTime, setIsBreakTime] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [breakReminder, setBreakReminder] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up
          setIsRunning(false)
          setBreakReminder(true)
          
          if (!isBreakTime) {
            setSessionsCompleted((s) => s + 1)
            setIsBreakTime(true)
            setTimeRemaining(5 * 60) // 5 min break by default
          } else {
            setIsBreakTime(false)
            setTimeRemaining(25 * 60) // Back to work
          }

          return 25 * 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isBreakTime])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const setCustomDuration = useCallback((seconds: number) => {
    setTimeRemaining(seconds)
    setIsRunning(false)
  }, [])

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setTimeRemaining(25 * 60)
    setIsRunning(false)
    setIsBreakTime(false)
  }, [])

  return {
    timeRemaining,
    isRunning,
    isBreakTime,
    sessionsCompleted,
    breakReminder,
    formatTime,
    setCustomDuration,
    toggleTimer,
    resetTimer,
    setBreakReminder,
  }
}

/**
 * Session Timer Display Component
 */
export function SessionTimerWidget({
  timeRemaining,
  isRunning,
  isBreakTime,
  sessionsCompleted,
  breakReminder,
  formatTime,
  setCustomDuration,
  toggleTimer,
  resetTimer,
  setBreakReminder,
}: ReturnType<typeof useSessionTimer>) {
  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-600" />
          Study Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className={`text-4xl font-bold font-mono ${isBreakTime ? "text-green-600" : "text-purple-600"}`}>
            {formatTime(timeRemaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isBreakTime ? "Break Time ☕" : "Study Time 📚"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={toggleTimer}
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            size="sm"
            className="px-3"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Preset Selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              Duration: {Math.floor(timeRemaining / 60)} min
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm font-semibold">Study Duration</div>
            {TIMER_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.value}
                onClick={() => setCustomDuration(preset.value)}
                className="text-sm"
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sessions Completed */}
        <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/30 rounded">
          <span className="text-sm text-muted-foreground">Sessions completed</span>
          <span className="font-semibold text-purple-600">{sessionsCompleted}</span>
        </div>

        {/* Break Reminder */}
        {breakReminder && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {isBreakTime ? "Break time!" : "Time to break!"}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                {isBreakTime ? "Get some rest and stay hydrated" : "Take a break before your next session"}
              </p>
              <Button
                onClick={() => setBreakReminder(false)}
                variant="ghost"
                size="sm"
                className="mt-2 h-6 text-xs"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Got it
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Session Goals Tracker
 */
export function SessionGoalsTracker({
  goals = [],
  onAddGoal,
  onCompleteGoal,
}: {
  goals?: { id: string; title: string; completed: boolean }[]
  onAddGoal?: (goal: string) => void
  onCompleteGoal?: (goalId: string) => void
}) {
  const [newGoal, setNewGoal] = useState("")

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          Session Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals set for this session
          </p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onCompleteGoal?.(goal.id)}
                className={`w-full text-left p-2 rounded border text-sm transition-all ${
                  goal.completed
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 line-through text-muted-foreground"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${goal.completed ? "bg-green-500 border-green-500" : "border-gray-300"}`} />
                  {goal.title}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
