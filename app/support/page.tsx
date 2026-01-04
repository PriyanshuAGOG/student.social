"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  Heart,
  Rocket,
  Users,
  Globe,
  GraduationCap,
  Target,
  Mail,
  ArrowRight,
  Lightbulb,
  Coffee,
  MessageSquare,
  Star,
  HandHeart,
  Sparkles,
  CheckCircle,
  Server,
  Smartphone
} from "lucide-react"

export default function SupportPage() {
  const whySupport = [
    {
      icon: GraduationCap,
      title: "Built by a Student, For Students",
      description: "PeerSpark was created by a student who understands the struggles of learning alone. Your support helps us reach more students worldwide.",
    },
    {
      icon: Heart,
      title: "Fighting Procrastination Together",
      description: "Millions of students struggle with procrastination and isolation. Your contribution helps us build tools that make studying social and fun.",
    },
    {
      icon: Globe,
      title: "Free Access for Everyone",
      description: "We believe quality education tools should be accessible to all students, regardless of their financial situation.",
    },
    {
      icon: Rocket,
      title: "Early Stage, Big Dreams",
      description: "As a student-led prototype, we're bootstrapping our way to success. Every contribution directly impacts our development.",
    },
  ]

  const fundingNeeds = [
    {
      amount: "$500",
      title: "Server Costs (1 Month)",
      description: "Keep PeerSpark running smoothly for all our users",
      icon: Server,
    },
    {
      amount: "$1,000",
      title: "AI API Credits",
      description: "Power our AI assistant to help more students learn",
      icon: Lightbulb,
    },
    {
      amount: "$2,500",
      title: "Video Infrastructure",
      description: "Enable seamless video calls for study pods",
      icon: Users,
    },
    {
      amount: "$5,000",
      title: "Mobile App Development",
      description: "Bring PeerSpark to iOS and Android",
      icon: Smartphone,
    },
  ]

  const howToHelp = [
    {
      icon: HandHeart,
      title: "Financial Support",
      description: "Any contribution helps us cover server costs, API fees, and development expenses.",
    },
    {
      icon: MessageSquare,
      title: "Spread the Word",
      description: "Share PeerSpark with fellow students. Word of mouth is our biggest growth driver.",
    },
    {
      icon: Star,
      title: "Give Feedback",
      description: "Help us improve by sharing your experience and suggestions.",
    },
    {
      icon: Coffee,
      title: "Join the Community",
      description: "Be an active member, help other students, and contribute to discussions.",
    },
  ]

  const milestones = [
    { achieved: true, title: "Idea & Initial Prototype", description: "Built the first working version" },
    { achieved: true, title: "Core Features Launch", description: "Study Pods, AI Assistant, Resource Vault" },
    { achieved: true, title: "Beta Testing", description: "Currently in beta with early users" },
    { achieved: false, title: "Mobile Apps", description: "Native iOS and Android apps" },
    { achieved: false, title: "1,000 Active Users", description: "Growing our student community" },
    { achieved: false, title: "Sustainability", description: "Self-sustaining platform" },
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
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Student-Led Initiative
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Help Us Build the Future of
              <span className="text-primary"> Student Learning</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              PeerSpark is a student-led prototype built to help students overcome procrastination and the isolation of learning alone. Your support can help us reach more students worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:chat.priyanshuag@gmail.com?subject=I want to support PeerSpark">
                <Button size="lg" className="w-full sm:w-auto">
                  <Heart className="h-5 w-5 mr-2" />
                  Support PeerSpark
                </Button>
              </a>
              <Link href="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Our Story</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                From Procrastination to Purpose
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Hi, I'm <strong className="text-foreground">Priyanshu Agarwal</strong>, a student just like you. I built PeerSpark because I know firsthand how hard it is to study alone.
                </p>
                <p>
                  Like many students, I struggled with procrastination and felt isolated during my studies. I realized that learning becomes so much easier and more enjoyable when you have peers to study with.
                </p>
                <p>
                  That's why I created PeerSpark — a platform where students can find study partners, collaborate in real-time, and motivate each other to succeed. This isn't a big tech company; it's a passion project by a student who wants to help other students.
                </p>
                <p>
                  <strong className="text-foreground">But I can't do this alone.</strong> Running servers, powering AI features, and building new tools costs money. Your support, no matter how small, helps keep PeerSpark alive and growing.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                      PA
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Priyanshu Agarwal</h3>
                      <p className="text-sm text-muted-foreground">Founder & Developer</p>
                      <p className="text-sm text-primary">Student</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "I believe every student deserves access to a supportive learning community. PeerSpark is my way of making that happen."
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Support */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Why Support Us</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your Impact Matters</h2>
            <p className="text-muted-foreground">
              Every contribution directly helps students around the world access better learning tools.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySupport.map((reason) => (
              <Card key={reason.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <reason.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{reason.title}</h3>
                  <p className="text-sm text-muted-foreground">{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What We Need */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Funding Goals</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Where Your Support Goes</h2>
            <p className="text-muted-foreground">
              Complete transparency on how contributions help build PeerSpark.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fundingNeeds.map((need) => (
              <Card key={need.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <need.icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{need.amount}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{need.title}</h3>
                  <p className="text-sm text-muted-foreground">{need.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Roadmap</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-muted-foreground">
              Where we've been and where we're going with your help.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    milestone.achieved 
                      ? "bg-green-500 text-white" 
                      : "bg-muted border-2 border-dashed border-muted-foreground/30"
                  }`}>
                    {milestone.achieved && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className={`flex-1 pb-4 ${index < milestones.length - 1 ? "border-b" : ""}`}>
                    <h3 className={`font-semibold ${!milestone.achieved && "text-muted-foreground"}`}>
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Help */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Get Involved</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ways to Support</h2>
            <p className="text-muted-foreground">
              Not everyone can contribute financially, and that's okay! Here are other ways to help.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howToHelp.map((way) => (
              <Card key={way.title}>
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <way.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{way.title}</h3>
                  <p className="text-sm text-muted-foreground">{way.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Every Bit Helps
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Whether it's sharing with friends, giving feedback, or contributing financially — you're helping students worldwide learn better together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:chat.priyanshuag@gmail.com?subject=I want to support PeerSpark&body=Hi Priyanshu,%0A%0AI would like to support PeerSpark!">
              <Button size="lg" variant="secondary">
                <Mail className="h-5 w-5 mr-2" />
                Contact to Support
              </Button>
            </a>
            <Link href="/register">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                Join for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Contact: chat.priyanshuag@gmail.com
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
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/support" className="hover:text-foreground transition-colors font-medium text-foreground">Support Us</Link>
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
