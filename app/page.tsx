"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Menu,
  X,
  Users,
  Brain,
  Target,
  Zap,
  Star,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Trophy,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const { toast } = useToast()

  const features = [
    {
      icon: Users,
      title: "Study Pods",
      description: "Join collaborative study groups with peers who share your academic goals and interests.",
    },
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Get personalized learning recommendations and instant help with your studies.",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve your learning objectives with our comprehensive progress tracking.",
    },
    {
      icon: BookOpen,
      title: "Resource Vault",
      description: "Access a vast library of study materials, notes, and resources shared by the community.",
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Communicate instantly with your study partners and get help when you need it.",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn points, badges, and climb leaderboards as you progress in your learning journey.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content:
        "PeerSpark transformed my study habits. The collaborative environment and AI insights helped me improve my grades significantly.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Medical Student",
      content:
        "The study pods feature is incredible. I found amazing study partners and we motivate each other every day.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Business Major",
      content:
        "The AI assistant is like having a personal tutor available 24/7. It really understands my learning style.",
      rating: 5,
    },
  ]

  const stats = [
    { number: "50K+", label: "Active Students" },
    { number: "10K+", label: "Study Pods" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: "AI Support" },
  ]

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      toast({
        title: "Success!",
        description: "Thank you for subscribing to our newsletter.",
      })
      setEmail("")
    }
  }

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mobile-container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">PeerSpark</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/demo" className="text-sm font-medium hover:text-primary transition-colors">
                Demo
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="mobile-button">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="touch-target">
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t bg-background/95 backdrop-blur">
              <div className="mobile-space mobile-padding">
                <div className="flex flex-col space-y-3">
                  <Link
                    href="#features"
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#testimonials"
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Testimonials
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/demo"
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Demo
                  </Link>
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start mobile-button">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full mobile-button">Get Started</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="mobile-container">
          <div className="flex flex-col items-center text-center mobile-space">
            <Badge variant="secondary" className="mb-4">
              🚀 Now in Beta - Join 50,000+ Students
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none max-w-4xl">
              Learn Together, Achieve More with <span className="text-primary">PeerSpark</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground mobile-text md:text-xl mt-6">
              Connect with study partners, access AI-powered learning tools, and transform your academic journey through
              collaborative learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="mobile-button w-full sm:w-auto">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="mobile-button w-full sm:w-auto bg-transparent">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/50">
        <div className="mobile-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-24">
        <div className="mobile-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need to Excel
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground mobile-text md:text-xl mt-4">
              Powerful features designed to enhance your learning experience and academic success.
            </p>
          </div>
          <div className="grid mobile-grid mobile-gap">
            {features.map((feature, index) => (
              <Card key={index} className="mobile-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="mobile-heading">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mobile-text">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 md:py-24 bg-muted/50">
        <div className="mobile-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Students Say</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground mobile-text md:text-xl mt-4">
              Join thousands of students who have transformed their learning with PeerSpark.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Card className="mobile-card">
              <CardContent className="mobile-padding text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-lg md:text-xl font-medium mb-6">
                  &ldquo;{testimonials[currentTestimonial].content}&rdquo;
                </blockquote>
                <div>
                  <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center items-center mt-6 space-x-4">
              <Button variant="outline" size="icon" onClick={prevTestimonial} className="touch-target bg-transparent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTestimonial ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={nextTestimonial} className="touch-target bg-transparent">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24">
        <div className="mobile-container">
          <Card className="mobile-card bg-primary text-primary-foreground">
            <CardContent className="mobile-padding text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="mx-auto max-w-[600px] mobile-text md:text-xl mb-8 text-primary-foreground/90">
                Join thousands of students who are already achieving their academic goals with PeerSpark.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="mobile-button w-full sm:w-auto">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/app">
                  <Button
                    size="lg"
                    variant="outline"
                    className="mobile-button w-full sm:w-auto border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                  >
                    Join a Pod
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 border-t">
        <div className="mobile-container">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
            <p className="text-muted-foreground mobile-text mb-6">
              Get the latest updates, study tips, and feature announcements.
            </p>
            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mobile-input flex-1"
                required
              />
              <Button type="submit" className="mobile-button">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="mobile-container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">PeerSpark</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering students through collaborative learning and AI-powered insights.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="touch-target">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="touch-target">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="touch-target">
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <Link
                  href="/app"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/app/pods"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Study Pods
                </Link>
                <Link
                  href="/app/ai"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI Assistant
                </Link>
                <Link
                  href="/app/vault"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resource Vault
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <Link
                  href="/about"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/careers"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Careers
                </Link>
                <Link
                  href="/blog"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="/contact"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  href="/community-guidelines"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Community Guidelines
                </Link>
                <Link
                  href="/accessibility"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Accessibility
                </Link>
                <Link
                  href="/status"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Status
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link
                  href="/privacy"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
                <Link
                  href="/dmca"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  DMCA Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 PeerSpark. All rights reserved. Built with ❤️ for students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
