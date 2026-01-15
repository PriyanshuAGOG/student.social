'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Target, MessageSquare, Video } from 'lucide-react';

export default function PodCourseDashboard() {
  const searchParams = useSearchParams();
  const podCourseId = searchParams?.get('podCourseId');

  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (podCourseId) {
      fetchProgress();
    }
  }, [podCourseId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pods/course-progress?podCourseId=${podCourseId}`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!progress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">No progress data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{progress.cohortName}</h1>
        <p className="text-muted-foreground">{progress.courseName} • Pod Learning</p>
      </div>

      {/* Group Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {progress.activeMembers} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.groupCompletionPercent}%</div>
            <Progress value={progress.groupCompletionPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.groupAverageScore}%</div>
            <p className="text-xs text-muted-foreground">Group performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.communityScore}/100</div>
            <p className="text-xs text-muted-foreground">Engagement level</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="chat">Discussion</TabsTrigger>
          <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Accelerators */}
          {progress.accelerators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚀 Accelerators
                  <Badge variant="outline">{progress.accelerators.length}</Badge>
                </CardTitle>
                <CardDescription>Members ahead of the pack</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {progress.memberProgress
                    .filter((m: any) => progress.accelerators.includes(m.userId))
                    .map((member: any) => (
                      <div key={member.userId} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.chaptersCompleted}/{member.totalChapters} chapters
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-1">{member.completionPercent}%</Badge>
                          <p className="text-sm text-muted-foreground">{member.averageScore}% avg</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Members */}
          <Card>
            <CardHeader>
              <CardTitle>All Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.memberProgress.map((member: any) => (
                  <div key={member.userId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                          {member.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.streak > 0 && `🔥 ${member.streak} day streak • `}
                            {member.achievements.length} achievements
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{member.completionPercent}%</p>
                        <p className="text-sm text-muted-foreground">{member.averageScore}% avg</p>
                      </div>
                    </div>
                    <Progress value={member.completionPercent} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Struggling Members */}
          {progress.strugglingMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  ⚠️ Members Who Need Support
                  <Badge variant="outline">{progress.strugglingMembers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Reach out to these members and offer help!
                </p>
                <div className="space-y-2">
                  {progress.memberProgress
                    .filter((m: any) => progress.strugglingMembers.includes(m.userId))
                    .map((member: any) => (
                      <div key={member.userId} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.completionPercent}% complete
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Milestones</CardTitle>
              <CardDescription>Track your cohort's progress together</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progress.milestones.map((milestone: any) => (
                  <div key={milestone.milestone}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{milestone.milestone}</h4>
                      <Badge variant={milestone.percentComplete === 100 ? 'default' : 'outline'}>
                        {milestone.completedBy}/{milestone.totalMembers}
                      </Badge>
                    </div>
                    <Progress value={milestone.percentComplete} className="mb-1" />
                    <p className="text-sm text-muted-foreground">
                      {milestone.percentComplete}% of members achieved
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pod Discussion Board</CardTitle>
              <CardDescription>Ask questions and help each other learn</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Discussion board coming soon. Use the chat API to post messages.
              </p>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Discussion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Sessions</CardTitle>
              <CardDescription>Join group video calls to learn together</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No upcoming study sessions. Schedule one to study with your pod!
              </p>
              <Button>
                <Video className="mr-2 h-4 w-4" />
                Schedule Session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
