"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft, 
  FileWarning,
  Mail,
  AlertTriangle,
  CheckCircle,
  FileText,
  Scale,
  Shield,
  Clock,
  ChevronRight
} from "lucide-react"

export default function DMCAPage() {
  const lastUpdated = "January 15, 2025"

  const sections = [
    { id: "overview", title: "1. Overview" },
    { id: "infringement-notice", title: "2. Filing a Notice" },
    { id: "requirements", title: "3. Notice Requirements" },
    { id: "counter-notice", title: "4. Counter-Notification" },
    { id: "counter-requirements", title: "5. Counter-Notice Requirements" },
    { id: "repeat-infringers", title: "6. Repeat Infringers" },
    { id: "good-faith", title: "7. Good Faith Requirements" },
    { id: "designated-agent", title: "8. Designated Agent" },
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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-orange-500/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-6">
            <FileWarning className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">DMCA Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Digital Millennium Copyright Act (DMCA) notice and takedown policy for PeerSpark.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Table of Contents</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1 pb-4">
                      {sections.map((section) => (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {section.title}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>

                {/* Quick Report */}
                <Card className="mt-4 border-orange-500/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-sm">Report Infringement</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      To report copyright infringement, send a complete DMCA notice to our designated agent.
                    </p>
                    <a href="mailto:chat.priyanshuag@gmail.com">
                      <Button size="sm" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        chat.priyanshuag@gmail.com
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-3xl">
              {/* Section 1: Overview */}
              <Card className="mb-6" id="overview">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Scale className="h-6 w-6 text-primary" />
                    1. Overview
                  </h2>
                  <p>
                    PeerSpark Technologies, Inc. ("PeerSpark," "we," "us") respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond expeditiously to claims of copyright infringement committed using our platform.
                  </p>
                  <p>
                    This policy applies to all content hosted on PeerSpark, including but not limited to:
                  </p>
                  <ul>
                    <li>Files uploaded to the Resource Vault</li>
                    <li>Messages and content shared in Study Pods</li>
                    <li>Profile content and avatars</li>
                    <li>Comments and posts</li>
                    <li>Any other user-generated content</li>
                  </ul>
                  <p>
                    If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible on our platform, please follow the procedures outlined below to notify our designated copyright agent.
                  </p>
                </CardContent>
              </Card>

              {/* Section 2: Filing a Notice */}
              <Card className="mb-6" id="infringement-notice">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    2. Filing a DMCA Takedown Notice
                  </h2>
                  <p>
                    If you are a copyright owner or authorized to act on behalf of one, and you believe that your copyrighted work has been infringed, you may submit a notification pursuant to the DMCA by providing our Designated Copyright Agent with the following information in writing:
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mt-4 not-prose">
                    <h3 className="font-semibold mb-3">How to Submit a DMCA Notice:</h3>
                    <ol className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Email your complete notice to <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Use "DMCA Takedown Notice" as the subject line</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Include all required elements listed in Section 3</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span>Sign the notice (electronic signature is acceptable)</span>
                      </li>
                    </ol>
                  </div>

                  <p className="mt-4">
                    Alternatively, you may send your notice via postal mail to our Designated Agent at the address provided in Section 8.
                  </p>
                </CardContent>
              </Card>

              {/* Section 3: Requirements */}
              <Card className="mb-6" id="requirements">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    3. DMCA Notice Requirements
                  </h2>
                  <p>
                    To be effective, a DMCA takedown notice must include all of the following:
                  </p>
                  
                  <div className="space-y-4 mt-4 not-prose">
                    {[
                      {
                        title: "Physical or Electronic Signature",
                        description: "A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.",
                      },
                      {
                        title: "Identification of Copyrighted Work",
                        description: "Identification of the copyrighted work claimed to have been infringed. If multiple works are covered by a single notification, provide a representative list.",
                      },
                      {
                        title: "Identification of Infringing Material",
                        description: "Identification of the material that is claimed to be infringing and that is to be removed, and information reasonably sufficient to permit us to locate the material (e.g., direct URLs to the infringing content).",
                      },
                      {
                        title: "Contact Information",
                        description: "Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and email address.",
                      },
                      {
                        title: "Good Faith Statement",
                        description: "A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.",
                      },
                      {
                        title: "Accuracy Statement",
                        description: "A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.",
                      },
                    ].map((req, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm">{req.title}</h4>
                          <p className="text-sm text-muted-foreground">{req.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-red-500/10 p-4 rounded-lg mt-6 not-prose">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-red-600">Warning</h4>
                        <p className="text-sm">
                          Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is infringing may be subject to liability for damages, including costs and attorneys' fees.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Counter-Notice */}
              <Card className="mb-6" id="counter-notice">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    4. Counter-Notification Procedure
                  </h2>
                  <p>
                    If you believe that your content was removed or disabled by mistake or misidentification, you may submit a counter-notification to our Designated Copyright Agent.
                  </p>
                  <p>
                    Upon receipt of a valid counter-notification, we will:
                  </p>
                  <ol>
                    <li>Promptly provide the complainant with a copy of the counter-notification</li>
                    <li>Inform the complainant that we will replace the removed material or cease disabling access to it within 10 business days</li>
                    <li>Replace the removed material or restore access within 10-14 business days following receipt of the counter-notification, unless the complainant files an action seeking a court order</li>
                  </ol>
                  
                  <div className="bg-blue-500/10 p-4 rounded-lg mt-4 not-prose">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Timeline</h4>
                        <p className="text-sm text-muted-foreground">
                          Content will be restored 10-14 business days after we receive your counter-notification, unless the original complainant notifies us they have filed a court action.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 5: Counter-Notice Requirements */}
              <Card className="mb-6" id="counter-requirements">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">5. Counter-Notification Requirements</h2>
                  <p>
                    A counter-notification must include the following:
                  </p>
                  <ul>
                    <li>Your physical or electronic signature</li>
                    <li>Identification of the material that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or access was disabled</li>
                    <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification</li>
                    <li>Your name, address, and telephone number</li>
                    <li>A statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or San Francisco County, California if your address is outside the United States)</li>
                    <li>A statement that you will accept service of process from the person who provided the original notification</li>
                  </ul>
                  <p>
                    Send your counter-notification to <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a> with the subject line "DMCA Counter-Notification."
                  </p>
                </CardContent>
              </Card>

              {/* Section 6: Repeat Infringers */}
              <Card className="mb-6" id="repeat-infringers">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">6. Repeat Infringers Policy</h2>
                  <p>
                    In accordance with the DMCA and other applicable law, PeerSpark has adopted a policy of terminating, in appropriate circumstances and at PeerSpark's sole discretion, users who are deemed to be repeat infringers.
                  </p>
                  <p>
                    We may also, at our sole discretion, limit access to our platform and/or terminate the accounts of any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mt-4 not-prose">
                    <h4 className="font-semibold text-sm mb-2">Our Policy Includes:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5" />
                        <span>First offense: Warning and content removal</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5" />
                        <span>Second offense: Temporary account suspension (7-30 days)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5" />
                        <span>Third offense: Permanent account termination</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Section 7: Good Faith */}
              <Card className="mb-6" id="good-faith">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">7. Good Faith Requirements</h2>
                  <p>
                    Before submitting a DMCA notice, please consider whether the use of the copyrighted material may constitute "fair use" under Section 107 of the Copyright Act. Fair use permits limited use of copyrighted material without requiring permission from the rights holders, particularly for purposes such as:
                  </p>
                  <ul>
                    <li>Criticism and commentary</li>
                    <li>News reporting</li>
                    <li>Teaching and education</li>
                    <li>Scholarship and research</li>
                  </ul>
                  <p>
                    Given that PeerSpark is an educational platform, many uses of copyrighted material may qualify as fair use. We encourage copyright holders to consider fair use before submitting a takedown notice.
                  </p>
                  <p>
                    If you are uncertain whether content you plan to report infringes on your copyright, we recommend contacting an attorney before filing a notice with us.
                  </p>
                </CardContent>
              </Card>

              {/* Section 8: Designated Agent */}
              <Card className="mb-6" id="designated-agent">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Mail className="h-6 w-6 text-primary" />
                    8. Designated Copyright Agent
                  </h2>
                  <p>
                    Please send all DMCA notices and counter-notifications to our Designated Copyright Agent:
                  </p>
                  
                  <div className="bg-muted/50 p-6 rounded-lg mt-4 not-prose">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">PeerSpark Technologies, Inc.</h4>
                        <p className="text-sm text-muted-foreground">
                          Attn: DMCA Designated Agent<br />
                          100 Innovation Drive, Suite 500<br />
                          San Francisco, CA 94105<br />
                          United States
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm font-medium">Email (Preferred)</p>
                          <a href="mailto:chat.priyanshuag@gmail.com" className="text-sm text-primary hover:underline">
                            chat.priyanshuag@gmail.com
                          </a>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">Not available</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4">
                    Please note that this contact information is solely for reporting copyright infringement. For all other inquiries, please visit our <Link href="/contact" className="text-primary hover:underline">Contact page</Link> or email <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary hover:underline">chat.priyanshuag@gmail.com</a>.
                  </p>

                  <p>
                    Our Designated Agent is registered with the U.S. Copyright Office in accordance with Section 512(c)(2) of the DMCA.
                  </p>
                </CardContent>
              </Card>

              {/* Additional Resources */}
              <Card className="border-primary/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Related Policies</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Link href="/terms" className="block group">
                      <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Terms of Service</h4>
                        <p className="text-xs text-muted-foreground mt-1">User content and intellectual property terms</p>
                      </div>
                    </Link>
                    <Link href="/community-guidelines" className="block group">
                      <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">Community Guidelines</h4>
                        <p className="text-xs text-muted-foreground mt-1">Content standards and policies</p>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded overflow-hidden flex items-center justify-center">
                <Image src="/logo.png" alt="PeerSpark" width={24} height={24} className="object-cover" />
              </div>
              <span className="font-semibold">PeerSpark</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/dmca" className="hover:text-foreground transition-colors font-medium text-foreground">DMCA</Link>
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
