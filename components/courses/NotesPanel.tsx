/**
 * NotesPanel Component
 * 
 * Displays AI-generated notes and study materials:
 * - Summary
 * - Key concepts with definitions
 * - Formulas and code snippets
 * - Real-world applications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CourseContent } from '@/lib/types/courses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Lightbulb, BookmarkIcon, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface NotesPanelProps {
  chapterId: string;
  chapterTitle: string;
}

export function NotesPanel({ chapterId, chapterTitle }: NotesPanelProps) {
  const [content, setContent] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, [chapterId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      // In real app, would fetch from API
      // const response = await fetch(`/api/courses/content/${chapterId}`);
      // const data = await response.json();
      // setContent(data);

      // Mock data for now
      setContent({
        $id: chapterId,
        chapterId,
        summaries: [
          'This chapter covers the fundamentals of the topic.',
          'We explore key concepts and practical applications.',
        ],
        keyTakeaways: [
          'Understand core principles',
          'Apply to real-world scenarios',
          'Build practical skills',
        ],
        detailedNotes: '# Chapter Notes\n\n## Overview\n\nKey details here.',
        concepts: [
          {
            name: 'Core Concept 1',
            definition: 'Definition of the core concept',
            importance: 'critical',
          },
          {
            name: 'Core Concept 2',
            definition: 'Definition of second concept',
            importance: 'important',
          },
        ],
        formulas: ['Formula 1 = x + y', 'Formula 2 = a * b'],
        realWorldApplications: [
          'Application in industry',
          'Practical use cases',
        ],
        generatedAt: new Date().toISOString(),
        llmModel: 'mistral-7b',
        promptHash: 'abc123',
      });
      setError(null);
    } catch (err) {
      setError('Failed to load notes');
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({
      description: 'Copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No notes available for this chapter</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadContent}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
        <TabsTrigger
          value="summary"
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-500"
        >
          Summary
        </TabsTrigger>
        <TabsTrigger
          value="concepts"
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-500"
        >
          Concepts
        </TabsTrigger>
        <TabsTrigger
          value="formulas"
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-500"
        >
          Formulas
        </TabsTrigger>
        <TabsTrigger
          value="applications"
          className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-blue-500"
        >
          Applications
        </TabsTrigger>
      </TabsList>

      {/* Summary Tab */}
      <TabsContent value="summary" className="p-4 space-y-3">
        {content.summaries?.map((summary, idx) => (
          <Card key={idx} className="p-3 bg-blue-50 border-blue-200">
            <p className="text-sm text-gray-700">{summary}</p>
          </Card>
        ))}

        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Takeaways
            </h4>
            <ul className="space-y-1">
              {content.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-600">•</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}
      </TabsContent>

      {/* Concepts Tab */}
      <TabsContent value="concepts" className="p-4 space-y-2">
        {content.concepts?.map((concept, idx) => (
          <Card key={idx} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{concept.name}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {concept.definition}
                </p>
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {concept.importance}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(concept.definition, `concept-${idx}`)}
              >
                {copied === `concept-${idx}` ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </TabsContent>

      {/* Formulas Tab */}
      <TabsContent value="formulas" className="p-4 space-y-2">
        {content.formulas && content.formulas.length > 0 ? (
          content.formulas.map((formula, idx) => (
            <Card key={idx} className="p-3 bg-gray-50 font-mono text-sm">
              <div className="flex items-center justify-between">
                <code>{formula}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formula, `formula-${idx}`)}
                >
                  {copied === `formula-${idx}` ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No formulas for this chapter
          </p>
        )}
      </TabsContent>

      {/* Applications Tab */}
      <TabsContent value="applications" className="p-4 space-y-2">
        {content.realWorldApplications && content.realWorldApplications.length > 0 ? (
          content.realWorldApplications.map((app, idx) => (
            <Card key={idx} className="p-3 bg-green-50 border-green-200">
              <p className="text-sm text-gray-700">💡 {app}</p>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No applications listed
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
