"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  FileText, 
  Users, 
  Shield, 
  AlertTriangle,
  Scale,
  Ban,
  CreditCard,
  Globe,
  Gavel,
  BookOpen,
  MessageSquare,
  Copyright,
  Clock,
  CheckCircle2
} from "lucide-react"

export default function TermsOfServicePage() {
  const lastUpdated = "January 1, 2026"
  const effectiveDate = "January 1, 2026"

  const tableOfContents = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility" },
    { id: "account", title: "3. Account Registration" },
    { id: "services", title: "4. Description of Services" },
    { id: "user-conduct", title: "5. User Conduct" },
    { id: "content", title: "6. User Content" },
    { id: "intellectual-property", title: "7. Intellectual Property" },
    { id: "payments", title: "8. Payments and Subscriptions" },
    { id: "termination", title: "9. Termination" },
    { id: "disclaimers", title: "10. Disclaimers" },
    { id: "limitation", title: "11. Limitation of Liability" },
    { id: "indemnification", title: "12. Indemnification" },
    { id: "disputes", title: "13. Dispute Resolution" },
    { id: "general", title: "14. General Provisions" },
    { id: "contact", title: "15. Contact Information" },
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-muted-foreground mb-4">
              These Terms of Service govern your use of PeerSpark. Please read them carefully before using our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span><strong>Last Updated:</strong> {lastUpdated}</span>
              <span>•</span>
              <span><strong>Effective:</strong> {effectiveDate}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Table of Contents</h3>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Key Points Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Key Points Summary
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Age Requirement:</strong> You must be at least 13 years old (16 in EEA) to use PeerSpark.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Educational Use:</strong> PeerSpark is for legitimate educational and collaborative purposes.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Copyright className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Your Content:</strong> You own your content but grant us license to display it on the platform.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Community Standards:</strong> Respect others and follow our Community Guidelines.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 1: Acceptance of Terms */}
            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Acceptance of Terms
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                <p>
                  Welcome to PeerSpark. These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and PeerSpark Inc. ("PeerSpark," "Company," "we," "us," or "our") governing your access to and use of the PeerSpark platform, including our website, mobile applications, APIs, and all related services (collectively, the "Services").
                </p>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">By accessing or using our Services, you agree that:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>You have read, understood, and agree to be bound by these Terms</li>
                      <li>You agree to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link></li>
                      <li>You will comply with our <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link></li>
                      <li>You have the legal capacity to enter into this Agreement</li>
                    </ul>
                  </CardContent>
                </Card>
                <p>
                  If you do not agree to these Terms, you must not access or use our Services. We reserve the right to modify these Terms at any time. Material changes will be notified via email or prominent notice on the platform at least 30 days before taking effect.
                </p>
              </div>
            </section>

            {/* Section 2: Eligibility */}
            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Eligibility
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">2.1 Age Requirements</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li><strong>General:</strong> You must be at least 13 years of age to use PeerSpark</li>
                      <li><strong>European Economic Area:</strong> You must be at least 16 years of age, or have verifiable parental consent</li>
                      <li><strong>Minors (13-17):</strong> If you are between 13 and 17 (or 16-17 in EEA), you represent that your parent or legal guardian has reviewed and agrees to these Terms on your behalf</li>
                      <li><strong>Educational Institutions:</strong> If you access PeerSpark through a school or educational institution, your institution may have agreed to these Terms on your behalf</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">2.2 Additional Requirements</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li>You must not be prohibited from using our Services under applicable laws</li>
                      <li>You must not have been previously banned or suspended from PeerSpark</li>
                      <li>You must not be a competitor using the Services for competitive intelligence</li>
                      <li>If using on behalf of an organization, you must have authority to bind that organization to these Terms</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 3: Account Registration */}
            <section id="account" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                Account Registration
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">3.1 Account Creation</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      To access most features of PeerSpark, you must create an account. When creating an account:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>You must provide accurate, current, and complete information</li>
                      <li>You must maintain and promptly update your account information</li>
                      <li>You may register using email/password or through supported OAuth providers (Google, Apple)</li>
                      <li>You may only create one personal account unless expressly permitted</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">3.2 Account Security</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                      <li>You are responsible for all activities that occur under your account</li>
                      <li>You must immediately notify us of any unauthorized access or security breach</li>
                      <li>We strongly recommend enabling two-factor authentication when available</li>
                      <li>You must not share your account credentials with others</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">3.3 Account Types</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li><strong>Individual Accounts:</strong> For personal educational use</li>
                      <li><strong>Institutional Accounts:</strong> For schools, universities, and educational organizations</li>
                      <li><strong>Educator Accounts:</strong> For teachers and instructors with additional moderation capabilities</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 4: Description of Services */}
            <section id="services" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                Description of Services
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  PeerSpark is a collaborative learning platform that provides the following features and services:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Study Pods
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Create and join collaborative study groups organized by subject, topic, or goal. Includes real-time chat, video conferencing, and shared resources.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        AI Assistant
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        AI-powered learning assistant for answering questions, generating study materials, and providing personalized recommendations.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Resource Vault
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Centralized repository for uploading, organizing, and sharing study materials, notes, flashcards, and educational resources.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Scheduling & Calendar
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Calendar integration for scheduling study sessions, setting reminders, and coordinating with pod members.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Service Modifications:</strong> We reserve the right to modify, suspend, or discontinue any part of our Services at any time. We will provide reasonable notice for material changes that affect your use of the Services.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 5: User Conduct */}
            <section id="user-conduct" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">5</span>
                User Conduct
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  You agree to use PeerSpark responsibly and in compliance with all applicable laws. Our full <Link href="/community-guidelines" className="text-primary hover:underline">Community Guidelines</Link> provide detailed standards.
                </p>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Acceptable Use
                    </h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Using the platform for legitimate educational and learning purposes</li>
                      <li>Collaborating respectfully with other users</li>
                      <li>Sharing original or properly licensed educational content</li>
                      <li>Providing constructive feedback and support to peers</li>
                      <li>Respecting the privacy and boundaries of other users</li>
                      <li>Reporting violations of these Terms or Community Guidelines</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-500/30">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Ban className="h-5 w-5 text-red-500" />
                      Prohibited Activities
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">You must not:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Violate any applicable laws or regulations</li>
                      <li>Harass, bully, intimidate, or threaten other users</li>
                      <li>Post content that is hateful, discriminatory, or promotes violence</li>
                      <li>Share sexually explicit or pornographic content</li>
                      <li>Engage in academic dishonesty or facilitate cheating</li>
                      <li>Impersonate another person or entity</li>
                      <li>Spam, advertise, or engage in unauthorized commercial activities</li>
                      <li>Upload malware, viruses, or malicious code</li>
                      <li>Attempt to hack, probe, or compromise our systems</li>
                      <li>Scrape, data mine, or extract content without authorization</li>
                      <li>Circumvent security features or access controls</li>
                      <li>Create multiple accounts to evade bans or restrictions</li>
                      <li>Share copyrighted materials without proper authorization</li>
                      <li>Use automated bots or scripts without permission</li>
                      <li>Interfere with other users' enjoyment of the Services</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      AI Assistant Usage
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">When using the AI Assistant:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Do not use AI to complete assignments in violation of academic integrity policies</li>
                      <li>Verify AI-generated information before relying on it</li>
                      <li>Do not attempt to manipulate AI to produce harmful or inappropriate content</li>
                      <li>AI responses are not professional advice (legal, medical, financial)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 6: User Content */}
            <section id="content" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">6</span>
                User Content
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">6.1 Your Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      You retain ownership of all content you create and upload to PeerSpark ("User Content"), including notes, study materials, messages, and other contributions. PeerSpark does not claim ownership over your User Content.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">6.2 License Grant to PeerSpark</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      By uploading User Content, you grant PeerSpark a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Host, store, cache, and backup your content</li>
                      <li>Display and distribute your content according to your sharing settings</li>
                      <li>Modify your content for technical purposes (formatting, optimization)</li>
                      <li>Use anonymized content for improving our Services and research</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      This license terminates when you delete your content or account, except for copies made by other users or required for legal compliance.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">6.3 License to Other Users</h3>
                    <p className="text-sm text-muted-foreground">
                      When you share content in pods or publicly, you grant other users a non-exclusive license to view, access, and use that content for educational purposes according to your sharing settings. You may choose to share content under Creative Commons or other licenses.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">6.4 Content Representations</h3>
                    <p className="text-sm text-muted-foreground mb-2">You represent and warrant that:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>You own or have the right to share all User Content you upload</li>
                      <li>Your content does not infringe any third-party rights</li>
                      <li>Your content complies with these Terms and Community Guidelines</li>
                      <li>You have obtained necessary consents from individuals appearing in your content</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">6.5 Content Moderation</h3>
                    <p className="text-sm text-muted-foreground">
                      We reserve the right to review, remove, or disable access to any content that violates these Terms or that we determine to be harmful, without prior notice. We are not obligated to monitor all content but may do so at our discretion.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 7: Intellectual Property */}
            <section id="intellectual-property" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">7</span>
                Intellectual Property
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">7.1 PeerSpark Property</h3>
                    <p className="text-sm text-muted-foreground">
                      The PeerSpark name, logo, platform design, features, and all related intellectual property are owned by PeerSpark Inc. and protected by copyright, trademark, and other intellectual property laws. You may not use our trademarks without prior written consent.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">7.2 Limited License</h3>
                    <p className="text-sm text-muted-foreground">
                      Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use our Services for personal, non-commercial educational purposes. This license does not include the right to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                      <li>Modify, copy, or create derivative works of our Services</li>
                      <li>Reverse engineer or attempt to extract source code</li>
                      <li>Remove any proprietary notices or labels</li>
                      <li>Use our Services for competitive purposes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">7.3 Copyright Infringement (DMCA)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      We respect intellectual property rights and expect users to do the same. If you believe content infringes your copyright, please submit a DMCA notice to our designated agent:
                    </p>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded mt-2">
                      <p><strong>DMCA Agent:</strong> Legal Department</p>
                      <p><strong>Email:</strong> <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a></p>
                      <p><strong>Address:</strong> 123 Education Lane, Suite 456, San Francisco, CA 94102</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      See our <Link href="/dmca" className="text-primary hover:underline">DMCA Policy</Link> for complete procedures and counter-notification information.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">7.4 Feedback</h3>
                    <p className="text-sm text-muted-foreground">
                      If you provide feedback, suggestions, or ideas about our Services, you grant us a perpetual, worldwide, royalty-free license to use, modify, and incorporate such feedback without obligation to you.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 8: Payments and Subscriptions */}
            <section id="payments" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">8</span>
                Payments and Subscriptions
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      8.1 Free and Paid Services
                    </h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Free Tier:</strong> Core features are available at no cost with usage limits</li>
                      <li><strong>Premium Plans:</strong> Enhanced features, increased limits, and priority support</li>
                      <li><strong>Institutional Plans:</strong> Custom pricing for educational organizations</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">8.2 Billing and Payment</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                      <li>All fees are stated in USD unless otherwise specified</li>
                      <li>Payments are processed by secure third-party payment processors</li>
                      <li>You authorize us to charge your payment method for recurring subscriptions</li>
                      <li>Applicable taxes will be added to your subscription fees</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">8.3 Cancellation and Refunds</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>You may cancel your subscription at any time through account settings</li>
                      <li>Cancellation takes effect at the end of the current billing period</li>
                      <li>No refunds for partial billing periods unless required by law</li>
                      <li>14-day money-back guarantee for first-time annual subscribers</li>
                      <li>We reserve the right to offer promotional pricing with specific terms</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">8.4 Price Changes</h3>
                    <p className="text-sm text-muted-foreground">
                      We may change subscription prices with 30 days' notice. Price changes apply to the next billing cycle. Existing subscribers are grandfathered into their current pricing for the remainder of their term.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 9: Termination */}
            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">9</span>
                Termination
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">9.1 Termination by You</h3>
                    <p className="text-sm text-muted-foreground">
                      You may terminate your account at any time through Settings → Account → Delete Account. Upon termination, your right to use the Services immediately ceases. You may download your data before deletion.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">9.2 Termination by PeerSpark</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      We may suspend or terminate your account if you:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Violate these Terms or Community Guidelines</li>
                      <li>Engage in fraudulent or illegal activities</li>
                      <li>Pose a risk to platform security or other users</li>
                      <li>Have an account inactive for more than 24 months</li>
                      <li>Fail to pay subscription fees after notice and grace period</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      We will provide notice before termination when feasible, except in cases of severe violations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">9.3 Effects of Termination</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>All licenses granted to you terminate immediately</li>
                      <li>Your User Content may be deleted after a 30-day grace period</li>
                      <li>Content shared in pods may remain visible to pod members</li>
                      <li>Sections of these Terms that should survive termination will remain in effect</li>
                      <li>Outstanding payment obligations remain due</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 10: Disclaimers */}
            <section id="disclaimers" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">10</span>
                Disclaimers
              </h2>
              <div className="space-y-4">
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      "AS IS" Disclaimer
                    </h3>
                    <p className="text-sm text-muted-foreground uppercase">
                      THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Specific Disclaimers</h3>
                    <p className="text-sm text-muted-foreground mb-2">We do not warrant that:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>The Services will be uninterrupted, error-free, or completely secure</li>
                      <li>Results obtained from the Services will be accurate or reliable</li>
                      <li>AI-generated content will be correct, complete, or appropriate</li>
                      <li>Any errors or defects will be corrected</li>
                      <li>The Services will meet your specific requirements</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Educational Disclaimer</h3>
                    <p className="text-sm text-muted-foreground">
                      PeerSpark is a supplementary educational tool. We do not guarantee academic success, grades, or specific learning outcomes. Content shared by users and generated by AI should be verified independently. PeerSpark is not a substitute for professional educational instruction.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 11: Limitation of Liability */}
            <section id="limitation" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">11</span>
                Limitation of Liability
              </h2>
              <div className="space-y-4">
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground uppercase">
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PEERSPARK, ITS AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2 uppercase">
                      <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES</li>
                      <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES</li>
                      <li>ANY CONTENT OBTAINED FROM THE SERVICES</li>
                      <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Liability Cap</h3>
                    <p className="text-sm text-muted-foreground">
                      Our total liability for any claims arising from or relating to these Terms or the Services shall not exceed the greater of: (a) the amount you paid to PeerSpark in the twelve (12) months preceding the claim, or (b) one hundred dollars ($100 USD).
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">Exceptions</h3>
                    <p className="text-sm text-muted-foreground">
                      Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law. Nothing in these Terms shall limit liability for fraud, gross negligence, or willful misconduct.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 12: Indemnification */}
            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">12</span>
                Indemnification
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      You agree to indemnify, defend, and hold harmless PeerSpark and its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or relating to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Your violation of these Terms</li>
                      <li>Your User Content</li>
                      <li>Your violation of any third-party rights</li>
                      <li>Your violation of any applicable laws or regulations</li>
                      <li>Your use of the Services in an unauthorized manner</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 13: Dispute Resolution */}
            <section id="disputes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">13</span>
                Dispute Resolution
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      13.1 Informal Resolution
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Before initiating formal dispute resolution, you agree to contact us at <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a> and attempt to resolve the dispute informally for at least 30 days.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-primary" />
                      13.2 Arbitration Agreement
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      If informal resolution is unsuccessful, you and PeerSpark agree to resolve disputes through binding individual arbitration rather than in court, except:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Claims that qualify for small claims court</li>
                      <li>Claims for injunctive relief for intellectual property violations</li>
                      <li>Where prohibited by applicable law</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Arbitration shall be administered by JAMS under its Comprehensive Arbitration Rules, with the arbitration taking place in San Francisco, California, or remotely as agreed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      13.3 Class Action Waiver
                    </h3>
                    <p className="text-sm text-muted-foreground uppercase">
                      YOU AND PEERSPARK AGREE THAT ANY ARBITRATION OR LEGAL PROCEEDING SHALL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. IF THIS WAIVER IS FOUND UNENFORCEABLE, THE ENTIRE ARBITRATION AGREEMENT SHALL BE VOID.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3">13.4 Governing Law</h3>
                    <p className="text-sm text-muted-foreground">
                      These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law principles. For users in the EU, applicable EU consumer protection laws apply.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 14: General Provisions */}
            <section id="general" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">14</span>
                General Provisions
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Entire Agreement</h4>
                    <p className="text-sm text-muted-foreground">
                      These Terms, together with the Privacy Policy and Community Guidelines, constitute the entire agreement between you and PeerSpark.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Severability</h4>
                    <p className="text-sm text-muted-foreground">
                      If any provision is found unenforceable, the remaining provisions remain in full force and effect.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Waiver</h4>
                    <p className="text-sm text-muted-foreground">
                      Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      You may not assign these Terms without our consent. We may assign our rights and obligations without restriction.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Force Majeure</h4>
                    <p className="text-sm text-muted-foreground">
                      We are not liable for delays or failures due to circumstances beyond our reasonable control.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">No Third-Party Beneficiaries</h4>
                    <p className="text-sm text-muted-foreground">
                      These Terms do not create any third-party beneficiary rights.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 15: Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">15</span>
                Contact Information
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    If you have questions about these Terms, please contact us:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Legal Inquiries:</strong></p>
                      <p className="text-muted-foreground">
                        <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>
                      </p>
                    </div>
                    <div>
                      <p><strong>General Support:</strong></p>
                      <p className="text-muted-foreground">
                        <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p><strong>Mailing Address:</strong></p>
                      <p className="text-muted-foreground">
                        PeerSpark Inc.<br />
                        Attn: Legal Department<br />
                        123 Education Lane, Suite 456<br />
                        San Francisco, CA 94102, United States
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Version History */}
            <section className="border-t pt-8 mt-12">
              <h3 className="font-semibold mb-4 text-muted-foreground">Version History</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>v2.0 (January 1, 2026):</strong> Comprehensive update with enhanced arbitration terms and global compliance</p>
                <p><strong>v1.0 (January 1, 2024):</strong> Initial Terms of Service</p>
              </div>
            </section>
          </main>
        </div>
      </div>

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
              <Link href="/terms" className="hover:text-foreground transition-colors font-medium text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
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
