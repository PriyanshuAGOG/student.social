"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  Accessibility,
  Eye,
  Ear,
  Hand,
  Brain,
  Keyboard,
  Monitor,
  Smartphone,
  Volume2,
  ZoomIn,
  Contrast,
  MousePointer2,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  FileText,
  Mail,
  ExternalLink
} from "lucide-react"

export default function AccessibilityPage() {
  const lastUpdated = "January 15, 2025"

  const commitments = [
    {
      icon: Eye,
      title: "Visual Accessibility",
      description: "High contrast modes, screen reader support, and text customization options.",
    },
    {
      icon: Ear,
      title: "Auditory Accessibility",
      description: "Captions for video content, visual alerts, and non-audio alternatives.",
    },
    {
      icon: Hand,
      title: "Motor Accessibility",
      description: "Full keyboard navigation, adjustable timing, and alternative input methods.",
    },
    {
      icon: Brain,
      title: "Cognitive Accessibility",
      description: "Clear layouts, consistent navigation, and reduced cognitive load.",
    },
  ]

  const features = [
    {
      category: "Visual",
      items: [
        { feature: "Screen reader compatibility", status: "available" },
        { feature: "High contrast mode", status: "available" },
        { feature: "Dark/Light theme toggle", status: "available" },
        { feature: "Adjustable font sizes", status: "available" },
        { feature: "Color blind friendly palette", status: "available" },
        { feature: "Focus indicators", status: "available" },
        { feature: "Alternative text for images", status: "available" },
        { feature: "Zoom up to 400%", status: "available" },
      ],
    },
    {
      category: "Auditory",
      items: [
        { feature: "Video captions", status: "available" },
        { feature: "Visual notifications", status: "available" },
        { feature: "Transcript downloads", status: "in-progress" },
        { feature: "Sign language interpretation", status: "planned" },
      ],
    },
    {
      category: "Motor",
      items: [
        { feature: "Full keyboard navigation", status: "available" },
        { feature: "Skip navigation links", status: "available" },
        { feature: "No timing-dependent actions", status: "available" },
        { feature: "Touch target sizing", status: "available" },
        { feature: "Voice control support", status: "in-progress" },
        { feature: "Switch device compatibility", status: "planned" },
      ],
    },
    {
      category: "Cognitive",
      items: [
        { feature: "Consistent navigation", status: "available" },
        { feature: "Clear error messages", status: "available" },
        { feature: "Progress indicators", status: "available" },
        { feature: "Simple, clear language", status: "available" },
        { feature: "Reduced motion option", status: "available" },
        { feature: "Reading mode", status: "in-progress" },
      ],
    },
  ]

  const keyboardShortcuts = [
    { keys: ["Tab"], action: "Move to next interactive element" },
    { keys: ["Shift", "Tab"], action: "Move to previous interactive element" },
    { keys: ["Enter"], action: "Activate buttons and links" },
    { keys: ["Space"], action: "Toggle checkboxes and buttons" },
    { keys: ["Esc"], action: "Close dialogs and menus" },
    { keys: ["Arrow Keys"], action: "Navigate within menus and lists" },
    { keys: ["Ctrl/Cmd", "+"], action: "Zoom in" },
    { keys: ["Ctrl/Cmd", "-"], action: "Zoom out" },
    { keys: ["Ctrl/Cmd", "0"], action: "Reset zoom" },
    { keys: ["Alt", "1"], action: "Go to home dashboard" },
    { keys: ["Alt", "2"], action: "Go to study pods" },
    { keys: ["Alt", "3"], action: "Open AI assistant" },
    { keys: ["?"], action: "Open keyboard shortcuts help" },
  ]

  const assistiveTechnologies = [
    { name: "JAWS", category: "Screen Reader", supported: true },
    { name: "NVDA", category: "Screen Reader", supported: true },
    { name: "VoiceOver (macOS/iOS)", category: "Screen Reader", supported: true },
    { name: "TalkBack (Android)", category: "Screen Reader", supported: true },
    { name: "Windows Narrator", category: "Screen Reader", supported: true },
    { name: "Dragon NaturallySpeaking", category: "Voice Control", supported: true },
    { name: "Voice Control (macOS/iOS)", category: "Voice Control", supported: true },
    { name: "ZoomText", category: "Screen Magnifier", supported: true },
    { name: "Windows Magnifier", category: "Screen Magnifier", supported: true },
    { name: "Switch Access", category: "Switch Device", supported: "partial" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2" aria-label="PeerSpark Home">
                <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="PeerSpark" width={20} height={20} className="object-cover" />
                </div>
                <span className="font-bold text-xl">PeerSpark</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-blue-500/10 to-background" aria-labelledby="page-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-6">
            <Accessibility className="h-8 w-8 text-blue-600" aria-hidden="true" />
          </div>
          <h1 id="page-title" className="text-4xl sm:text-5xl font-bold mb-4">Accessibility Statement</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            PeerSpark is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Our Commitment */}
          <section className="mb-12" aria-labelledby="commitment-heading">
            <h2 id="commitment-heading" className="text-2xl font-bold mb-6">Our Commitment to Accessibility</h2>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              We believe that education should be accessible to everyone. PeerSpark is designed and developed with accessibility as a core principle, ensuring that all students can participate in collaborative learning regardless of their abilities.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {commitments.map((commitment) => (
                <Card key={commitment.title}>
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                      <commitment.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold mb-2">{commitment.title}</h3>
                    <p className="text-sm text-muted-foreground">{commitment.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Conformance Standards */}
          <section className="mb-12" aria-labelledby="standards-heading">
            <Card>
              <CardHeader>
                <CardTitle id="standards-heading">Conformance Standards</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  PeerSpark strives to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines explain how to make web content more accessible for people with disabilities.
                </p>
                <p>
                  Conforming to these guidelines helps make the platform more user-friendly for all people, including those who:
                </p>
                <ul>
                  <li>Are blind or have low vision</li>
                  <li>Are deaf or hard of hearing</li>
                  <li>Have learning disabilities or cognitive limitations</li>
                  <li>Have limited movement or motor impairments</li>
                  <li>Have photosensitivity or seizure disorders</li>
                  <li>Use assistive technologies</li>
                </ul>
                <p>
                  We also follow the principles of Universal Design, aiming to create an experience that is usable by the widest range of people possible.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Accessibility Features */}
          <section className="mb-12" aria-labelledby="features-heading">
            <h2 id="features-heading" className="text-2xl font-bold mb-6">Accessibility Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category} Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3" role="list">
                      {category.items.map((item) => (
                        <li key={item.feature} className="flex items-center justify-between">
                          <span className="text-sm">{item.feature}</span>
                          {item.status === "available" && (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                              Available
                            </Badge>
                          )}
                          {item.status === "in-progress" && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/30">
                              In Progress
                            </Badge>
                          )}
                          {item.status === "planned" && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Planned
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Keyboard Navigation */}
          <section className="mb-12" aria-labelledby="keyboard-heading">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle id="keyboard-heading">Keyboard Navigation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  PeerSpark is fully navigable using a keyboard. Here are the main keyboard shortcuts:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">Keys</th>
                        <th className="text-left py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyboardShortcuts.map((shortcut) => (
                        <tr key={shortcut.action} className="border-b">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, index) => (
                                <span key={index}>
                                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                                    {key}
                                  </kbd>
                                  {index < shortcut.keys.length - 1 && (
                                    <span className="mx-1 text-muted-foreground">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">{shortcut.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Assistive Technology Compatibility */}
          <section className="mb-12" aria-labelledby="assistive-heading">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle id="assistive-heading">Assistive Technology Compatibility</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  PeerSpark has been tested with the following assistive technologies:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {assistiveTechnologies.map((tech) => (
                    <div key={tech.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <span className="font-medium text-sm">{tech.name}</span>
                        <p className="text-xs text-muted-foreground">{tech.category}</p>
                      </div>
                      {tech.supported === true && (
                        <Badge className="bg-green-500/10 text-green-600">Supported</Badge>
                      )}
                      {tech.supported === "partial" && (
                        <Badge variant="outline" className="text-amber-600 border-amber-600/30">Partial</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How to Customize */}
          <section className="mb-12" aria-labelledby="customize-heading">
            <h2 id="customize-heading" className="text-2xl font-bold mb-6">How to Customize Your Experience</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Contrast className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Theme Settings</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Switch between light, dark, or system-preferred themes. Access theme toggle in the navigation bar or Settings → Appearance.
                  </p>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">1.</span>
                      Click the theme icon in the header
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">2.</span>
                      Select Light, Dark, or System
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">3.</span>
                      Your preference is saved automatically
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ZoomIn className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Zoom & Text Size</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    The platform supports zoom levels up to 400% without loss of functionality. Use browser zoom or adjust text size in settings.
                  </p>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">1.</span>
                      Use Ctrl/Cmd + Plus to zoom in
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">2.</span>
                      Use Ctrl/Cmd + Minus to zoom out
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">3.</span>
                      Go to Settings for more options
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MousePointer2 className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-semibold">Motion & Animations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Reduce motion and animations if you're sensitive to movement. We respect your system preferences automatically.
                  </p>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">1.</span>
                      Go to Settings → Accessibility
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">2.</span>
                      Toggle "Reduce motion"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-primary">3.</span>
                      Or set in your OS settings
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Known Limitations */}
          <section className="mb-12" aria-labelledby="limitations-heading">
            <Card>
              <CardHeader>
                <CardTitle id="limitations-heading">Known Limitations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  While we strive to ensure accessibility across our platform, we recognize there may be areas that need improvement:
                </p>
                <ul>
                  <li>
                    <strong>Third-party content:</strong> Resources uploaded by users may not always meet accessibility standards. We encourage users to add alt text and captions when uploading.
                  </li>
                  <li>
                    <strong>Live video calls:</strong> Real-time captions are not yet available for video calls, though we are working on integrating this feature.
                  </li>
                  <li>
                    <strong>Complex mathematical notation:</strong> Some advanced mathematical content may not be fully accessible to screen readers.
                  </li>
                  <li>
                    <strong>Legacy PDF documents:</strong> Some older PDFs in the resource vault may not be fully accessible.
                  </li>
                </ul>
                <p>
                  We are actively working to address these limitations and welcome your feedback to help prioritize improvements.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Feedback & Contact */}
          <section className="mb-12" aria-labelledby="feedback-heading">
            <Card className="border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle id="feedback-heading">Accessibility Feedback</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  We welcome your feedback on the accessibility of PeerSpark. If you encounter barriers or have suggestions for improvement, please let us know.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact Us About Accessibility</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a href="mailto:chat.priyanshuag@gmail.com" className="text-sm text-primary hover:underline">
                            chat.priyanshuag@gmail.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">Feedback Form</p>
                          <Link href="/contact" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Submit accessibility feedback
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">What to Include in Your Feedback</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
                        Description of the accessibility barrier
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
                        The page or feature where the issue occurs
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
                        The assistive technology you're using (if any)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
                        Your browser and operating system
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Response Time:</strong> We aim to respond to accessibility feedback within 5 business days and provide a timeline for addressing reported issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Third-Party Resources */}
          <section className="mb-12" aria-labelledby="resources-heading">
            <h2 id="resources-heading" className="text-2xl font-bold mb-6">Accessibility Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Web Accessibility Initiative (WAI)",
                  description: "W3C's comprehensive accessibility resources",
                  url: "https://www.w3.org/WAI/",
                },
                {
                  title: "WebAIM",
                  description: "Web accessibility training and resources",
                  url: "https://webaim.org/",
                },
                {
                  title: "A11Y Project",
                  description: "Community-driven accessibility resources",
                  url: "https://www.a11yproject.com/",
                },
                {
                  title: "NVDA Screen Reader",
                  description: "Free screen reader for Windows",
                  url: "https://www.nvaccess.org/",
                },
                {
                  title: "VoiceOver Guide",
                  description: "Apple's built-in screen reader",
                  url: "https://www.apple.com/accessibility/vision/",
                },
                {
                  title: "Android Accessibility",
                  description: "Google's accessibility features",
                  url: "https://www.android.com/accessibility/",
                },
              ].map((resource) => (
                <a 
                  key={resource.title}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>

          {/* Legal Compliance */}
          <section aria-labelledby="legal-heading">
            <Card>
              <CardHeader>
                <CardTitle id="legal-heading">Legal Compliance</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  PeerSpark is committed to complying with applicable accessibility laws and regulations, including:
                </p>
                <ul>
                  <li>
                    <strong>Section 508</strong> of the Rehabilitation Act (United States)
                  </li>
                  <li>
                    <strong>Americans with Disabilities Act (ADA)</strong> (United States)
                  </li>
                  <li>
                    <strong>Accessibility for Ontarians with Disabilities Act (AODA)</strong> (Canada)
                  </li>
                  <li>
                    <strong>European Accessibility Act</strong> (European Union)
                  </li>
                  <li>
                    <strong>EN 301 549</strong> (European Standard for ICT Accessibility)
                  </li>
                </ul>
                <p>
                  We conduct regular accessibility audits and user testing to ensure ongoing compliance. For questions about our accessibility compliance, please contact <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary">chat.priyanshuag@gmail.com</a>.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded overflow-hidden flex items-center justify-center">
                <Image src="/logo.png" alt="PeerSpark" width={16} height={16} className="object-cover" />
              </div>
              <span className="font-semibold">PeerSpark</span>
            </div>
            <nav aria-label="Footer navigation">
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="/accessibility" className="hover:text-foreground transition-colors font-medium text-foreground">Accessibility</Link>
              </div>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PeerSpark. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
