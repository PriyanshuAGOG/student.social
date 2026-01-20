'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, DollarSign, Star, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function InstructorDashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const instructorId = user?.$id || '';

  useEffect(() => {
    if (instructorId) {
      fetchDashboard();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [instructorId, authLoading]);

  const fetchDashboard = async () => {
    if (!instructorId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/instructor/dashboard?instructorId=${instructorId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-32 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Instructor Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and track student progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.analytics.activeStudents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboard.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="grading">Grading Queue</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {dashboard.courses.map((course: any) => (
              <Card key={course.courseId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{course.title}</CardTitle>
                    <Badge>{course.status}</Badge>
                  </div>
                  <CardDescription>
                    {course.enrollments} enrollments • {course.completions} completions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-lg font-semibold">{course.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-lg font-semibold">{course.averageScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="text-lg font-semibold">{course.averageRating}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-lg font-semibold">${course.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submissions Requiring Review</CardTitle>
              <CardDescription>Low-confidence AI grades and essay submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Grading queue will be populated here. Check the grading queue API for pending
                submissions.
              </p>
              <Button className="mt-4">View Grading Queue</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.topPerformers.map((student: any, index: number) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.coursesCompleted} courses completed
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{student.averageScore}% avg</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Struggling Students */}
          {dashboard.strugglingStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Students Who Need Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.strugglingStudents.map((student: any) => (
                    <div key={student.studentId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-sm text-muted-foreground">{student.courseName}</p>
                      </div>
                      <Badge variant="destructive">{student.currentScore}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                  <p className="text-2xl font-bold">{dashboard.analytics.activeStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Score</p>
                  <p className="text-2xl font-bold">{dashboard.analytics.engagementScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <p className="text-2xl font-bold">{dashboard.analytics.churnRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Students</p>
                  <p className="text-2xl font-bold">{dashboard.analytics.completedStudents}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                  <p className="text-2xl font-bold">{dashboard.analytics.avgCompletionTime} days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description} • {activity.courseName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
