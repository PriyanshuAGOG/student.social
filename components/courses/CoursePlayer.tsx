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

  const getEmbedUrl = () => {
    const source = course.youtubeLink;
    if (!source) return null;

    try {
      const url = new URL(source);
      const videoId =
        url.hostname.includes('youtu.be')
          ? url.pathname.replace('/', '')
          : url.searchParams.get('v');

      if (!videoId) return null;

      const start = Number(currentChapter?.videoStartTime || 0);
      const end = Number(currentChapter?.videoEndTime || 0);
      const params = new URLSearchParams({
        start: String(Math.max(0, start)),
      });
      if (end > start) params.set('end', String(end));
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    } catch {
      return null;
    }
  };

  const embedUrl = getEmbedUrl();

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
                {embedUrl ? (
                  <div className="rounded-lg overflow-hidden border bg-black aspect-video">
                    <iframe
                      src={embedUrl}
                      title={`${course.title} - ${currentChapter.title}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">Lecture Content</h3>
                      <p className="text-sm text-gray-500">
                        {currentChapter.duration} min · {currentChapter.contentType}
                      </p>
                    </div>
                    <div className="prose max-w-none text-sm whitespace-pre-wrap">
                      {currentChapter.transcriptCleaned || currentChapter.transcript || currentChapter.description}
                    </div>
                  </div>
                )}

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
              chapterData={currentChapter}
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
