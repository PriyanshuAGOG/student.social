/**
 * CoursePlayer Component
 * 
 * Main course learning interface with:
 * - Chapter video player area
 * - Chapter navigation
 * - Expandable notes panel
 * - Assignment submission area
 * - Progress tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CourseChapter, Course } from '@/lib/types/courses';
import { ChapterNav } from '@/components/courses/ChapterNav';
import { NotesPanel } from '@/components/courses/NotesPanel';
import { AssignmentPanel } from '@/components/courses/AssignmentPanel';
import { ProgressBar } from '@/components/courses/ProgressBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface CoursePlayerProps {
  course: Course;
  chapters: CourseChapter[];
  currentChapterIndex: number;
  onChapterChange: (index: number) => void;
  userProgress?: {
    completionPercentage: number;
    chaptersCompleted: number;
  };
  loading?: boolean;
}

export function CoursePlayer({
  course,
  chapters,
  currentChapterIndex,
  onChapterChange,
  userProgress = { completionPercentage: 0, chaptersCompleted: 0 },
  loading = false,
}: CoursePlayerProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'assignment'>('video');
  const currentChapter = chapters[currentChapterIndex];

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      onChapterChange(currentChapterIndex - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      onChapterChange(currentChapterIndex + 1);
    }
  };

  if (!currentChapter) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Chapter not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-gray-600 text-sm">
              Chapter {currentChapterIndex + 1} of {chapters.length}
            </p>
            <ProgressBar
              completed={userProgress.chaptersCompleted}
              total={chapters.length}
              percentage={userProgress.completionPercentage}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Chapter Title */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">{currentChapter.title}</h2>
              <p className="text-gray-700 text-lg">{currentChapter.description}</p>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'video' | 'assignment')}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="video" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Lecture
                </TabsTrigger>
                <TabsTrigger value="assignment" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Assignment
                </TabsTrigger>
              </TabsList>

              {/* Video Tab */}
              <TabsContent value="video" className="space-y-4">
                {/* Video Player Placeholder */}
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-0 h-0 border-l-12 border-r-0 border-t-8 border-b-8 border-l-white border-r-transparent border-t-transparent border-b-transparent ml-2" />
                    </div>
                    <p>Video Player</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {currentChapter.duration} min
                    </p>
                  </div>
                </div>

                {/* Learning Objectives */}
                {currentChapter.learningObjectives &&
                  currentChapter.learningObjectives.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Learning Objectives
                      </h3>
                      <ul className="space-y-1">
                        {currentChapter.learningObjectives.map(
                          (obj, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-blue-800 flex items-start gap-2"
                            >
                              <span className="text-blue-600 font-bold">
                                ✓
                              </span>
                              {obj}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assignment">
                <AssignmentPanel
                  chapterId={currentChapter.$id}
                  courseId={course.$id}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t p-4 flex items-center justify-between">
          <Button
            onClick={handlePrevChapter}
            disabled={currentChapterIndex === 0 || loading}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            {currentChapterIndex + 1} / {chapters.length}
          </span>

          <Button
            onClick={handleNextChapter}
            disabled={currentChapterIndex === chapters.length - 1 || loading}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar - Chapter Navigation + Notes */}
      <div className="w-80 bg-white border-l flex flex-col">
        {/* Toggle Notes Button */}
        <div className="p-3 border-b">
          <Button
            onClick={() => setNotesOpen(!notesOpen)}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {notesOpen ? 'Hide Notes' : 'Show Notes'}
          </Button>
        </div>

        {/* Notes Panel */}
        {notesOpen && (
          <div className="flex-1 overflow-auto border-b">
            <NotesPanel
              chapterId={currentChapter.$id}
              chapterTitle={currentChapter.title}
            />
          </div>
        )}

        {/* Chapter Navigation */}
        <div className="flex-1 overflow-auto">
          <ChapterNav
            chapters={chapters}
            currentIndex={currentChapterIndex}
            onSelect={onChapterChange}
          />
        </div>
      </div>
    </div>
  );
}
