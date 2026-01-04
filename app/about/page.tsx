"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  Target,
  Heart,
  Users,
  Lightbulb,
  Globe,
  GraduationCap,
  BookOpen,
  Brain,
  Trophy,
  Rocket,
  Shield,
  ArrowRight,
  Mail,
  Sparkles,
  CheckCircle
} from "lucide-react"

export default function AboutPage() {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "Learning is inherently social. PeerSpark is designed to foster genuine connections between learners, creating supportive communities that accelerate growth.",
    },
    {
      icon: Lightbulb,
      title: "Innovation in Education",
      description: "We integrate AI, real-time collaboration, and gamification to make learning more effective and engaging for modern students.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Student safety is paramount. We maintain rigorous privacy standards and content moderation to create a safe space for learning.",
    },
    {
      icon: Globe,
      title: "Accessible to All",
      description: "Quality education tools should be available to everyone. We offer free access and work to ensure equitable access globally.",
    },
    {
      icon: Heart,
      title: "Student Success",
      description: "Every feature we build is evaluated by one metric: does it help students succeed? We're obsessed with learning outcomes.",
    },
    {
      icon: Rocket,
      title: "Continuous Improvement",
      description: "We iterate rapidly based on user feedback and emerging best practices in learning science. The platform evolves with our community.",
    },
  ]

  const features = [
    {
      icon: Users,
      title: "Study Pods",
      description: "Join collaborative study groups with peers who share your academic goals",
    },
    {
      icon: Brain,
      title: "AI Assistant",
      description: "Get personalized learning recommendations and instant help",
    },
    {
      icon: BookOpen,
      title: "Resource Vault",
      description: "Share and access study materials, notes, and flashcards",
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Stay motivated with streaks, badges, and friendly competition",
    },
  ]

  const roadmap = [
    { achieved: true, title: "Idea & Vision", description: "Identified the problem of isolated learning and procrastination" },
    { achieved: true, title: "Initial Prototype", description: "Built the first version with core collaboration features" },
    { achieved: true, title: "Beta Launch", description: "Currently in beta testing with early adopters" },
    { achieved: false, title: "Community Growth", description: "Expand to more students and educational institutions" },
    { achieved: false, title: "Mobile Apps", description: "Launch native iOS and Android applications" },
    { achieved: false, title: "Global Expansion", description: "Reach students in every corner of the world" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="PeerSpark" width={32} height={32} className="object-cover" />
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
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Student-Led Initiative
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Built by a Student, 
              <span className="text-primary"> For Students</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              PeerSpark is a passion project created by a student who understands the challenges of learning alone and battling procrastination.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Join Our Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/support">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Heart className="h-4 w-4 mr-2" />
                  Support Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">The Story</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                From Personal Struggle to a Platform for Students
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Hi, I'm <strong className="text-foreground">Priyanshu Agarwal</strong>, the founder of PeerSpark. Like millions of students around the world, I've struggled with procrastination and the isolation of studying alone.
                </p>
                <p>
                  During my own academic journey, I realized that the best study sessions weren't the ones spent alone with books — they were the ones with friends, where we could discuss concepts, quiz each other, and keep each other motivated.
                </p>
                <p>
                  But not everyone has access to study partners. Some students are in different time zones, others have different schedules, and many simply feel too shy to reach out. I wanted to change that.
                </p>
                <p>
                  <strong className="text-foreground">That's why I built PeerSpark</strong> — a platform where any student, anywhere in the world, can find like-minded peers to study with. No more learning alone. No more endless procrastination loops. Just students helping students succeed.
                </p>
                <p>
                  This isn't a big corporation or a venture-backed startup. It's a student-led prototype built with passion, late nights, and a genuine desire to help my fellow students thrive.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                      PA
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">Priyanshu Agarwal</h3>
                      <p className="text-muted-foreground">Founder & Developer</p>
                      <Badge variant="outline" className="mt-1">Student</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">
                    "I believe every student deserves access to a supportive learning community. PeerSpark is my way of making that happen. If even one student finds it easier to study because of this platform, it's all worth it."
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3">Get in Touch</h4>
                  <a 
                    href="mailto:chat.priyanshuag@gmail.com" 
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    chat.priyanshuag@gmail.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-3">
                    I read every email personally. Whether it's feedback, ideas, or just wanting to say hi — I'd love to hear from you!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Mission</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              No Student Should Have to Learn Alone
            </h2>
            <p className="text-muted-foreground">
              We're on a mission to eliminate the isolation and procrastination that holds millions of students back from reaching their potential.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Principles That Guide Us</h2>
            <p className="text-muted-foreground">
              These core values shape every decision we make, from product development to community building.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Roadmap</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Where We're Headed</h2>
            <p className="text-muted-foreground">
              PeerSpark is a work in progress. Here's what we've accomplished and what's coming next.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {roadmap.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.achieved 
                      ? "bg-green-500 text-white" 
                      : "bg-muted border-2 border-dashed border-muted-foreground/30"
                  }`}>
                    {item.achieved && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex-1 pb-4 ${index < roadmap.length - 1 ? "border-b" : ""}`}>
                    <h3 className={`font-semibold ${!item.achieved && "text-muted-foreground"}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Why PeerSpark?</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Makes Us Different</h2>
            <p className="text-muted-foreground">
              We're not a corporation trying to monetize your attention. We're students building for students.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center border-primary/50 bg-primary/5">
              <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Student-Built</h3>
              <p className="text-sm text-muted-foreground">Created by a student who understands your struggles firsthand</p>
            </Card>
            <Card className="p-6 text-center">
              <Target className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Mission-Driven</h3>
              <p className="text-sm text-muted-foreground">Focused on helping students succeed, not maximizing profits</p>
            </Card>
            <Card className="p-6 text-center">
              <Brain className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">Smart matching and AI assistance to enhance your learning</p>
            </Card>
            <Card className="p-6 text-center">
              <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Outcome-Focused</h3>
              <p className="text-sm text-muted-foreground">Built to help you actually study more and procrastinate less</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join the PeerSpark Community
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Be part of a growing community of students who are transforming how they learn. It's completely free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/support">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                <Heart className="h-4 w-4 mr-2" />
                Support the Project
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? Reach out: chat.priyanshuag@gmail.com
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded overflow-hidden flex items-center justify-center">
                <Image src="/logo.png" alt="PeerSpark" width={24} height={24} className="object-cover" />
              </div>
              <span className="font-semibold">PeerSpark</span>
              <Badge variant="secondary" className="text-xs">BETA</Badge>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors font-medium text-foreground">About</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support Us</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
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
