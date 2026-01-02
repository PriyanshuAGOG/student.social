"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize,
  Users,
  Brain,
  BookOpen,
  Trophy,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const DEMO_SECTIONS = [
  {
    id: "overview",
    title: "Platform Overview",
    duration: "2:30",
    description: "Get introduced to PeerSpark's core features and philosophy",
  },
  {
    id: "pods",
    title: "Study Pods",
    duration: "3:45",
    description: "Learn how to join and participate in collaborative learning communities",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    duration: "2:15",
    description: "Discover how AI helps with doubts, scheduling, and content creation",
  },
  {
    id: "vault",
    title: "Resource Vault",
    duration: "1:50",
    description: "Explore the centralized library for notes, flashcards, and materials",
  },
  {
    id: "analytics",
    title: "Progress Analytics",
    duration: "2:00",
    description: "Track your learning journey with detailed insights and reports",
  },
]

const FEATURES_SHOWCASE = [
  {
    icon: Users,
    title: "Study Pods",
    description: "Join subject-specific communities with live sessions and peer support",
    color: "text-blue-500",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    description: "Get instant help with doubts, summaries, and personalized study plans",
    color: "text-purple-500",
  },
  {
    icon: BookOpen,
    title: "Resource Vault",
    description: "Centralized library with collaborative notes and version control",
    color: "text-green-500",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Stay motivated with streaks, badges, and friendly competition",
    color: "text-yellow-500",
  },
]

export default function DemoPage() {
  const [currentSection, setCurrentSection] = useState("overview")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const { toast } = useToast()

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    toast({
      title: isPlaying ? "Demo Paused" : "Demo Playing",
      description: `${isPlaying ? "Paused" : "Playing"} ${DEMO_SECTIONS.find((s) => s.id === currentSection)?.title}`,
    })
  }

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId)
    setCurrentTime(0)
    setIsPlaying(true)
    toast({
      title: "Section Changed",
      description: `Now playing: ${DEMO_SECTIONS.find((s) => s.id === sectionId)?.title}`,
    })
  }

  const handleStartTrial = () => {
    toast({
      title: "Starting Free Trial",
      description: "Redirecting to registration...",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">PeerSpark</span>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="sm:size-default">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="sm:size-default bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">See PeerSpark in Action</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Take a guided tour through our platform and discover how peer-powered learning can transform your study
            experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button size="lg" onClick={handleStartTrial} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent w-full sm:w-auto">
              Schedule Live Demo
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {DEMO_SECTIONS.find((s) => s.id === currentSection)?.title}
                      </h3>
                      <p className="text-white/80">{DEMO_SECTIONS.find((s) => s.id === currentSection)?.description}</p>
                    </div>
                  </div>

                  {/* Video Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Fullscreen Button */}
                  <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-white hover:bg-white/20">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>

                {/* Video Controls */}
                <div className="p-4 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentTime / 150) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, "0")}
                      </span>
                      <span>{DEMO_SECTIONS.find((s) => s.id === currentSection)?.duration}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button variant="ghost" size="sm">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-2 ml-4">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Showcase */}
            <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {FEATURES_SHOWCASE.map((feature) => (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`p-2 sm:p-3 rounded-lg bg-secondary ${feature.color}`}>
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar - Show as horizontal scroll on mobile */}
          <div className="space-y-4 sm:space-y-6 order-first lg:order-last">
            {/* Demo Sections - Horizontal on mobile */}
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Demo Sections</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Click to jump to different parts of the demo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 overflow-x-auto">
                <div className="flex lg:flex-col gap-2 lg:gap-0 lg:space-y-2 pb-2 lg:pb-0">
                  {DEMO_SECTIONS.map((section) => (
                    <Button
                      key={section.id}
                      variant={currentSection === section.id ? "default" : "ghost"}
                      className={`flex-shrink-0 lg:w-full justify-start text-left h-auto p-2 sm:p-3 min-w-[160px] lg:min-w-0 ${
                        currentSection === section.id ? "bg-primary" : ""
                      }`}
                    onClick={() => handleSectionChange(section.id)}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium text-xs sm:text-sm">{section.title}</span>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs ml-2">
                          {section.duration}
                        </Badge>
                      </div>
                      <p className="text-[10px] sm:text-xs opacity-80 text-left hidden lg:block">{section.description}</p>
                    </div>
                  </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats - Grid on mobile */}
            <Card className="hidden sm:block">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Why Choose PeerSpark?</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 lg:grid-cols-1 gap-4 lg:space-y-4 lg:gap-0">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">85%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Higher retention rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-accent">3.2x</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Faster learning progress</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-500">10k+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Active learners</div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial - Hidden on small mobile */}
            <Card className="hidden md:block">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback>RS</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm mb-2">
                      &ldquo;PeerSpark transformed my NEET preparation. The biology pod helped me stay consistent and
                      motivated!&rdquo;
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Riya Sharma</span> • NEET Aspirant
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 sm:p-6 text-center">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Ready to get started?</h3>
                <p className="text-xs sm:text-sm opacity-90 mb-3 sm:mb-4">Join thousands of learners already using PeerSpark</p>
                <Button onClick={handleStartTrial} className="w-full bg-background text-primary hover:bg-background/90 text-sm">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
