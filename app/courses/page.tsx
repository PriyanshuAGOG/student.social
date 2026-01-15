// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, TrendingUp } from 'lucide-react';

type Course = any;

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [searchQuery, difficulty, sortBy, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses/list');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Difficulty filter
    if (difficulty !== 'all') {
      filtered = filtered.filter((course) => course.difficulty === difficulty);
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.$id.localeCompare(a.$id));
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    setFilteredCourses(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore Courses</h1>
        <p className="text-muted-foreground">
          Discover courses created from YouTube videos with AI-powered learning
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <TrendingUp className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-48 rounded-lg mb-4"></div>
              <div className="bg-muted h-6 rounded mb-2"></div>
              <div className="bg-muted h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No courses found matching your criteria
          </p>
          <Button onClick={() => {
            setSearchQuery('');
            setDifficulty('all');
          }} className="mt-4">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.$id} course={course} />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-3xl font-bold text-primary">{courses.length}</h3>
          <p className="text-muted-foreground">Total Courses</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-3xl font-bold text-primary">
            {courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
          </h3>
          <p className="text-muted-foreground">Total Enrollments</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-3xl font-bold text-primary">
            {courses.length > 0
              ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
              : '0.0'}
          </h3>
          <p className="text-muted-foreground">Average Rating</p>
        </div>
      </div>
    </div>
  );
}
