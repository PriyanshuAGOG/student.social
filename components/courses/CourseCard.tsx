/**
 * CourseCard Component
 * 
 * Displays a course as a card with:
 * - Thumbnail
 * - Title, description, instructor
 * - Difficulty, rating, enrollment count
 * - Enroll button/status
 */

'use client';

import React from 'react';
import { Course } from '@/lib/types/courses';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => Promise<void>;
  isEnrolled?: boolean;
  loading?: boolean;
}

export function CourseCard({
  course,
  onEnroll,
  isEnrolled = false,
  loading = false,
}: CourseCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
        {course.coverImage && (
          <img
            src={course.coverImage}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-semibold">
          {course.difficulty}
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="text-sm">
          By {course.instructorId.substring(0, 20)}...
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex gap-3 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{course.enrollmentCount} enrolled</span>
          </div>
          {course.avgRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{course.avgRating.toFixed(1)} ({course.totalReviews})</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap mb-3">
          {course.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {course.tags && course.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{course.tags.length - 2} more
            </span>
          )}
        </div>

        {/* Price & Button */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">
            {course.isMonetized ? `$${course.price.toFixed(2)}` : 'Free'}
          </span>
          {isEnrolled ? (
            <Button disabled size="sm" variant="outline">
              Enrolled
            </Button>
          ) : (
            <Button
              onClick={() => onEnroll?.(course.$id)}
              disabled={loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Enrolling...' : 'Enroll'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
