/**
 * AssignmentPanel Component
 * 
 * Allows students to:
 * - View assignment details
 * - Submit answers/files
 * - See grade and feedback
 * - Revise submissions
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssignmentPanelProps {
  chapterId: string;
  courseId: string;
}

export function AssignmentPanel({
  chapterId,
  courseId,
}: AssignmentPanelProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [grade, setGrade] = useState<any | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast({
        description: 'Please enter your answer',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: 'assignment-1', // Would come from props
          courseId,
          chapterId,
          userId: 'current-user', // Would come from auth
          submissionText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);
        toast({
          description: 'Assignment submitted! Your response is being graded.',
        });

        // Simulate grading delay
        setTimeout(() => {
          setGrade({
            score: 85,
            feedback:
              'Great response! You showed good understanding of the concepts.',
            confidence: 0.92,
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (grade) {
    return (
      <div className="space-y-4">
        {/* Grade Card */}
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900">Graded</h4>
              <div className="mt-2">
                <div className="text-3xl font-bold text-green-600">
                  {grade.score}%
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback */}
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Feedback</h4>
          <p className="text-sm text-gray-700">{grade.feedback}</p>
          {grade.confidence < 0.7 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                This response has been flagged for instructor review.
              </span>
            </div>
          )}
        </Card>

        {/* Revise Button */}
        <Button
          onClick={() => {
            setSubmitted(false);
            setGrade(null);
            setSubmissionText('');
          }}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Revise Submission
        </Button>
      </div>
    );
  }

  if (submitted && !grade) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="w-8 h-8 text-blue-600 mb-2 animate-spin" />
        <p className="text-sm text-gray-600">
          Your response is being graded...
        </p>
        <p className="text-xs text-gray-500 mt-1">This usually takes a few seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assignment Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Assignment</h4>
        <p className="text-sm text-blue-800">
          Please answer the following question based on the chapter content:
        </p>
        <p className="text-sm font-semibold text-blue-900 mt-2">
          What are the key concepts discussed in this chapter?
        </p>
      </Card>

      {/* Input Area */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Your Answer</label>
        <textarea
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          placeholder="Type your response here..."
          className="w-full h-32 p-3 border rounded-lg font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 text-right">
          {submissionText.length} / 10000 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !submissionText.trim()}
        className="w-full gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Submitting...' : 'Submit Answer'}
      </Button>

      {/* Helpful Info */}
      <Card className="p-3 bg-gray-50 text-xs text-gray-600">
        <p>
          💡 <strong>Tip:</strong> Your response will be automatically graded.
          Try to provide a detailed answer that demonstrates your understanding
          of the material.
        </p>
      </Card>
    </div>
  );
}
