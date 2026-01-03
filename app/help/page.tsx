"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  HelpCircle,
  Search,
  BookOpen,
  Users,
  Settings,
  CreditCard,
  Shield,
  Video,
  MessageSquare,
  Bot,
  Upload,
  Bell,
  Smartphone,
  ChevronRight,
  Mail,
  ExternalLink,
  Lightbulb,
  Play,
  FileText,
  Headphones
} from "lucide-react"
import { useState } from "react"

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    {
      id: "getting-started",
      icon: Play,
      title: "Getting Started",
      description: "New to PeerSpark? Start here to learn the basics.",
      articles: [
        { title: "Creating your account", views: "15.2K" },
        { title: "Setting up your profile", views: "12.8K" },
        { title: "Finding and joining study pods", views: "11.5K" },
        { title: "Understanding the dashboard", views: "9.3K" },
        { title: "Taking the welcome tour", views: "8.7K" },
      ],
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "study-pods",
      icon: Users,
      title: "Study Pods",
      description: "Learn how to create, manage, and get the most from study pods.",
      articles: [
        { title: "Creating a new study pod", views: "14.1K" },
        { title: "Inviting members to your pod", views: "11.2K" },
        { title: "Managing pod settings and roles", views: "8.9K" },
        { title: "Pod matching algorithm explained", views: "7.6K" },
        { title: "Leaving or deleting a pod", views: "5.4K" },
      ],
      color: "bg-green-500/10 text-green-600",
    },
    {
      id: "video-calls",
      icon: Video,
      title: "Video Calling",
      description: "Set up and troubleshoot video and voice calls.",
      articles: [
        { title: "Starting a video call", views: "10.8K" },
        { title: "Screen sharing in calls", views: "9.2K" },
        { title: "Troubleshooting audio issues", views: "8.5K" },
        { title: "Fixing camera problems", views: "7.1K" },
        { title: "Using the virtual whiteboard", views: "6.8K" },
      ],
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      id: "ai-assistant",
      icon: Bot,
      title: "AI Assistant",
      description: "Get help using our AI-powered learning assistant.",
      articles: [
        { title: "How to use the AI Assistant", views: "12.3K" },
        { title: "What can the AI help with?", views: "11.1K" },
        { title: "AI usage limits and quotas", views: "9.5K" },
        { title: "Getting better AI responses", views: "8.2K" },
        { title: "AI for exam preparation", views: "7.9K" },
      ],
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "resource-vault",
      icon: Upload,
      title: "Resource Vault",
      description: "Share and organize study materials with your pods.",
      articles: [
        { title: "Uploading files to the vault", views: "8.7K" },
        { title: "Organizing resources with folders", views: "7.4K" },
        { title: "Sharing resources with pods", views: "6.9K" },
        { title: "Supported file types", views: "5.8K" },
        { title: "Storage limits and quotas", views: "5.2K" },
      ],
      color: "bg-red-500/10 text-red-600",
    },
    {
      id: "messaging",
      icon: MessageSquare,
      title: "Chat & Messaging",
      description: "Communicate with pod members and manage conversations.",
      articles: [
        { title: "Sending messages in pods", views: "9.8K" },
        { title: "Direct messaging other users", views: "8.5K" },
        { title: "Message reactions and replies", views: "7.2K" },
        { title: "Managing notifications", views: "6.8K" },
        { title: "Blocking and muting users", views: "5.1K" },
      ],
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "account",
      icon: Settings,
      title: "Account & Settings",
      description: "Manage your account, preferences, and security.",
      articles: [
        { title: "Changing your password", views: "11.2K" },
        { title: "Updating email address", views: "8.9K" },
        { title: "Two-factor authentication", views: "7.6K" },
        { title: "Managing notification preferences", views: "6.4K" },
        { title: "Deleting your account", views: "5.8K" },
      ],
      color: "bg-gray-500/10 text-gray-600",
    },
    {
      id: "billing",
      icon: CreditCard,
      title: "Billing & Subscription",
      description: "Payment, plans, and subscription management.",
      articles: [
        { title: "Available subscription plans", views: "10.5K" },
        { title: "Upgrading to Premium", views: "9.2K" },
        { title: "Changing payment method", views: "7.8K" },
        { title: "Canceling subscription", views: "6.5K" },
        { title: "Requesting a refund", views: "5.9K" },
      ],
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "privacy-safety",
      icon: Shield,
      title: "Privacy & Safety",
      description: "Keep your account secure and manage privacy settings.",
      articles: [
        { title: "Privacy settings overview", views: "8.4K" },
        { title: "Who can see my profile?", views: "7.2K" },
        { title: "Reporting inappropriate content", views: "6.8K" },
        { title: "Blocking and unblocking users", views: "5.9K" },
        { title: "Data download and portability", views: "4.7K" },
      ],
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      id: "mobile",
      icon: Smartphone,
      title: "Mobile App",
      description: "Use PeerSpark on iOS and Android devices.",
      articles: [
        { title: "Downloading the mobile app", views: "9.1K" },
        { title: "Mobile app features", views: "7.8K" },
        { title: "Push notification settings", views: "6.5K" },
        { title: "Offline mode and sync", views: "5.2K" },
        { title: "Troubleshooting mobile issues", views: "4.9K" },
      ],
      color: "bg-cyan-500/10 text-cyan-600",
    },
  ]

  const popularArticles = [
    { title: "How to reset your password", category: "Account", icon: Settings },
    { title: "Getting started with study pods", category: "Study Pods", icon: Users },
    { title: "Using the AI Assistant effectively", category: "AI Assistant", icon: Bot },
    { title: "Troubleshooting video call issues", category: "Video Calling", icon: Video },
    { title: "Understanding subscription plans", category: "Billing", icon: CreditCard },
    { title: "Reporting a problem or abuse", category: "Privacy & Safety", icon: Shield },
  ]

  const quickLinks = [
    { title: "System Status", description: "Check if PeerSpark is up and running", href: "/status", icon: Zap },
    { title: "Contact Support", description: "Get in touch with our team", href: "/contact", icon: Headphones },
    { title: "Community Guidelines", description: "Read our community standards", href: "/community-guidelines", icon: FileText },
    { title: "Privacy Policy", description: "How we protect your data", href: "/privacy", icon: Shield },
  ]

  const filteredCategories = searchQuery
    ? categories.filter(
        (cat) =>
          cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.articles.some((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories

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

      {/* Hero Section with Search */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Search our help center or browse topics below to find answers.
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg rounded-full border-2"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Getting Started
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Study Pods
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Video Calls
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              AI Assistant
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Billing
            </Badge>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Popular Articles</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => (
              <Link 
                key={article.title} 
                href="#"
                className="group"
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group-hover:border-primary/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <article.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{article.category}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Browse by Category</h2>
          </div>

          {filteredCategories.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any articles matching "{searchQuery}". Try a different search term.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article.title}>
                          <Link 
                            href="#" 
                            className="group flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted transition-colors"
                          >
                            <span className="text-sm group-hover:text-primary transition-colors">
                              {article.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{article.views} views</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
                      View all articles
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-6">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.title} href={link.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{link.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Video Tutorials</h2>
            </div>
            <Link href="#" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all videos
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Getting Started with PeerSpark", duration: "5:32", thumbnail: "/placeholder.svg" },
              { title: "How to Create Your First Study Pod", duration: "3:45", thumbnail: "/placeholder.svg" },
              { title: "Using the AI Assistant for Learning", duration: "7:18", thumbnail: "/placeholder.svg" },
            ].map((video) => (
              <Card key={video.title} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2">{video.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                <Mail className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
            </Link>
            <Link href="#">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Live Chat
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Average response time: Under 2 hours
          </p>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-semibold mb-2">Join the PeerSpark Community</h3>
                <p className="text-muted-foreground">
                  Connect with other students, share tips, and get help from experienced users in our community forums.
                </p>
              </div>
              <Button>
                Visit Community
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                question: "Is PeerSpark free to use?",
                answer: "Yes! PeerSpark offers a generous free tier that includes access to study pods, basic AI assistance, video calls, and the resource vault. Premium plans unlock additional features like unlimited AI usage, larger file storage, and advanced analytics.",
              },
              {
                question: "How do I reset my password?",
                answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. The link expires after 24 hours for security.",
              },
              {
                question: "Can I use PeerSpark on my phone?",
                answer: "Absolutely! PeerSpark is available as a progressive web app (PWA) that works on any device. You can also download our native apps from the App Store and Google Play for the best mobile experience.",
              },
              {
                question: "How does pod matching work?",
                answer: "Our intelligent matching algorithm considers your subjects, learning style, availability, and goals to connect you with compatible study partners. You can also manually search for and join public pods.",
              },
              {
                question: "Is my data secure?",
                answer: "Security is our top priority. We use industry-standard encryption, secure data centers, and regular security audits. Read our Privacy Policy for detailed information about how we protect your data.",
              },
              {
                question: "How do I report a problem or abuse?",
                answer: "Use the 'Report' button available on profiles, messages, and content, or contact our trust and safety team at safety@peerspark.com. All reports are reviewed within 24 hours.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/help" className="hover:text-foreground transition-colors font-medium text-foreground">Help</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PeerSpark. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
