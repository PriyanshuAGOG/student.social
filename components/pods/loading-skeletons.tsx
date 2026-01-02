/**
 * Loading Skeleton Components
 * 
 * Provides smooth loading states for pods features
 */

"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * Video Conference Skeleton
 */
export function VideoConferenceSkeleton() {
  return (
    <Card className="overflow-hidden bg-gray-900">
      <CardContent className="p-0">
        <div className="w-full aspect-video bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" />
        <div className="p-4 bg-gray-900 flex gap-2 justify-center">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Whiteboard Canvas Skeleton
 */
export function WhiteboardCanvasSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-2">
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  )
}

/**
 * Resource Card Skeleton
 */
export function ResourceCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="w-14 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-48 animate-pulse" />
      </div>
      <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  )
}

/**
 * Participant Card Skeleton
 */
export function ParticipantCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-3 border rounded-lg">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1 animate-pulse" />
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-16 animate-pulse" />
    </div>
  )
}

/**
 * Overview Tab Skeleton
 */
export function OverviewTabSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between mb-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Card */}
        <Card>
          <CardHeader>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 border rounded-lg">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-48 animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Page Level Skeleton
 */
export function PodDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-20 animate-pulse" />
        ))}
      </div>

      {/* Content */}
      <OverviewTabSkeleton />
    </div>
  )
}
