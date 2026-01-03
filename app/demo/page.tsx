"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Zap,
  ArrowLeft,
  ArrowRight,
  Users,
  Brain,
  BookOpen,
  Trophy,
  Heart,
  Play,
  Sparkles,
  CheckCircle,
  Target,
  MessageSquare,
  Video
} from "lucide-react"

const FEATURES_SHOWCASE = [
  {
    icon: Users,
    title: "Study Pods",
    description: "Join collaborative study groups with peers who share your academic goals and interests",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    description: "Get instant help with doubts, personalized study plans, and smart recommendations",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: BookOpen,
    title: "Resource Vault",
    description: "Centralized library with collaborative notes, flashcards, and study materials",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Stay motivated with streaks, badges, leaderboards, and friendly competition",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Video,
    title: "Live Video Calls",
    description: "Study together in real-time with video sessions and screen sharing",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Instant messaging with your pod members, share files, and collaborate",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
]

const HIGHLIGHTS = [
  "Find study partners who match your goals",
  "AI-powered assistance available 24/7",
  "Real-time collaboration with video and chat",
  "Share and access community resources",
  "Track progress with gamification",
  "Completely free to get started",
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">PeerSpark</span>
              </Link>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                BETA
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <Play className="h-3 w-3 mr-1" />
              Platform Demo
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              See PeerSpark in <span className="text-primary">Action</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Watch how PeerSpark helps students overcome procrastination and learn together. 
              Built by a student, for students.
            </p>
          </div>

          {/* YouTube Video Embed */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/AfPkI7kDqX0"
                    title="PeerSpark Demo - Collaborative Learning Platform"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Watch the full demo to see how PeerSpark can transform your study experience
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Using PeerSpark Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Badge className="mb-4">What You'll Get</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Everything You Need to Study Better</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {HIGHLIGHTS.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Platform Features</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Powerful Tools for Modern Students</h2>
            <p className="text-muted-foreground">
              Everything you need to study smarter, not harder
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_SHOWCASE.map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Student-Led Initiative
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Built by a Student Who Understands Your Struggles
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  PeerSpark was created by <strong className="text-foreground">Priyanshu Agarwal</strong>, a student who experienced firsthand the challenges of studying alone and battling procrastination.
                </p>
                <p>
                  This isn't a corporate product — it's a passion project built to help students like you find study partners, stay motivated, and achieve your academic goals.
                </p>
                <p>
                  The platform is currently in <strong className="text-foreground">BETA</strong>, and your feedback helps shape its future. We're building this together!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link href="/about">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Read Our Full Story
                  </Button>
                </Link>
                <Link href="/support">
                  <Button variant="ghost" className="w-full sm:w-auto">
                    <Heart className="h-4 w-4 mr-2" />
                    Support the Project
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                      PA
                    </div>
                    <div>
                      <h3 className="font-semibold">Priyanshu Agarwal</h3>
                      <p className="text-sm text-muted-foreground">Founder & Developer</p>
                      <Badge variant="outline" className="text-xs mt-1">Student</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "I built PeerSpark because I believe no student should have to struggle with learning alone. When we study together, we succeed together."
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm">Beta Testing Phase</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Active development with new features added regularly
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the PeerSpark community today. Find study partners, stay motivated, and achieve your goals — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:chat.priyanshuag@gmail.com">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                Contact Us
              </Button>
            </a>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? Email: chat.priyanshuag@gmail.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PeerSpark</span>
              <Badge variant="secondary" className="text-xs">BETA</Badge>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/demo" className="hover:text-foreground transition-colors font-medium text-foreground">Demo</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support Us</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PeerSpark. A student-led initiative.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
