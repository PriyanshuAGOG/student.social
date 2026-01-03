"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Zap, 
  ArrowLeft, 
  Cookie,
  Shield,
  Settings,
  BarChart3,
  Target,
  Share2,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"
import { useState } from "react"

export default function CookiePolicyPage() {
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    analytics: false,
    advertising: false,
    social: false,
  })

  const lastUpdated = "January 15, 2025"

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "what-are-cookies", title: "2. What Are Cookies?" },
    { id: "types-of-cookies", title: "3. Types of Cookies We Use" },
    { id: "essential", title: "4. Essential Cookies" },
    { id: "functional", title: "5. Functional Cookies" },
    { id: "analytics", title: "6. Analytics Cookies" },
    { id: "advertising", title: "7. Advertising Cookies" },
    { id: "social-media", title: "8. Social Media Cookies" },
    { id: "third-party", title: "9. Third-Party Cookies" },
    { id: "cookie-duration", title: "10. Cookie Duration" },
    { id: "managing-cookies", title: "11. Managing Cookies" },
    { id: "browser-settings", title: "12. Browser Settings" },
    { id: "mobile-devices", title: "13. Mobile Devices" },
    { id: "do-not-track", title: "14. Do Not Track" },
    { id: "updates", title: "15. Updates to Policy" },
    { id: "contact", title: "16. Contact Us" },
  ]

  const cookieTypes = [
    {
      id: "essential",
      name: "Essential Cookies",
      icon: Shield,
      required: true,
      description: "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms.",
      examples: [
        { name: "session_id", purpose: "Maintains your session while logged in", duration: "Session" },
        { name: "csrf_token", purpose: "Security token to prevent cross-site request forgery", duration: "Session" },
        { name: "auth_token", purpose: "Authenticates your identity", duration: "30 days" },
        { name: "cookie_consent", purpose: "Stores your cookie consent preferences", duration: "1 year" },
        { name: "locale", purpose: "Remembers your language preference", duration: "1 year" },
      ],
    },
    {
      id: "functional",
      name: "Functional Cookies",
      icon: Settings,
      required: false,
      description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings. They may be set by us or by third-party providers whose services we have added to our pages.",
      examples: [
        { name: "theme_preference", purpose: "Remembers your light/dark mode preference", duration: "1 year" },
        { name: "sidebar_state", purpose: "Remembers sidebar collapsed/expanded state", duration: "1 year" },
        { name: "notification_settings", purpose: "Stores your notification preferences", duration: "1 year" },
        { name: "recent_pods", purpose: "Stores recently visited study pods for quick access", duration: "30 days" },
        { name: "video_quality", purpose: "Remembers your preferred video call quality", duration: "1 year" },
      ],
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      icon: BarChart3,
      required: false,
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.",
      examples: [
        { name: "_ga", purpose: "Google Analytics - distinguishes unique users", duration: "2 years" },
        { name: "_gid", purpose: "Google Analytics - distinguishes users", duration: "24 hours" },
        { name: "_gat", purpose: "Google Analytics - throttles request rate", duration: "1 minute" },
        { name: "amplitude_id", purpose: "Amplitude - user behavior analytics", duration: "1 year" },
        { name: "mixpanel_id", purpose: "Mixpanel - product analytics", duration: "1 year" },
      ],
    },
    {
      id: "advertising",
      name: "Advertising Cookies",
      icon: Target,
      required: false,
      description: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.",
      examples: [
        { name: "IDE", purpose: "Google DoubleClick - ad targeting", duration: "1 year" },
        { name: "_fbp", purpose: "Facebook Pixel - ad targeting", duration: "3 months" },
        { name: "fr", purpose: "Facebook - ad delivery and measurement", duration: "3 months" },
        { name: "MUID", purpose: "Microsoft Advertising - user identification", duration: "1 year" },
        { name: "li_sugr", purpose: "LinkedIn - ad targeting", duration: "3 months" },
      ],
    },
    {
      id: "social",
      name: "Social Media Cookies",
      icon: Share2,
      required: false,
      description: "These cookies are set by a range of social media services that we have added to the site to enable you to share our content with your friends and networks. They are capable of tracking your browser across other sites and building up a profile of your interests.",
      examples: [
        { name: "datr", purpose: "Facebook - browser identification", duration: "2 years" },
        { name: "guest_id", purpose: "Twitter - user identification", duration: "2 years" },
        { name: "personalization_id", purpose: "Twitter - personalization", duration: "2 years" },
        { name: "lidc", purpose: "LinkedIn - routing optimization", duration: "24 hours" },
        { name: "bcookie", purpose: "LinkedIn - browser identification", duration: "2 years" },
      ],
    },
  ]

  const handleSavePreferences = () => {
    // In production, this would save to cookie/local storage
    console.log("Saving preferences:", preferences)
    alert("Your cookie preferences have been saved.")
  }

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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-500/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-6">
            <Cookie className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn how PeerSpark uses cookies and similar technologies to provide, improve, and protect our services.
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
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-3xl">
              {/* Cookie Preferences Manager */}
              <Card className="mb-8 border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <CardTitle>Manage Your Cookie Preferences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You can customize which cookies you allow. Essential cookies cannot be disabled as they are required for the website to function.
                  </p>
                  <div className="space-y-4">
                    {cookieTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <type.icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label className="font-medium">{type.name}</Label>
                            {type.required && (
                              <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={preferences[type.id as keyof typeof preferences]}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, [type.id]: checked }))
                          }
                          disabled={type.required}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSavePreferences}>Save Preferences</Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPreferences({
                        essential: true,
                        functional: true,
                        analytics: true,
                        advertising: true,
                        social: true,
                      })}
                    >
                      Accept All
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPreferences({
                        essential: true,
                        functional: false,
                        analytics: false,
                        advertising: false,
                        social: false,
                      })}
                    >
                      Reject Non-Essential
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section 1: Introduction */}
              <Card className="mb-6" id="introduction">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
                  <p>
                    This Cookie Policy explains how PeerSpark Technologies, Inc. ("PeerSpark," "we," "us," or "our") uses cookies and similar tracking technologies when you visit our website at www.peerspark.com or use our mobile applications (collectively, the "Services").
                  </p>
                  <p>
                    We use these technologies to collect information about your browsing activities, remember your preferences, analyze how you use our Services, and personalize your experience. This policy should be read in conjunction with our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which provides more information about how we collect and use your personal data.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <p className="text-sm text-muted-foreground m-0">
                        By continuing to use our Services, you consent to the use of cookies and similar technologies as described in this policy. You can manage your preferences at any time using the controls above.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: What Are Cookies */}
              <Card className="mb-6" id="what-are-cookies">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">2. What Are Cookies?</h2>
                  <p>
                    Cookies are small text files that are placed on your computer, smartphone, or other device when you visit a website. Cookies are widely used to make websites work more efficiently, provide information to website owners, and enable certain features.
                  </p>
                  <h3 className="text-lg font-semibold mt-6 mb-3">Similar Technologies We Use:</h3>
                  <ul className="space-y-2">
                    <li>
                      <strong>Web Beacons (Pixel Tags):</strong> Small, transparent image files embedded in emails or web pages that allow us to track whether content has been accessed.
                    </li>
                    <li>
                      <strong>Local Storage:</strong> Browser storage mechanisms that allow websites to store data locally on your device, including localStorage and sessionStorage.
                    </li>
                    <li>
                      <strong>IndexedDB:</strong> A browser-based database for storing larger amounts of structured data.
                    </li>
                    <li>
                      <strong>Device Fingerprinting:</strong> The collection of device attributes (such as operating system, browser type, and screen resolution) to create a unique identifier.
                    </li>
                    <li>
                      <strong>SDKs (Software Development Kits):</strong> Code libraries integrated into our mobile apps that can collect information about your device and in-app behavior.
                    </li>
                  </ul>
                  <p className="mt-4">
                    Throughout this policy, we refer to all these technologies collectively as "cookies" unless otherwise specified.
                  </p>
                </CardContent>
              </Card>

              {/* Section 3: Types of Cookies */}
              <Card className="mb-6" id="types-of-cookies">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">3. Types of Cookies We Use</h2>
                  <p>
                    We use several categories of cookies for different purposes. Below is an overview of each category:
                  </p>
                  <div className="grid gap-4 mt-4">
                    {cookieTypes.map((type) => (
                      <div key={type.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <type.icon className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold m-0">{type.name}</h4>
                          {type.required ? (
                            <Badge variant="default">Required</Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground m-0">
                          {type.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Section 4-8: Detailed Cookie Types */}
              {cookieTypes.map((type, index) => (
                <Card key={type.id} className="mb-6" id={type.id}>
                  <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                    <h2 className="text-xl font-bold mb-4">{index + 4}. {type.name}</h2>
                    <p>{type.description}</p>
                    
                    <h3 className="text-lg font-semibold mt-6 mb-3">Specific Cookies Used:</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Cookie Name</th>
                            <th className="text-left py-2 pr-4">Purpose</th>
                            <th className="text-left py-2">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {type.examples.map((cookie) => (
                            <tr key={cookie.name} className="border-b">
                              <td className="py-2 pr-4 font-mono text-xs">{cookie.name}</td>
                              <td className="py-2 pr-4">{cookie.purpose}</td>
                              <td className="py-2">{cookie.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {type.required && (
                      <div className="bg-amber-500/10 p-4 rounded-lg mt-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <p className="text-sm m-0">
                            These cookies are essential for the website to function properly. You cannot disable them through our cookie preference settings, but you can set your browser to block or alert you about these cookies. However, some parts of the site may not work properly.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Section 9: Third-Party Cookies */}
              <Card className="mb-6" id="third-party">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">9. Third-Party Cookies</h2>
                  <p>
                    In addition to cookies we set directly, third parties may set cookies on your device when you use our Services. These third parties include:
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-3">Analytics Providers</h3>
                  <ul>
                    <li><strong>Google Analytics:</strong> Helps us understand how visitors interact with our website. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>Amplitude:</strong> Provides product analytics to improve user experience. <a href="https://amplitude.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>Mixpanel:</strong> Tracks user interactions for product improvement. <a href="https://mixpanel.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Advertising Partners</h3>
                  <ul>
                    <li><strong>Google Ads:</strong> Serves personalized advertisements. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>Facebook/Meta:</strong> Enables social features and targeted advertising. <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>LinkedIn:</strong> Provides professional advertising services. <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Service Providers</h3>
                  <ul>
                    <li><strong>Intercom:</strong> Powers our customer support chat. <a href="https://www.intercom.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>Stripe:</strong> Processes payment transactions securely. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                    <li><strong>Cloudflare:</strong> Provides security and performance optimization. <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-primary">Privacy Policy</a></li>
                  </ul>

                  <p className="mt-4">
                    We do not control these third-party cookies. Please refer to each provider's privacy policy for information about how they use your data.
                  </p>
                </CardContent>
              </Card>

              {/* Section 10: Cookie Duration */}
              <Card className="mb-6" id="cookie-duration">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">10. Cookie Duration</h2>
                  <p>
                    Cookies can be classified by how long they remain on your device:
                  </p>
                  
                  <div className="grid gap-4 mt-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-2">Session Cookies</h4>
                      <p className="text-sm text-muted-foreground m-0">
                        These are temporary cookies that remain on your device until you close your browser. They are used to maintain your session while you navigate our website, such as keeping you logged in.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <h4 className="font-semibold mb-2">Persistent Cookies</h4>
                      <p className="text-sm text-muted-foreground m-0">
                        These cookies remain on your device for a set period of time or until you delete them manually. They are used to remember your preferences and settings across visits.
                      </p>
                    </div>
                  </div>

                  <p className="mt-4">
                    The specific duration of each cookie is listed in the cookie tables above. Most of our persistent cookies expire within one to two years from your last visit.
                  </p>
                </CardContent>
              </Card>

              {/* Section 11: Managing Cookies */}
              <Card className="mb-6" id="managing-cookies">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">11. Managing Cookies</h2>
                  <p>
                    You have several options for managing cookies:
                  </p>
                  
                  <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Cookie Preference Center</h4>
                        <p className="text-sm text-muted-foreground m-0">
                          Use the cookie preference manager at the top of this page to customize which non-essential cookies you allow.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Browser Settings</h4>
                        <p className="text-sm text-muted-foreground m-0">
                          Most browsers allow you to control cookies through their settings. See the next section for browser-specific instructions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Third-Party Opt-Outs</h4>
                        <p className="text-sm text-muted-foreground m-0">
                          Visit the following sites to opt out of personalized advertising:
                        </p>
                        <ul className="mt-2 text-sm">
                          <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary">Network Advertising Initiative</a></li>
                          <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary">Digital Advertising Alliance</a></li>
                          <li><a href="https://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer" className="text-primary">European Interactive Digital Advertising Alliance</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 12: Browser Settings */}
              <Card className="mb-6" id="browser-settings">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">12. Browser Settings</h2>
                  <p>
                    Each browser provides different methods for blocking and deleting cookies. Here are links to instructions for popular browsers:
                  </p>
                  
                  <ul className="mt-4 space-y-2">
                    <li>
                      <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Google Chrome
                      </a>
                    </li>
                    <li>
                      <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Mozilla Firefox
                      </a>
                    </li>
                    <li>
                      <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Safari
                      </a>
                    </li>
                    <li>
                      <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Microsoft Edge
                      </a>
                    </li>
                    <li>
                      <a href="https://help.opera.com/en/latest/web-preferences/#cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Opera
                      </a>
                    </li>
                    <li>
                      <a href="https://brave.com/privacy-features/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Brave
                      </a>
                    </li>
                  </ul>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <p className="text-sm text-muted-foreground m-0">
                        <strong>Note:</strong> If you block all cookies, some features of our website may not function properly, and you may need to adjust your settings each time you visit.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 13: Mobile Devices */}
              <Card className="mb-6" id="mobile-devices">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">13. Mobile Devices</h2>
                  <p>
                    Our mobile applications may use device identifiers and similar tracking technologies. You can manage these through your device settings:
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-3">iOS Devices</h3>
                  <ul>
                    <li>Go to Settings → Privacy & Security → Tracking to control app tracking requests</li>
                    <li>Go to Settings → Privacy & Security → Apple Advertising to limit ad tracking</li>
                    <li>You can also reset your Advertising Identifier in Settings → Privacy → Advertising</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Android Devices</h3>
                  <ul>
                    <li>Go to Settings → Google → Ads to opt out of personalized ads</li>
                    <li>You can also reset your Advertising ID from the same menu</li>
                    <li>Individual app permissions can be managed in Settings → Apps</li>
                  </ul>

                  <p className="mt-4">
                    Note that opting out of tracking does not mean you will stop seeing ads; it means the ads you see may be less relevant to your interests.
                  </p>
                </CardContent>
              </Card>

              {/* Section 14: Do Not Track */}
              <Card className="mb-6" id="do-not-track">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">14. Do Not Track Signals</h2>
                  <p>
                    Some web browsers offer a "Do Not Track" (DNT) setting that sends a signal to websites indicating that you do not wish to be tracked. Because there is no accepted standard for how to respond to DNT signals, our website does not currently respond to DNT browser signals.
                  </p>
                  <p>
                    However, you can manage your cookie preferences using the tools described in this policy, regardless of your browser's DNT setting.
                  </p>
                  <p>
                    We support the Global Privacy Control (GPC) signal. If your browser sends a GPC signal, we will treat it as a request to opt out of the sale or sharing of your personal information for targeted advertising purposes, where applicable under your jurisdiction's laws.
                  </p>
                </CardContent>
              </Card>

              {/* Section 15: Updates */}
              <Card className="mb-6" id="updates">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">15. Updates to This Policy</h2>
                  <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make significant changes, we will:
                  </p>
                  <ul>
                    <li>Update the "Last updated" date at the top of this policy</li>
                    <li>Provide notice on our website or through email for material changes</li>
                    <li>Request your consent again for non-essential cookies if required by law</li>
                  </ul>
                  <p>
                    We encourage you to review this policy periodically to stay informed about our use of cookies. Your continued use of our Services after any changes indicates your acceptance of the updated policy.
                  </p>
                </CardContent>
              </Card>

              {/* Section 16: Contact */}
              <Card className="mb-6" id="contact">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">16. Contact Us</h2>
                  <p>
                    If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                  </p>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mt-4">
                    <p className="font-medium mb-2">PeerSpark Technologies, Inc.</p>
                    <p className="text-sm text-muted-foreground m-0">
                      Privacy Team<br />
                      100 Innovation Drive, Suite 500<br />
                      San Francisco, CA 94105<br />
                      United States<br /><br />
                      Email: <a href="mailto:privacy@peerspark.com" className="text-primary">privacy@peerspark.com</a><br />
                      Data Protection Officer: <a href="mailto:dpo@peerspark.com" className="text-primary">dpo@peerspark.com</a>
                    </p>
                  </div>

                  <p className="mt-4">
                    For general questions about our Services, please visit our <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
                  </p>
                </CardContent>
              </Card>
            </div>
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
              <Link href="/cookies" className="hover:text-foreground transition-colors font-medium text-foreground">Cookies</Link>
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
