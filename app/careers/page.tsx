"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Heart,
  Rocket,
  Users,
  Globe,
  GraduationCap,
  Coffee,
  Laptop,
  Plane,
  Baby,
  Activity,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Building,
  Code,
  Palette,
  BarChart3,
  MessageSquare,
  Shield,
  Lightbulb
} from "lucide-react"

export default function CareersPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Top-of-market salaries, equity packages, and annual bonuses tied to company performance.",
    },
    {
      icon: Activity,
      title: "Health & Wellness",
      description: "Comprehensive medical, dental, and vision insurance. Mental health support and wellness stipends.",
    },
    {
      icon: Laptop,
      title: "Remote-First",
      description: "Work from anywhere in the world. We provide home office setup allowances and coworking stipends.",
    },
    {
      icon: Plane,
      title: "Unlimited PTO",
      description: "Take the time you need to recharge. We encourage at least 4 weeks off per year.",
    },
    {
      icon: Baby,
      title: "Parental Leave",
      description: "16 weeks paid leave for all new parents, plus flexible return-to-work options.",
    },
    {
      icon: GraduationCap,
      title: "Learning Budget",
      description: "$3,000 annual budget for courses, conferences, books, and professional development.",
    },
    {
      icon: Coffee,
      title: "Team Retreats",
      description: "Quarterly virtual events and annual all-company retreats to connect in person.",
    },
    {
      icon: BookOpen,
      title: "Education Benefits",
      description: "Tuition reimbursement and student loan assistance programs.",
    },
  ]

  const values = [
    {
      icon: Users,
      title: "Students First",
      description: "Every decision we make starts with asking: 'How does this help students succeed?'",
    },
    {
      icon: Rocket,
      title: "Move Fast, Learn Faster",
      description: "We ship quickly, gather feedback, and iterate. Mistakes are learning opportunities.",
    },
    {
      icon: Heart,
      title: "Empathy & Inclusion",
      description: "We build for everyone and create a workplace where all voices are heard and valued.",
    },
    {
      icon: Lightbulb,
      title: "Think Big",
      description: "We're reimagining education. Bold ideas and moonshot thinking are encouraged.",
    },
    {
      icon: Globe,
      title: "Global Mindset",
      description: "Our team and users span the globe. We design for diverse cultures and contexts.",
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We're honest with each other, our users, and the world. We earn trust through actions.",
    },
  ]

  const departments = [
    { name: "Engineering", icon: Code, openRoles: 8 },
    { name: "Product", icon: Lightbulb, openRoles: 3 },
    { name: "Design", icon: Palette, openRoles: 2 },
    { name: "Data & AI", icon: BarChart3, openRoles: 4 },
    { name: "Marketing", icon: MessageSquare, openRoles: 2 },
    { name: "Operations", icon: Building, openRoles: 3 },
  ]

  const openPositions = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote (US/EU)",
      type: "Full-time",
      salary: "$150K - $200K",
      description: "Build scalable features for millions of students. React, Node.js, and distributed systems experience required.",
    },
    {
      title: "Staff Backend Engineer",
      department: "Engineering",
      location: "Remote (Global)",
      type: "Full-time",
      salary: "$180K - $240K",
      description: "Lead architecture decisions for our real-time collaboration platform. 8+ years experience.",
    },
    {
      title: "Mobile Engineer (React Native)",
      department: "Engineering",
      location: "Remote (US/EU)",
      type: "Full-time",
      salary: "$140K - $180K",
      description: "Own our mobile experience across iOS and Android. Strong React Native background required.",
    },
    {
      title: "Machine Learning Engineer",
      department: "Data & AI",
      location: "Remote (Global)",
      type: "Full-time",
      salary: "$170K - $220K",
      description: "Build and deploy ML models for personalized learning and intelligent matching.",
    },
    {
      title: "AI Research Scientist",
      department: "Data & AI",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$200K - $280K",
      description: "Research and develop next-generation AI tutoring systems. PhD preferred.",
    },
    {
      title: "Senior Product Designer",
      department: "Design",
      location: "Remote (US/EU)",
      type: "Full-time",
      salary: "$140K - $180K",
      description: "Design intuitive experiences for our core collaboration features. 5+ years in B2C products.",
    },
    {
      title: "Product Manager, Growth",
      department: "Product",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$150K - $190K",
      description: "Drive acquisition and activation funnels. Data-driven mindset essential.",
    },
    {
      title: "Senior Product Manager, AI",
      department: "Product",
      location: "Remote (Global)",
      type: "Full-time",
      salary: "$160K - $200K",
      description: "Define the roadmap for our AI-powered learning features. AI/ML product experience required.",
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote (Global)",
      type: "Full-time",
      salary: "$130K - $170K",
      description: "Scale our infrastructure to support millions of concurrent users. AWS, Kubernetes expertise.",
    },
    {
      title: "Content Marketing Manager",
      department: "Marketing",
      location: "Remote (US/EU)",
      type: "Full-time",
      salary: "$90K - $130K",
      description: "Create compelling content that resonates with students and educators worldwide.",
    },
    {
      title: "Customer Success Manager",
      department: "Operations",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$80K - $110K",
      description: "Ensure institutional partners achieve their goals with PeerSpark.",
    },
    {
      title: "Data Analyst",
      department: "Data & AI",
      location: "Remote (Global)",
      type: "Full-time",
      salary: "$100K - $140K",
      description: "Turn data into insights that drive product and business decisions.",
    },
  ]

  const stats = [
    { number: "50+", label: "Team Members" },
    { number: "15+", label: "Countries" },
    { number: "4.8", label: "Glassdoor Rating" },
    { number: "95%", label: "Recommend to Friends" },
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
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">We're Hiring!</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Help Us Reimagine
              <span className="text-primary"> Education</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join a team of passionate educators, engineers, and dreamers building the future of collaborative learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#open-positions">
                <Button size="lg" className="w-full sm:w-auto">
                  View Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Our Mission</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                We're on a Mission to Make Learning Social Again
              </h2>
              <p className="text-muted-foreground mb-4">
                Education is transforming. The future of learning isn't sitting alone in a lecture hall—it's collaborative, global, and powered by AI. At PeerSpark, we're building the platform that makes this vision a reality.
              </p>
              <p className="text-muted-foreground mb-6">
                We believe every student deserves access to a supportive learning community, regardless of where they are in the world. We're looking for people who share this vision and want to build technology that matters.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Join 50+ team members worldwide</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6">
                <Globe className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Global Impact</h3>
                <p className="text-sm text-muted-foreground">50,000+ students in 120+ countries</p>
              </Card>
              <Card className="p-6">
                <Rocket className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Fast Growing</h3>
                <p className="text-sm text-muted-foreground">3x growth in the past year</p>
              </Card>
              <Card className="p-6">
                <Heart className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Well Funded</h3>
                <p className="text-sm text-muted-foreground">$50M Series B from top VCs</p>
              </Card>
              <Card className="p-6">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Remote-First</h3>
                <p className="text-sm text-muted-foreground">Team across 15+ countries</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What We Stand For</h2>
            <p className="text-muted-foreground">
              Our values guide how we work, what we build, and who we hire.
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

      {/* Benefits */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Benefits & Perks</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">We Take Care of Our Team</h2>
            <p className="text-muted-foreground">
              Competitive compensation is just the beginning. Here's what we offer:
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Teams</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Find Your Team</h2>
            <p className="text-muted-foreground">
              Explore opportunities across our departments.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept) => (
              <a 
                key={dept.name}
                href="#open-positions"
                className="block group"
              >
                <Card className="p-4 text-center hover:shadow-md transition-shadow hover:border-primary/50">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                    <dept.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{dept.name}</h3>
                  <p className="text-xs text-primary">{dept.openRoles} open roles</p>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Open Positions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join Our Team</h2>
            <p className="text-muted-foreground">
              We're looking for talented people to help us build the future of education.
            </p>
          </div>

          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <a href="#" className="block p-6 group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {position.title}
                          </h3>
                          <Badge variant="outline">{position.department}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {position.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {position.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {position.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {position.salary}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Apply Now
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Don't see a role that fits? We're always looking for exceptional people.
            </p>
            <Button variant="outline">
              Send General Application
            </Button>
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4">Hiring Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What to Expect</h2>
            <p className="text-muted-foreground">
              Our interview process is designed to be thorough but respectful of your time.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Application Review",
                description: "Our team reviews every application carefully. We look for potential, not just credentials.",
                time: "1-2 weeks",
              },
              {
                step: "2",
                title: "Intro Call",
                description: "A 30-minute call with a recruiter to learn about you and share more about PeerSpark.",
                time: "30 min",
              },
              {
                step: "3",
                title: "Team Interviews",
                description: "2-3 interviews with team members. May include a take-home project or live exercise.",
                time: "2-3 hours total",
              },
              {
                step: "4",
                title: "Final Round",
                description: "Meet with leadership and get a feel for our culture. This is mutual—we want you to choose us too.",
                time: "1 hour",
              },
            ].map((step) => (
              <Card key={step.step} className="p-6 relative">
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                  <Badge variant="outline" className="text-xs">{step.time}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join us in building technology that helps millions of students learn better, together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#open-positions">
              <Button size="lg" variant="secondary">
                View Open Positions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/about">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10">
                Learn More About Us
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
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/careers" className="hover:text-foreground transition-colors font-medium text-foreground">Careers</Link>
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
