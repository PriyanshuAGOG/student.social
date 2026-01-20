'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CoursePlayer } from '@/components/courses/CoursePlayer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star, Share2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/hooks/use-toast';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user?.$id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseRes = await fetch(`/api/courses/${courseId}`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.course);
      }

      // Fetch chapters
      const chaptersRes = await fetch(`/api/courses/${courseId}/chapters`);
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        setChapters(chaptersData.chapters || []);
        if (chaptersData.chapters && chaptersData.chapters.length > 0) {
          setSelectedChapter(chaptersData.chapters[0]);
        }
      }

      // Check enrollment status based on user auth
      if (user?.$id) {
        // TODO: Fetch actual enrollment status from API
        setEnrolled(false);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user?.$id) {
      toast({ title: 'Please log in', description: 'You need to be logged in to enroll in a course.', variant: 'destructive' });
      router.push('/login');
      return;
    }
    
    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.$id,
          courseId,
          enrollmentType: 'individual',
        }),
      });

      if (response.ok) {
        setEnrolled(true);
        toast({ title: 'Enrolled!', description: 'Successfully enrolled in course!' });
      } else {
        const data = await response.json();
        toast({ title: 'Enrollment failed', description: data.error || 'Failed to enroll', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({ title: 'Error', description: 'Failed to enroll in course. Please try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-muted h-64 rounded-lg mb-8"></div>
          <div className="bg-muted h-10 rounded mb-4"></div>
          <div className="bg-muted h-6 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Course not found</p>
        <Button onClick={() => router.push('/courses')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8">
          <div className="max-w-4xl">
            <Badge className="mb-4">{course.difficulty}</Badge>
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{Math.round(course.duration / 60)} hours</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{chapters.length} chapters</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{course.rating || 0} rating</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleEnroll} size="lg">
                Enroll Now {course.price > 0 ? `- $${course.price}` : '- Free'}
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Course Content Preview */}
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="mt-6">
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div key={chapter.$id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Chapter {index + 1}: {chapter.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {chapter.description}
                      </p>
                    </div>
                    <Badge variant="outline">{chapter.duration} min</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="prose max-w-none">
              <h3>About This Course</h3>
              <p>{course.description}</p>
              <h4>What You'll Learn</h4>
              <ul>
                {chapters.slice(0, 5).map((ch: any) => (
                  <li key={ch.$id}>{ch.learningObjectives?.[0] || ch.title}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Enrolled view - show course player
  return (
    <div className="h-screen">
      <CoursePlayer
        courseId={courseId}
        chapters={chapters}
        selectedChapter={selectedChapter}
        onChapterSelect={setSelectedChapter}
      />
    </div>
  );
}
