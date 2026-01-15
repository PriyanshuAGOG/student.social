'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, FileText, User } from 'lucide-react';

export default function GradingQueue() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradingData, setGradingData] = useState({ score: 0, feedback: '' });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const instructorId = 'current-instructor-id'; // Replace with actual from context
      const response = await fetch(`/api/instructor/grading?instructorId=${instructorId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch('/api/instructor/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          score: gradingData.score,
          feedback: gradingData.feedback,
          passed: gradingData.score >= 70,
        }),
      });

      if (response.ok) {
        // Refresh submissions list
        await fetchSubmissions();
        setSelectedSubmission(null);
        setGradingData({ score: 0, feedback: '' });
      }
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');
  const gradedSubmissions = submissions.filter((s) => s.status === 'graded');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Grading Queue</h1>
        <p className="text-muted-foreground">Review and grade student submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gradedSubmissions.filter((s) => {
                const today = new Date().toDateString();
                return new Date(s.gradedAt).toDateString() === today;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Completed submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Graded</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({gradedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No pending submissions. Great job staying on top of grading! 🎉
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Submissions List */}
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Card
                    key={submission.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSubmission?.id === submission.id
                        ? 'border-primary bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setGradingData({ score: 0, feedback: '' });
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{submission.courseName}</CardTitle>
                          <CardDescription>
                            {submission.lessonTitle} • {submission.assessmentTitle}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{submission.studentName}</span>
                        <span>•</span>
                        <span>
                          {submission.submissionType === 'assignment' ? '📝 Assignment' : '✅ Quiz'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Grading Panel */}
              <div>
                {selectedSubmission ? (
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle>Grade Submission</CardTitle>
                      <CardDescription>
                        {selectedSubmission.studentName} • {selectedSubmission.courseName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Submission Details */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedSubmission.assessmentTitle}
                        </p>
                      </div>

                      {/* Student Answer */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Student Response</h4>
                        <div className="bg-muted p-4 rounded-md text-sm">
                          {selectedSubmission.submissionText || selectedSubmission.submissionUrl ? (
                            <>
                              {selectedSubmission.submissionText && (
                                <p className="whitespace-pre-wrap mb-2">
                                  {selectedSubmission.submissionText}
                                </p>
                              )}
                              {selectedSubmission.submissionUrl && (
                                <a
                                  href={selectedSubmission.submissionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Attachment
                                </a>
                              )}
                            </>
                          ) : (
                            <p className="text-muted-foreground">No response text provided</p>
                          )}
                        </div>
                      </div>

                      {/* Score Input */}
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Score (0-100)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={gradingData.score}
                          onChange={(e) =>
                            setGradingData({ ...gradingData, score: parseInt(e.target.value) || 0 })
                          }
                          placeholder="Enter score..."
                        />
                      </div>

                      {/* Feedback */}
                      <div className="space-y-2">
                        <label className="font-medium text-sm">Feedback</label>
                        <Textarea
                          value={gradingData.feedback}
                          onChange={(e) =>
                            setGradingData({ ...gradingData, feedback: e.target.value })
                          }
                          placeholder="Provide constructive feedback to the student..."
                          rows={6}
                        />
                      </div>

                      {/* Passing Status */}
                      <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                        {gradingData.score >= 70 ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Passing ({gradingData.score}%)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-sm font-medium">
                              Not Passing ({gradingData.score}% - needs 70%+)
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleGradeSubmission}
                          disabled={!gradingData.feedback || gradingData.score === 0}
                          className="flex-1"
                        >
                          Submit Grade
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(null);
                            setGradingData({ score: 0, feedback: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Select a submission to begin grading
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          {gradedSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No graded submissions yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {gradedSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{submission.courseName}</CardTitle>
                        <CardDescription>
                          {submission.lessonTitle} • {submission.assessmentTitle}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={submission.passed ? 'default' : 'destructive'}>
                          {submission.score}%
                        </Badge>
                        {submission.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{submission.studentName}</span>
                      </div>
                      <span className="text-muted-foreground">
                        Graded {new Date(submission.gradedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <p className="font-medium mb-1">Your Feedback:</p>
                        <p className="text-muted-foreground">{submission.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
