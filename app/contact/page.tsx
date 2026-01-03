"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { 
  Zap, 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Phone,
  MapPin,
  Clock,
  Send,
  HelpCircle,
  Shield,
  Users,
  Building,
  AlertTriangle,
  FileText,
  Globe,
  Twitter,
  Linkedin,
  Github,
  CheckCircle
} from "lucide-react"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.category || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setSubmitted(true)
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24-48 hours.",
    })
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "For general inquiries and support",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "24-48 hours",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Data protection and privacy concerns",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "24-48 hours",
    },
    {
      icon: FileText,
      title: "Legal Department",
      description: "Legal inquiries and DMCA notices",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "3-5 business days",
    },
    {
      icon: Building,
      title: "Partnerships",
      description: "Educational institutions & business",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "2-3 business days",
    },
    {
      icon: Users,
      title: "Press & Media",
      description: "Media inquiries and press kit",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "24-48 hours",
    },
    {
      icon: AlertTriangle,
      title: "Report Abuse",
      description: "Report violations or safety concerns",
      contact: "chat.priyanshuag@gmail.com",
      href: "mailto:chat.priyanshuag@gmail.com",
      response: "Within 24 hours",
    },
  ]

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "account", label: "Account Issues" },
    { value: "billing", label: "Billing & Subscriptions" },
    { value: "feedback", label: "Product Feedback" },
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "partnership", label: "Partnership Inquiry" },
    { value: "educational", label: "Educational Institution" },
    { value: "privacy", label: "Privacy Concern" },
    { value: "legal", label: "Legal Inquiry" },
    { value: "press", label: "Press / Media" },
    { value: "other", label: "Other" },
  ]

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password'. You'll receive an email with reset instructions.",
    },
    {
      question: "How do I delete my account?",
      answer: "Navigate to Settings → Account → Delete Account. You can download your data before deletion.",
    },
    {
      question: "Is PeerSpark free to use?",
      answer: "Yes! Core features are free. Premium plans offer enhanced features and increased limits.",
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Use the report button on any content, or email chat.priyanshuag@gmail.com with details.",
    },
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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              Have questions, feedback, or need assistance? We're here to help. Reach out to our team and we'll respond as quickly as possible.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Methods Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Contact Departments</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactMethods.map((method) => (
              <Card key={method.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <method.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{method.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                      <a 
                        href={method.href}
                        className="text-sm text-primary hover:underline font-medium block truncate"
                      >
                        {method.contact}
                      </a>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Response: {method.response}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send Us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll get back to you within 24-48 hours.
                    </p>
                    <Button onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: "", email: "", subject: "", category: "", message: "" })
                    }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Please provide as much detail as possible..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our{" "}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Office Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Our Office
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Headquarters</h4>
                  <p className="text-sm text-muted-foreground">
                    PeerSpark Inc.<br />
                    123 Education Lane, Suite 456<br />
                    San Francisco, CA 94102<br />
                    United States
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                    Saturday - Sunday: Closed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    * Email support available 24/7
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Quick Answers
                </CardTitle>
                <CardDescription>
                  Common questions answered instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-sm mb-1">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
                <Link href="/help">
                  <Button variant="outline" className="w-full mt-2">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Visit Help Center
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Connect With Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://twitter.com/peerspark" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                  <a 
                    href="https://linkedin.com/company/peerspark" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                  <a 
                    href="https://github.com/peerspark" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Follow us for product updates, tips, and educational content.
                </p>
              </CardContent>
            </Card>

            {/* Emergency Notice */}
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Urgent Safety Concerns</h4>
                    <p className="text-sm text-muted-foreground">
                      If you're experiencing a safety emergency, please contact local emergency services. For urgent platform safety issues, email{" "}
                      <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>
                      {" "}for priority response.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PeerSpark</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors font-medium text-foreground">Contact</Link>
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
