"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Globe, 
  Users, 
  Bell,
  Settings,
  FileText,
  Scale,
  Mail,
  MapPin
} from "lucide-react"

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 1, 2026"
  const effectiveDate = "January 1, 2026"

  const tableOfContents = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-we-collect", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How We Use Your Information" },
    { id: "information-sharing", title: "4. Information Sharing and Disclosure" },
    { id: "data-retention", title: "5. Data Retention" },
    { id: "data-security", title: "6. Data Security" },
    { id: "your-rights", title: "7. Your Rights and Choices" },
    { id: "international-transfers", title: "8. International Data Transfers" },
    { id: "children-privacy", title: "9. Children's Privacy" },
    { id: "cookies", title: "10. Cookies and Tracking Technologies" },
    { id: "third-party", title: "11. Third-Party Services" },
    { id: "changes", title: "12. Changes to This Policy" },
    { id: "contact", title: "13. Contact Us" },
    { id: "jurisdiction", title: "14. Jurisdiction-Specific Rights" },
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Your privacy is fundamental to our mission. This policy explains how PeerSpark collects, uses, protects, and shares your personal information.
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
            {/* Quick Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Privacy at a Glance
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Database className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Data Collection:</strong> We collect only what's necessary for your learning experience.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Security:</strong> Industry-standard encryption protects your data at rest and in transit.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Transparency:</strong> You can access, export, or delete your data at any time.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong>Compliance:</strong> GDPR, CCPA, and other global privacy regulations.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 1: Introduction */}
            <section id="introduction" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                Introduction
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
                <p>
                  Welcome to PeerSpark ("Company," "we," "us," or "our"). PeerSpark is a collaborative learning platform designed to connect students worldwide through study pods, AI-powered assistance, and shared educational resources.
                </p>
                <p>
                  This Privacy Policy describes how we collect, use, disclose, and otherwise process personal information in connection with our websites, mobile applications, and other online services that link to this Privacy Policy (collectively, the "Services"), as well as offline services and interactions.
                </p>
                <p>
                  By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
                </p>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm">
                      <strong>Scope:</strong> This Privacy Policy applies to all users of PeerSpark Services globally, including students, educators, institutions, and visitors. For users in specific jurisdictions, additional rights and disclosures may apply as outlined in Section 14.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="information-we-collect" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">2.1 Information You Provide Directly</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Account Information</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Full name, username, and display name</li>
                          <li>Email address and phone number (optional)</li>
                          <li>Password (encrypted and hashed)</li>
                          <li>Profile photo and bio</li>
                          <li>Educational institution and field of study</li>
                          <li>Academic level and graduation year</li>
                          <li>Time zone and language preferences</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">User-Generated Content</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Study materials, notes, and documents uploaded to the Resource Vault</li>
                          <li>Messages sent through chat and discussion features</li>
                          <li>Posts, comments, and reactions in the feed</li>
                          <li>Calendar events and study schedules</li>
                          <li>Goals, pledges, and check-ins within study pods</li>
                          <li>Whiteboard drawings and collaborative content</li>
                          <li>Video and audio recordings from study sessions (with consent)</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Communications</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Inquiries and support requests submitted through contact forms</li>
                          <li>Feedback, surveys, and reviews you provide</li>
                          <li>Email correspondence with our team</li>
                          <li>Reports of policy violations or abuse</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Payment Information</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Billing name and address</li>
                          <li>Payment method details (processed securely by third-party payment processors)</li>
                          <li>Transaction history and invoices</li>
                          <li>Subscription preferences and plan details</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2.2 Information Collected Automatically</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Device and Technical Information</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Device type, operating system, and version</li>
                          <li>Browser type and version</li>
                          <li>Unique device identifiers</li>
                          <li>IP address and approximate location (city/region level)</li>
                          <li>Network information and connection type</li>
                          <li>Screen resolution and display settings</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Usage Information</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Pages visited and features accessed</li>
                          <li>Time spent on different sections</li>
                          <li>Click patterns and navigation paths</li>
                          <li>Search queries within the platform</li>
                          <li>Study session duration and frequency</li>
                          <li>Pod participation metrics</li>
                          <li>Content interaction (views, downloads, shares)</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Learning Analytics</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Study streak and consistency metrics</li>
                          <li>Goal completion rates</li>
                          <li>Quiz and assessment performance (if applicable)</li>
                          <li>AI interaction patterns and preferences</li>
                          <li>Resource usage and engagement patterns</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2.3 Information from Third Parties</h3>
                  <Card>
                    <CardContent className="p-4">
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li><strong>Social Login Providers:</strong> If you sign in using Google, Apple, or other OAuth providers, we receive your name, email, and profile picture as permitted by your settings</li>
                        <li><strong>Educational Institutions:</strong> If your institution partners with PeerSpark, we may receive student roster information with appropriate consent</li>
                        <li><strong>Analytics Partners:</strong> Aggregated usage data and market research insights</li>
                        <li><strong>Integration Partners:</strong> Data from connected calendar, productivity, or educational tools you authorize</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Section 3: How We Use Your Information */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                How We Use Your Information
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We process your personal information for the following purposes, each with a corresponding legal basis:
                </p>
                
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Providing and Improving Our Services
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Creating and managing your account</li>
                        <li>Facilitating study pod matching and collaboration</li>
                        <li>Powering the AI assistant with personalized recommendations</li>
                        <li>Enabling resource sharing and the vault functionality</li>
                        <li>Processing video calls and real-time collaboration</li>
                        <li>Calculating gamification scores and leaderboards</li>
                        <li>Sending notifications about pod activities and updates</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2"><strong>Legal Basis:</strong> Contract performance, Legitimate interests</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        Communication
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Sending transactional emails (account verification, password resets)</li>
                        <li>Providing customer support and responding to inquiries</li>
                        <li>Sending educational tips and platform updates</li>
                        <li>Marketing communications (with your consent)</li>
                        <li>Surveys and feedback requests</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2"><strong>Legal Basis:</strong> Contract performance, Consent, Legitimate interests</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Safety and Security
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Detecting and preventing fraud, abuse, and security threats</li>
                        <li>Enforcing our Terms of Service and Community Guidelines</li>
                        <li>Moderating content and handling reports</li>
                        <li>Protecting the rights and safety of users</li>
                        <li>Maintaining platform integrity and stability</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2"><strong>Legal Basis:</strong> Legitimate interests, Legal obligation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        Analytics and Research
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Understanding how users interact with our Services</li>
                        <li>Improving our algorithms and recommendations</li>
                        <li>Conducting aggregated learning research (anonymized)</li>
                        <li>A/B testing and feature development</li>
                        <li>Generating insights to improve educational outcomes</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2"><strong>Legal Basis:</strong> Legitimate interests, Consent (where required)</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Legal and Compliance
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Complying with applicable laws and regulations</li>
                        <li>Responding to lawful requests from authorities</li>
                        <li>Establishing, exercising, or defending legal claims</li>
                        <li>Maintaining required records and documentation</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2"><strong>Legal Basis:</strong> Legal obligation, Legitimate interests</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Section 4: Information Sharing */}
            <section id="information-sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">4</span>
                Information Sharing and Disclosure
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">With Other Users</h4>
                    <p className="text-sm text-muted-foreground">
                      Your profile information, study materials you share, and contributions to pods are visible to other members according to your privacy settings. You control the visibility of your content through granular sharing options.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Service Providers</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We engage trusted third-party companies to perform services on our behalf, including:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Cloud Infrastructure:</strong> Appwrite, Vercel for hosting and database services</li>
                      <li><strong>AI Services:</strong> OpenRouter for AI assistant functionality</li>
                      <li><strong>Video Conferencing:</strong> Jitsi Meet for secure video calls</li>
                      <li><strong>Analytics:</strong> Privacy-focused analytics for usage insights</li>
                      <li><strong>Email Services:</strong> Transactional and marketing email delivery</li>
                      <li><strong>Payment Processing:</strong> Secure payment gateway providers</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      These providers are contractually bound to protect your data and use it only for specified purposes.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Educational Institutions</h4>
                    <p className="text-sm text-muted-foreground">
                      If you access PeerSpark through an educational institution, we may share limited information with authorized administrators, such as usage statistics and participation metrics, in accordance with applicable education privacy laws (e.g., FERPA).
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Legal Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      We may disclose your information when required by law, in response to valid legal process, to protect our rights or safety, or to prevent illegal activities. We will notify you of such requests when legally permitted.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Business Transfers</h4>
                    <p className="text-sm text-muted-foreground">
                      In the event of a merger, acquisition, or sale of assets, your information may be transferred to the successor entity. We will notify you of any such change and your choices regarding your information.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">With Your Consent</h4>
                    <p className="text-sm text-muted-foreground">
                      We may share your information for other purposes with your explicit consent or at your direction.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 5: Data Retention */}
            <section id="data-retention" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">5</span>
                Data Retention
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including:
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium">Data Type</th>
                            <th className="text-left py-2 font-medium">Retention Period</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2 pr-4">Account Information</td>
                            <td className="py-2">Duration of account + 30 days after deletion</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">User-Generated Content</td>
                            <td className="py-2">Until deleted by user or account termination</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Chat Messages</td>
                            <td className="py-2">2 years or until pod is deleted</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Video Call Recordings</td>
                            <td className="py-2">90 days (if recording is enabled)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Usage Analytics</td>
                            <td className="py-2">26 months (anonymized thereafter)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Payment Records</td>
                            <td className="py-2">7 years (legal requirement)</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">Support Correspondence</td>
                            <td className="py-2">3 years from resolution</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  After the retention period, data is either permanently deleted or anonymized for aggregate analytics purposes. You may request earlier deletion of your data as described in Section 7.
                </p>
              </div>
            </section>

            {/* Section 6: Data Security */}
            <section id="data-security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">6</span>
                Data Security
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We implement comprehensive technical and organizational measures to protect your personal information:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-primary" />
                        Encryption
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>TLS 1.3 encryption for data in transit</li>
                        <li>AES-256 encryption for data at rest</li>
                        <li>End-to-end encryption for private messages</li>
                        <li>Secure hashing for passwords (bcrypt)</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Access Controls
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Role-based access control (RBAC)</li>
                        <li>Multi-factor authentication option</li>
                        <li>Session management and timeout</li>
                        <li>Audit logging of data access</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" />
                        Infrastructure
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>SOC 2 Type II compliant hosting</li>
                        <li>Regular security assessments</li>
                        <li>DDoS protection</li>
                        <li>Automated backups with encryption</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        Monitoring
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>24/7 security monitoring</li>
                        <li>Intrusion detection systems</li>
                        <li>Vulnerability scanning</li>
                        <li>Incident response procedures</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Security Incident Response:</strong> In the event of a data breach affecting your personal information, we will notify you and relevant authorities within 72 hours as required by applicable law, and provide information about the nature of the breach and steps you can take to protect yourself.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 7: Your Rights */}
            <section id="your-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">7</span>
                Your Rights and Choices
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Request a copy of the personal information we hold about you. You can download your data through Settings → Privacy → Download My Data.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Rectification</h4>
                      <p className="text-sm text-muted-foreground">
                        Correct inaccurate or incomplete personal information through your account settings or by contacting us.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Erasure (Right to be Forgotten)</h4>
                      <p className="text-sm text-muted-foreground">
                        Request deletion of your personal information. Go to Settings → Account → Delete Account, or contact our support team. Note that some data may be retained for legal compliance.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Data Portability</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive your data in a structured, commonly used, machine-readable format (JSON, CSV) and transfer it to another service.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Restrict Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Request that we limit the processing of your personal information under certain circumstances.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Object</h4>
                      <p className="text-sm text-muted-foreground">
                        Object to processing based on legitimate interests, including profiling and direct marketing.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Right to Withdraw Consent</h4>
                      <p className="text-sm text-muted-foreground">
                        Where processing is based on consent, you can withdraw it at any time through your account settings or by contacting us.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">How to Exercise Your Rights</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can exercise most rights directly through your account settings. For other requests:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Email: <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a></li>
                      <li>Online Form: <Link href="/contact" className="text-primary hover:underline">Contact Us</Link></li>
                      <li>Response Time: Within 30 days (extendable by 60 days for complex requests)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      We may need to verify your identity before processing your request.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section 8: International Transfers */}
            <section id="international-transfers" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">8</span>
                International Data Transfers
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  PeerSpark operates globally, and your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place:
                </p>
                <Card>
                  <CardContent className="p-4">
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      <li><strong>Standard Contractual Clauses (SCCs):</strong> We use EU-approved SCCs for transfers from the EEA to third countries</li>
                      <li><strong>Adequacy Decisions:</strong> We rely on adequacy decisions where applicable</li>
                      <li><strong>Data Processing Agreements:</strong> All service providers sign DPAs with appropriate safeguards</li>
                      <li><strong>Privacy Shield Principles:</strong> We adhere to equivalent principles for US transfers</li>
                    </ul>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  Our primary data centers are located in the European Union (Frankfurt, Germany), with additional infrastructure in the United States and Asia-Pacific for performance optimization.
                </p>
              </div>
            </section>

            {/* Section 9: Children's Privacy */}
            <section id="children-privacy" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">9</span>
                Children's Privacy
              </h2>
              <div className="space-y-4">
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Age Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      PeerSpark is designed for users aged 13 and older (16 in the EEA). We do not knowingly collect personal information from children under these ages without verified parental consent.
                    </p>
                  </CardContent>
                </Card>
                <p className="text-muted-foreground">
                  For users between 13-18 (or 16-18 in the EEA):
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>We implement additional privacy protections</li>
                  <li>Default privacy settings are more restrictive</li>
                  <li>We limit exposure to third-party advertising</li>
                  <li>Educational institutions may provide access with appropriate consent</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  If you believe we have inadvertently collected information from a child, please contact us immediately at <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>.
                </p>
              </div>
            </section>

            {/* Section 10: Cookies */}
            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">10</span>
                Cookies and Tracking Technologies
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience. For detailed information, please see our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Types of Cookies We Use</h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <strong>Essential Cookies:</strong> Required for basic functionality (authentication, security, preferences). Cannot be disabled.
                      </div>
                      <div>
                        <strong>Functional Cookies:</strong> Remember your choices (theme, language) to provide enhanced features.
                      </div>
                      <div>
                        <strong>Analytics Cookies:</strong> Help us understand usage patterns and improve our Services. Can be opted out.
                      </div>
                      <div>
                        <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements. Require explicit consent.
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  You can manage cookie preferences through our cookie consent banner or in Settings → Privacy → Cookie Preferences.
                </p>
              </div>
            </section>

            {/* Section 11: Third-Party Services */}
            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">11</span>
                Third-Party Services
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our Services integrate with or link to third-party services. Each has its own privacy practices:
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium">Service</th>
                            <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                            <th className="text-left py-2 font-medium">Privacy Policy</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2 pr-4">Google OAuth</td>
                            <td className="py-2 pr-4">Sign-in authentication</td>
                            <td className="py-2"><a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Appwrite</td>
                            <td className="py-2 pr-4">Backend services</td>
                            <td className="py-2"><a href="https://appwrite.io/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Jitsi Meet</td>
                            <td className="py-2 pr-4">Video conferencing</td>
                            <td className="py-2"><a href="https://jitsi.org/privacy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4">Vercel</td>
                            <td className="py-2 pr-4">Hosting & CDN</td>
                            <td className="py-2"><a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4">OpenRouter</td>
                            <td className="py-2 pr-4">AI services</td>
                            <td className="py-2"><a href="https://openrouter.ai/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  We are not responsible for the privacy practices of third-party services. We encourage you to review their policies before using integrated features.
                </p>
              </div>
            </section>

            {/* Section 12: Changes */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">12</span>
                Changes to This Policy
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">How We Notify You</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Material Changes:</strong> Email notification and prominent notice on the platform 30 days before changes take effect</li>
                      <li><strong>Minor Updates:</strong> Updated "Last Modified" date and changelog at the bottom of this policy</li>
                      <li><strong>Continued Use:</strong> Constitutes acceptance of the updated policy</li>
                    </ul>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  We encourage you to periodically review this page for the latest information on our privacy practices.
                </p>
              </div>
            </section>

            {/* Section 13: Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">13</span>
                Contact Us
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Privacy Team
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-primary" />
                        Data Protection Officer
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="sm:col-span-2">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Mailing Address
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        PeerSpark Inc.<br />
                        Attn: Privacy Team<br />
                        123 Education Lane, Suite 456<br />
                        San Francisco, CA 94102<br />
                        United States
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Section 14: Jurisdiction-Specific Rights */}
            <section id="jurisdiction" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">14</span>
                Jurisdiction-Specific Rights
              </h2>
              <div className="space-y-6">
                {/* GDPR */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      European Economic Area (GDPR)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you are in the EEA, UK, or Switzerland, you have additional rights under the General Data Protection Regulation:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Legal Basis:</strong> We process data based on contract performance, consent, legitimate interests, or legal obligation</li>
                      <li><strong>Right to Lodge a Complaint:</strong> You may file a complaint with your local supervisory authority</li>
                      <li><strong>Representative:</strong> Our EU representative can be contacted at <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a></li>
                    </ul>
                  </CardContent>
                </Card>

                {/* CCPA */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      California (CCPA/CPRA)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      California residents have specific rights under the California Consumer Privacy Act and California Privacy Rights Act:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Right to Know:</strong> Request disclosure of personal information collected, used, and disclosed</li>
                      <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                      <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                      <li><strong>Right to Opt-Out:</strong> Opt-out of sale or sharing of personal information (we do not sell personal data)</li>
                      <li><strong>Right to Limit:</strong> Limit use of sensitive personal information</li>
                      <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      To exercise your rights, email <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>.
                    </p>
                  </CardContent>
                </Card>

                {/* Brazil LGPD */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Brazil (LGPD)</h3>
                    <p className="text-sm text-muted-foreground">
                      Brazilian residents have rights under Lei Geral de Proteção de Dados, including confirmation of processing, access, correction, anonymization, portability, deletion, and information about sharing. Contact our DPO for requests.
                    </p>
                  </CardContent>
                </Card>

                {/* India */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">India (DPDP Act)</h3>
                    <p className="text-sm text-muted-foreground">
                      Indian residents have rights under the Digital Personal Data Protection Act, including consent management, access to personal data, correction, erasure, and grievance redressal. Our Grievance Officer can be reached at <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>.
                    </p>
                  </CardContent>
                </Card>

                {/* Other */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Other Jurisdictions</h3>
                    <p className="text-sm text-muted-foreground">
                      We comply with privacy laws in all jurisdictions where we operate, including Australia (Privacy Act), Canada (PIPEDA), Japan (APPI), South Korea (PIPA), and others. Contact us for jurisdiction-specific inquiries.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Version History */}
            <section className="border-t pt-8 mt-12">
              <h3 className="font-semibold mb-4 text-muted-foreground">Version History</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>v2.0 (January 1, 2026):</strong> Comprehensive update for global compliance, added jurisdiction-specific sections</p>
                <p><strong>v1.0 (January 1, 2024):</strong> Initial privacy policy</p>
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
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors font-medium text-foreground">Privacy</Link>
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
