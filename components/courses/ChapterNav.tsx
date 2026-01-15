/**
 * ChapterNav Component
 * 
 * Sidebar navigation for chapters showing:
 * - Chapter list with thumbnails
 * - Completion status
 * - Current chapter highlight
 * - Click to navigate
 */

'use client';

import React from 'react';
import { CourseChapter } from '@/lib/types/courses';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterNavProps {
  chapters: CourseChapter[];
  currentIndex: number;
  onSelect: (index: number) => void;
  completedChapters?: Set<string>;
}

export function ChapterNav({
  chapters,
  currentIndex,
  onSelect,
  completedChapters = new Set(),
}: ChapterNavProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold text-sm text-gray-700 mb-3">Chapters</h3>
      <div className="space-y-2">
        {chapters.map((chapter, idx) => {
          const isCompleted = completedChapters.has(chapter.$id);
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={chapter.$id}
              onClick={() => onSelect(idx)}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-colors text-sm',
                isCurrent
                  ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-0.5">
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {idx + 1}. {chapter.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {chapter.duration} min
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
