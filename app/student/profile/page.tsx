'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, BookOpen, Trophy, Target, TrendingUp, Calendar } from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Replace with actual user ID from auth context
      const userId = 'current-user-id';
      const response = await fetch(`/api/student/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
          <p className="text-muted-foreground mb-4">{profile.email}</p>
          <div className="flex gap-2">
            {profile.streak > 0 && (
              <Badge variant="outline">
                🔥 {profile.streak} day streak
              </Badge>
            )}
            <Badge variant="outline">
              {profile.totalCertificates} certificates
            </Badge>
            <Badge variant="outline">
              {profile.totalAchievements} achievements
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              {profile.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalPoints}</div>
            <p className="text-xs text-muted-foreground">Learning points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.totalStudyHours}h</div>
            <p className="text-xs text-muted-foreground">Total learning time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {/* Active Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Active Courses</CardTitle>
              <CardDescription>Courses you're currently taking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.enrollments
                  .filter((e: any) => e.status === 'active')
                  .map((enrollment: any) => (
                    <div key={enrollment.courseId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{enrollment.courseName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.enrollmentType === 'pod' ? '👥 Pod Learning' : '👤 Individual'}
                          </p>
                        </div>
                        <Badge>{enrollment.completionPercent}%</Badge>
                      </div>
                      <Progress value={enrollment.completionPercent} className="mb-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{enrollment.chaptersCompleted}/{enrollment.totalChapters} chapters</span>
                        <span>Avg: {enrollment.averageScore}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Completed Courses */}
          {profile.enrollments.filter((e: any) => e.status === 'completed').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Courses</CardTitle>
                <CardDescription>Courses you've finished</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.enrollments
                    .filter((e: any) => e.status === 'completed')
                    .map((enrollment: any) => (
                      <div key={enrollment.courseId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{enrollment.courseName}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed {new Date(enrollment.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{enrollment.finalScore}%</Badge>
                          {enrollment.hasCertificate && <Award className="h-5 w-5 text-yellow-500" />}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.achievements.map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="border rounded-lg p-4 flex items-start gap-3"
                  >
                    <div className="text-3xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificates</CardTitle>
              <CardDescription>Your course completion certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Award className="h-8 w-8 text-yellow-500" />
                      <Badge>{cert.grade}</Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{cert.courseName}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View Certificate →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
              <CardDescription>Your learning journey insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Study Streak */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    🔥 Study Streak
                  </h4>
                  <span className="text-2xl font-bold">{profile.streak} days</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Longest streak: {profile.longestStreak} days
                </p>
              </div>

              {/* Performance by Subject */}
              <div>
                <h4 className="font-medium mb-3">Performance by Category</h4>
                <div className="space-y-3">
                  {profile.categoryStats.map((stat: any) => (
                    <div key={stat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{stat.category}</span>
                        <span className="text-sm text-muted-foreground">{stat.averageScore}%</span>
                      </div>
                      <Progress value={stat.averageScore} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {profile.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{activity.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
