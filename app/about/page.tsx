"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
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
  Star,
  ArrowRight,
  Linkedin,
  Twitter
} from "lucide-react"

export default function AboutPage() {
  const stats = [
    { number: "50,000+", label: "Active Students", icon: Users },
    { number: "10,000+", label: "Study Pods", icon: BookOpen },
    { number: "120+", label: "Countries", icon: Globe },
    { number: "95%", label: "Satisfaction Rate", icon: Star },
  ]

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe learning is inherently social. Our platform is designed to foster genuine connections between learners worldwide, creating supportive communities that accelerate growth.",
    },
    {
      icon: Lightbulb,
      title: "Innovation in Education",
      description: "We continuously push the boundaries of educational technology, integrating AI, real-time collaboration, and gamification to make learning more effective and engaging.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Student safety is paramount. We maintain rigorous privacy standards, content moderation, and security measures to create a safe space for learning.",
    },
    {
      icon: Globe,
      title: "Accessible to All",
      description: "Quality education should be available to everyone. We offer robust free features and work with institutions to ensure equitable access globally.",
    },
    {
      icon: Heart,
      title: "Student Success",
      description: "Every feature we build is evaluated by one metric: does it help students succeed? We're obsessed with learning outcomes and student well-being.",
    },
    {
      icon: Rocket,
      title: "Continuous Improvement",
      description: "We iterate rapidly based on user feedback, research, and emerging best practices in learning science. The platform evolves with our community.",
    },
  ]

  const milestones = [
    {
      year: "2022",
      title: "The Beginning",
      description: "Founded by a team of educators and technologists frustrated with isolated learning experiences during the pandemic.",
    },
    {
      year: "2023",
      title: "Public Launch",
      description: "Launched publicly with Study Pods, real-time chat, and Resource Vault. Reached 10,000 users in the first month.",
    },
    {
      year: "2024",
      title: "AI Integration",
      description: "Introduced AI Assistant powered by advanced language models. Launched mobile apps and video conferencing.",
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Expanded to 120+ countries. Partnered with 500+ educational institutions. Reached 50,000 active students.",
    },
    {
      year: "2026",
      title: "The Future",
      description: "Launching advanced learning analytics, adaptive study plans, and institutional dashboard for educators.",
    },
  ]

  const team = [
    {
      name: "Dr. Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former Stanford professor with 15+ years in educational technology research. PhD in Learning Sciences.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Marcus Johnson",
      role: "CTO & Co-Founder",
      bio: "Ex-Google engineer who led education initiatives. Passionate about making technology accessible.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Chief Learning Officer",
      bio: "Former head of curriculum at Khan Academy. Expert in learning science and pedagogical design.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Aiden Park",
      role: "VP of Engineering",
      bio: "Built scalable education platforms at Coursera and Duolingo. Leads our engineering team.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "Dr. Priya Sharma",
      role: "VP of AI & Research",
      bio: "AI researcher from MIT. Pioneering personalized learning algorithms and natural language tutoring.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
    {
      name: "James Williams",
      role: "VP of Product",
      bio: "Former product lead at Notion. Obsessed with crafting intuitive user experiences for learners.",
      avatar: "/placeholder.svg",
      linkedin: "#",
      twitter: "#",
    },
  ]

  const partners = [
    "Stanford University",
    "MIT OpenCourseWare",
    "Google for Education",
    "Microsoft Learn",
    "Khan Academy",
    "UNESCO",
    "Bill & Melinda Gates Foundation",
    "Coursera",
  ]

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

      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4">About PeerSpark</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Reimagining Education Through
              <span className="text-primary"> Peer Collaboration</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're building the world's most powerful platform for collaborative learning, connecting students across the globe to study, grow, and succeed together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Join Our Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/careers">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  We're Hiring
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Our Mission</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Empowering Every Student to Reach Their Full Potential
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Education has always been social. The best learning happens when curious minds come together to explore, question, and grow. Yet too often, students study in isolation, lacking the support and motivation that comes from a community.
                </p>
                <p>
                  PeerSpark was born from a simple belief: <strong className="text-foreground">no student should have to learn alone</strong>. We're building technology that brings students together, regardless of where they are in the world, to form meaningful study partnerships and communities.
                </p>
                <p>
                  Our platform combines the power of peer collaboration with cutting-edge AI to create personalized, engaging, and effective learning experiences. From study pods that match you with the perfect study partners to AI assistants that adapt to your learning style—we're reimagining what's possible in education.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <GraduationCap className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Student-Centered</h3>
                <p className="text-sm text-muted-foreground">Every feature designed with students' needs first</p>
              </Card>
              <Card className="p-6 text-center">
                <Brain className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Research-Backed</h3>
                <p className="text-sm text-muted-foreground">Built on proven learning science principles</p>
              </Card>
              <Card className="p-6 text-center">
                <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Outcome-Focused</h3>
                <p className="text-sm text-muted-foreground">Measurable improvement in learning outcomes</p>
              </Card>
              <Card className="p-6 text-center">
                <Target className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Goal-Oriented</h3>
                <p className="text-sm text-muted-foreground">Tools to set, track, and achieve study goals</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
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
                  <div className="p-3 rounded-lg bg-primary/10">
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

      {/* Timeline Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Journey</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">From Idea to Global Platform</h2>
            <p className="text-muted-foreground">
              A timeline of key milestones in our mission to transform education.
            </p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-border" />
            
            <div className="space-y-8 md:space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <Card className="inline-block p-6 max-w-md">
                      <Badge variant="outline" className="mb-2">{milestone.year}</Badge>
                      <h3 className="font-semibold text-lg mb-2">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </Card>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {milestone.year.slice(-2)}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Team</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet the People Behind PeerSpark</h2>
            <p className="text-muted-foreground">
              A diverse team of educators, engineers, and dreamers united by a passion for transforming education.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-lg">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                  <div className="flex justify-center gap-2">
                    <a href={member.linkedin} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                    </a>
                    <a href={member.twitter} className="p-2 rounded-full hover:bg-muted transition-colors">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/careers">
              <Button>
                Join Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Partners</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Leading Institutions</h2>
            <p className="text-muted-foreground">
              We're proud to work with world-class educational organizations.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {partners.map((partner) => (
              <div
                key={partner}
                className="px-6 py-3 rounded-lg bg-muted/50 text-muted-foreground font-medium text-sm"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of students already using PeerSpark to achieve their academic goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                Contact Sales
              </Button>
            </Link>
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
              <Link href="/about" className="hover:text-foreground transition-colors font-medium text-foreground">About</Link>
              <Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
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
