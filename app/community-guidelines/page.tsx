"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  Users,
  Heart,
  Shield,
  MessageSquare,
  AlertTriangle,
  Ban,
  Flag,
  Scale,
  Eye,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Globe,
  Lock,
  UserX,
  Megaphone,
  FileWarning,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function CommunityGuidelinesPage() {
  const lastUpdated = "January 15, 2025"

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "principles", title: "2. Core Principles" },
    { id: "respect", title: "3. Respect & Kindness" },
    { id: "harassment", title: "4. No Harassment" },
    { id: "hate-speech", title: "5. Hate Speech" },
    { id: "safety", title: "6. Safety & Security" },
    { id: "academic-integrity", title: "7. Academic Integrity" },
    { id: "content-standards", title: "8. Content Standards" },
    { id: "intellectual-property", title: "9. Intellectual Property" },
    { id: "privacy", title: "10. Privacy & Data" },
    { id: "minors", title: "11. Protecting Minors" },
    { id: "spam", title: "12. Spam & Manipulation" },
    { id: "reporting", title: "13. Reporting Violations" },
    { id: "enforcement", title: "14. Enforcement Actions" },
    { id: "appeals", title: "15. Appeals Process" },
    { id: "updates", title: "16. Updates" },
  ]

  const coreValues = [
    {
      icon: Heart,
      title: "Kindness",
      description: "Treat every community member with compassion and understanding.",
    },
    {
      icon: Shield,
      title: "Safety",
      description: "Prioritize the physical and emotional safety of all users.",
    },
    {
      icon: Users,
      title: "Inclusion",
      description: "Welcome and respect people of all backgrounds and identities.",
    },
    {
      icon: BookOpen,
      title: "Learning",
      description: "Foster an environment conducive to education and growth.",
    },
    {
      icon: Scale,
      title: "Integrity",
      description: "Uphold honesty and ethical standards in all interactions.",
    },
    {
      icon: Globe,
      title: "Respect",
      description: "Honor diverse perspectives and cultural differences.",
    },
  ]

  const doList = [
    "Be respectful and supportive of fellow learners",
    "Provide constructive feedback when helping others",
    "Share resources and knowledge generously",
    "Report content or behavior that violates these guidelines",
    "Respect others' time and learning pace",
    "Use inclusive language that welcomes everyone",
    "Protect your own and others' privacy",
    "Give credit when using others' work or ideas",
    "Be patient with those who are learning",
    "Celebrate the achievements of your peers",
  ]

  const dontList = [
    "Bully, harass, or intimidate other users",
    "Share others' personal information without consent",
    "Post discriminatory or hateful content",
    "Cheat, plagiarize, or encourage academic dishonesty",
    "Share explicit, violent, or inappropriate content",
    "Spam or engage in manipulative behavior",
    "Impersonate others or create fake accounts",
    "Exploit, manipulate, or deceive other users",
    "Engage in illegal activities or encourage others to",
    "Disrupt learning environments intentionally",
  ]

  const enforcementActions = [
    {
      severity: "Warning",
      description: "A notification that your content or behavior has violated guidelines. First-time, minor violations typically result in a warning.",
      color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    },
    {
      severity: "Content Removal",
      description: "Violating content will be removed from the platform. You will be notified of the specific policy violated.",
      color: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
    },
    {
      severity: "Temporary Restriction",
      description: "Limited access to certain features for a specified period, such as posting, messaging, or joining pods.",
      color: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
    },
    {
      severity: "Temporary Suspension",
      description: "Complete account suspension for a defined period (e.g., 7-30 days) for serious or repeated violations.",
      color: "bg-red-500/20 text-red-700 dark:text-red-400",
    },
    {
      severity: "Permanent Ban",
      description: "Permanent removal from the platform for severe violations or continued policy breaches after prior enforcement.",
      color: "bg-red-500/20 text-red-700 dark:text-red-400",
    },
    {
      severity: "Legal Action",
      description: "For illegal activities, we may report to law enforcement and cooperate with investigations.",
      color: "bg-red-500/20 text-red-700 dark:text-red-400",
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
      <section className="py-12 sm:py-16 bg-gradient-to-b from-green-500/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our guidelines for building a safe, inclusive, and supportive learning community where everyone can thrive.
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
              {/* Quick Reference: Do's and Don'ts */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card className="border-green-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg text-green-600">Do</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {doList.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-lg text-red-600">Don't</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {dontList.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Section 1: Introduction */}
              <Card className="mb-6" id="introduction">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
                  <p>
                    Welcome to the PeerSpark community! These Community Guidelines establish the standards of behavior expected from all members of our learning platform. Our mission is to create a safe, inclusive, and supportive environment where students from around the world can collaborate, learn, and grow together.
                  </p>
                  <p>
                    These guidelines apply to all areas of PeerSpark, including but not limited to:
                  </p>
                  <ul>
                    <li>Study Pods and group discussions</li>
                    <li>Direct messages and chat</li>
                    <li>Video and voice calls</li>
                    <li>Resource Vault uploads and comments</li>
                    <li>Profile content and usernames</li>
                    <li>Posts, comments, and reactions</li>
                    <li>AI Assistant interactions</li>
                    <li>Any other communication on our platform</li>
                  </ul>
                  <p>
                    By using PeerSpark, you agree to abide by these guidelines. Violations may result in content removal, account restrictions, or permanent bans, depending on the severity of the infraction.
                  </p>
                </CardContent>
              </Card>

              {/* Section 2: Core Principles */}
              <Card className="mb-6" id="principles">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">2. Core Principles</h2>
                  <p>
                    Our community is built on these foundational values that guide all interactions:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 not-prose">
                    {coreValues.map((value) => (
                      <div key={value.title} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <value.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{value.title}</h4>
                          <p className="text-sm text-muted-foreground">{value.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Respect & Kindness */}
              <Card className="mb-6" id="respect">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Heart className="h-6 w-6 text-primary" />
                    3. Respect & Kindness
                  </h2>
                  <p>
                    PeerSpark is a learning community where students support each other's educational journeys. We expect all members to:
                  </p>
                  <ul>
                    <li><strong>Be courteous:</strong> Communicate with politeness and consideration. Disagreements are natural, but express them respectfully.</li>
                    <li><strong>Value diverse perspectives:</strong> Our community includes learners from diverse backgrounds, cultures, and experiences. Embrace these differences as learning opportunities.</li>
                    <li><strong>Encourage growth:</strong> Remember that everyone is on a learning journey. Be patient with those who may be struggling or new to a topic.</li>
                    <li><strong>Provide constructive feedback:</strong> When offering criticism, focus on being helpful rather than hurtful. Frame feedback in ways that encourage improvement.</li>
                    <li><strong>Assume good intent:</strong> Before reacting negatively, consider that misunderstandings happen, especially in text-based communication.</li>
                  </ul>
                  <div className="bg-primary/10 p-4 rounded-lg mt-4 not-prose">
                    <p className="text-sm">
                      <strong>Remember:</strong> There's a real person on the other side of every interaction. Treat others as you would want to be treated in a classroom setting.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: No Harassment */}
              <Card className="mb-6" id="harassment">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Ban className="h-6 w-6 text-destructive" />
                    4. No Harassment or Bullying
                  </h2>
                  <p>
                    PeerSpark has zero tolerance for harassment, bullying, or intimidation of any kind. Prohibited behaviors include:
                  </p>
                  
                  <h3 className="text-lg font-semibold mt-6 mb-3">Direct Harassment</h3>
                  <ul>
                    <li>Personal attacks, insults, or name-calling</li>
                    <li>Persistent unwanted contact or messaging</li>
                    <li>Threats of violence or harm</li>
                    <li>Intimidation or attempts to frighten others</li>
                    <li>Public shaming or humiliation</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Cyberbullying</h3>
                  <ul>
                    <li>Repeated negative comments designed to hurt</li>
                    <li>Spreading rumors or false information about someone</li>
                    <li>Excluding someone intentionally and maliciously</li>
                    <li>Creating fake profiles to target someone</li>
                    <li>Encouraging others to bully someone</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Sexual Harassment</h3>
                  <ul>
                    <li>Unwelcome sexual advances or requests</li>
                    <li>Sending unsolicited sexually explicit content</li>
                    <li>Making sexual comments about someone's body</li>
                    <li>Continued romantic advances after rejection</li>
                    <li>Gender-based harassment or discrimination</li>
                  </ul>

                  <div className="bg-red-500/10 p-4 rounded-lg mt-4 not-prose">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <p className="text-sm">
                        <strong>Important:</strong> Harassment is never acceptable regardless of whether it occurs publicly or in private messages. All reports of harassment are taken seriously and investigated thoroughly.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 5: Hate Speech */}
              <Card className="mb-6" id="hate-speech">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-destructive" />
                    5. Hate Speech & Discrimination
                  </h2>
                  <p>
                    PeerSpark is committed to being an inclusive platform where all learners feel welcome. We do not tolerate hate speech or discrimination based on:
                  </p>
                  <ul>
                    <li>Race, ethnicity, or national origin</li>
                    <li>Religion or lack thereof</li>
                    <li>Gender identity or expression</li>
                    <li>Sexual orientation</li>
                    <li>Disability (physical or mental)</li>
                    <li>Age</li>
                    <li>Socioeconomic status</li>
                    <li>Immigration or citizenship status</li>
                    <li>Veteran status</li>
                    <li>Any other protected characteristic</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Prohibited Content Includes:</h3>
                  <ul>
                    <li>Slurs or derogatory language targeting any group</li>
                    <li>Content promoting supremacist ideologies</li>
                    <li>Stereotyping or generalizing about groups</li>
                    <li>Denying historical atrocities</li>
                    <li>Content that dehumanizes any group</li>
                    <li>Promoting or glorifying hate groups</li>
                  </ul>

                  <p className="mt-4">
                    This policy applies even when such content is shared as "humor" or "jokes." Hateful content disguised as satire or irony is still hate speech.
                  </p>
                </CardContent>
              </Card>

              {/* Section 6: Safety & Security */}
              <Card className="mb-6" id="safety">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    6. Safety & Security
                  </h2>
                  <p>
                    The safety of our community members is our top priority. The following are strictly prohibited:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Violence & Threats</h3>
                  <ul>
                    <li>Threats of violence against individuals or groups</li>
                    <li>Content that encourages or glorifies violence</li>
                    <li>Instructions for violent activities</li>
                    <li>Graphic depictions of violence</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Self-Harm</h3>
                  <ul>
                    <li>Content promoting or glorifying self-harm or suicide</li>
                    <li>Sharing methods of self-harm</li>
                    <li>Encouraging others to harm themselves</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Dangerous Activities</h3>
                  <ul>
                    <li>Instructions for making weapons or explosives</li>
                    <li>Promoting drug use or sharing drug sources</li>
                    <li>Encouraging dangerous challenges</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Illegal Activities</h3>
                  <ul>
                    <li>Soliciting or facilitating illegal actions</li>
                    <li>Sharing pirated content</li>
                    <li>Fraud, scams, or financial exploitation</li>
                  </ul>

                  <div className="bg-blue-500/10 p-4 rounded-lg mt-4 not-prose">
                    <div className="flex items-start gap-2">
                      <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm mb-2">
                          <strong>Need Help?</strong> If you or someone you know is struggling:
                        </p>
                        <ul className="text-sm space-y-1">
                          <li>• National Suicide Prevention Lifeline (US): 988</li>
                          <li>• Crisis Text Line: Text HOME to 741741</li>
                          <li>• International Association for Suicide Prevention: <a href="https://www.iasp.info/resources/Crisis_Centres/" className="text-primary">Find a crisis center</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 7: Academic Integrity */}
              <Card className="mb-6" id="academic-integrity">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    7. Academic Integrity
                  </h2>
                  <p>
                    As an educational platform, PeerSpark upholds the highest standards of academic integrity. We expect all users to engage honestly in their learning:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Prohibited Academic Behaviors</h3>
                  <ul>
                    <li><strong>Cheating:</strong> Sharing exam answers, test questions, or assignment solutions in ways that violate academic policies</li>
                    <li><strong>Contract Cheating:</strong> Offering or soliciting services to complete assignments for others</li>
                    <li><strong>Plagiarism:</strong> Presenting others' work as your own without proper attribution</li>
                    <li><strong>Impersonation:</strong> Taking tests or completing assignments on behalf of someone else</li>
                    <li><strong>Fabrication:</strong> Falsifying research data or sources</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Encouraged Behaviors</h3>
                  <ul>
                    <li>Discussing concepts and study strategies</li>
                    <li>Explaining difficult topics to peers</li>
                    <li>Sharing study resources and tips</li>
                    <li>Forming study groups for exam preparation</li>
                    <li>Peer review with constructive feedback</li>
                    <li>Using AI tools as learning aids, not replacement</li>
                  </ul>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4 not-prose">
                    <p className="text-sm">
                      <strong>Note on AI Tools:</strong> Our AI Assistant is designed to help you understand concepts, not to complete assignments for you. Using AI to generate work that you submit as your own may violate your institution's academic integrity policies.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 8: Content Standards */}
              <Card className="mb-6" id="content-standards">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-primary" />
                    8. Content Standards
                  </h2>
                  <p>
                    All content shared on PeerSpark should be appropriate for an educational environment:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Prohibited Content</h3>
                  <ul>
                    <li><strong>Adult Content:</strong> Sexually explicit images, videos, or text</li>
                    <li><strong>Graphic Violence:</strong> Gore, extreme violence, or disturbing imagery</li>
                    <li><strong>Shocking Content:</strong> Content designed to disturb, disgust, or upset viewers</li>
                    <li><strong>Dangerous Misinformation:</strong> False information that could cause real-world harm, particularly regarding health, safety, or elections</li>
                    <li><strong>Malicious Content:</strong> Viruses, malware, or links to harmful downloads</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Profile Standards</h3>
                  <ul>
                    <li>Usernames must not contain offensive or inappropriate terms</li>
                    <li>Profile pictures must be appropriate for all ages</li>
                    <li>Bio/about sections must follow all content guidelines</li>
                    <li>Do not impersonate other individuals or organizations</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Study Pod Standards</h3>
                  <ul>
                    <li>Pod names and descriptions must be appropriate</li>
                    <li>Pod content must relate to legitimate educational purposes</li>
                    <li>Pod admins are responsible for moderating their pod's content</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Section 9: Intellectual Property */}
              <Card className="mb-6" id="intellectual-property">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileWarning className="h-6 w-6 text-primary" />
                    9. Intellectual Property
                  </h2>
                  <p>
                    Respect the intellectual property rights of others:
                  </p>
                  <ul>
                    <li><strong>Copyright:</strong> Do not share copyrighted content without permission (textbooks, articles, videos, music, etc.)</li>
                    <li><strong>Fair Use:</strong> Understand that educational use has limits—sharing entire works is generally not permitted</li>
                    <li><strong>Attribution:</strong> Always credit the original creator when sharing others' work</li>
                    <li><strong>Your Content:</strong> By sharing content on PeerSpark, you grant us a license to display it as described in our Terms of Service, but you retain ownership</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">DMCA Compliance</h3>
                  <p>
                    We comply with the Digital Millennium Copyright Act. If you believe your copyrighted work has been infringed, please see our <Link href="/dmca" className="text-primary">DMCA Policy</Link> for how to file a notice.
                  </p>
                </CardContent>
              </Card>

              {/* Section 10: Privacy */}
              <Card className="mb-6" id="privacy">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Lock className="h-6 w-6 text-primary" />
                    10. Privacy & Personal Information
                  </h2>
                  <p>
                    Protect your privacy and respect the privacy of others:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Do Not Share</h3>
                  <ul>
                    <li>Others' personal information (doxxing) including real names, addresses, phone numbers, or emails without consent</li>
                    <li>Private conversations or messages without the participants' consent</li>
                    <li>Photos or videos of others without their permission</li>
                    <li>Financial information (credit card numbers, bank accounts)</li>
                    <li>Login credentials or access to others' accounts</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Protect Yourself</h3>
                  <ul>
                    <li>Be cautious about sharing personal information with strangers</li>
                    <li>Use our platform's privacy settings</li>
                    <li>Think carefully before sharing real-time location</li>
                    <li>Report requests for inappropriate personal information</li>
                  </ul>

                  <p>
                    For more information on how we handle your data, see our <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
                  </p>
                </CardContent>
              </Card>

              {/* Section 11: Protecting Minors */}
              <Card className="mb-6" id="minors">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserX className="h-6 w-6 text-destructive" />
                    11. Protecting Minors
                  </h2>
                  <p>
                    PeerSpark takes the safety of minors extremely seriously. The following is strictly prohibited and will result in immediate account termination and reporting to authorities:
                  </p>
                  <ul>
                    <li>Any sexual content involving minors (CSAM)</li>
                    <li>Grooming or inappropriate contact with minors</li>
                    <li>Content that sexualizes minors in any way</li>
                    <li>Soliciting personal information from minors</li>
                    <li>Encouraging minors to engage in dangerous activities</li>
                  </ul>

                  <div className="bg-red-500/10 p-4 rounded-lg mt-4 not-prose">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <p className="text-sm">
                        <strong>Zero Tolerance:</strong> We report all instances of child exploitation to the National Center for Missing & Exploited Children (NCMEC) and cooperate fully with law enforcement investigations.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Age Requirements</h3>
                  <p>
                    Users must be at least 13 years old to use PeerSpark (or the minimum age required in their jurisdiction). Users under 18 should not share personal information with adults they don't know.
                  </p>
                </CardContent>
              </Card>

              {/* Section 12: Spam & Manipulation */}
              <Card className="mb-6" id="spam">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-primary" />
                    12. Spam & Manipulation
                  </h2>
                  <p>
                    Keep PeerSpark focused on authentic learning interactions:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Prohibited Spam Behaviors</h3>
                  <ul>
                    <li>Sending repetitive or unsolicited messages</li>
                    <li>Posting irrelevant commercial content</li>
                    <li>Bulk messaging or mass friending</li>
                    <li>Creating multiple accounts for manipulation</li>
                    <li>Using bots or automated tools for engagement</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Manipulation</h3>
                  <ul>
                    <li>Artificially inflating engagement metrics</li>
                    <li>Coordinated inauthentic behavior</li>
                    <li>Misleading or deceptive practices</li>
                    <li>Scams, phishing, or financial fraud</li>
                    <li>Impersonating PeerSpark staff or moderators</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Commercial Activity</h3>
                  <ul>
                    <li>Unsolicited advertising or promotion</li>
                    <li>Selling products or services without authorization</li>
                    <li>Multi-level marketing schemes</li>
                    <li>Promoting competitors' services</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Section 13: Reporting */}
              <Card className="mb-6" id="reporting">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Flag className="h-6 w-6 text-primary" />
                    13. Reporting Violations
                  </h2>
                  <p>
                    If you encounter content or behavior that violates these guidelines, please report it. Your reports help us maintain a safe community.
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">How to Report</h3>
                  <ul>
                    <li><strong>In-App Reporting:</strong> Use the "Report" button available on all content, profiles, and messages</li>
                    <li><strong>Email:</strong> Send details to <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary">chat.priyanshuag@gmail.com</a></li>
                    <li><strong>Urgent Safety Issues:</strong> Contact <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary">chat.priyanshuag@gmail.com</a></li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">What to Include in Your Report</h3>
                  <ul>
                    <li>The username or profile link of the person involved</li>
                    <li>A description of the violation</li>
                    <li>Screenshots or links to the content (if possible)</li>
                    <li>When the incident occurred</li>
                    <li>Any other relevant context</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Report Confidentiality</h3>
                  <p>
                    Reports are treated confidentially. We do not disclose the identity of reporters to the reported party unless legally required or you give explicit consent.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4 not-prose">
                    <p className="text-sm">
                      <strong>No Retaliation:</strong> We prohibit retaliation against users who make good-faith reports. If you experience retaliation, please report it immediately.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Section 14: Enforcement */}
              <Card className="mb-6" id="enforcement">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Scale className="h-6 w-6 text-primary" />
                    14. Enforcement Actions
                  </h2>
                  <p>
                    When we determine that a violation has occurred, we take appropriate action based on the severity of the violation, the user's history, and the potential harm to the community.
                  </p>

                  <div className="space-y-4 mt-4 not-prose">
                    {enforcementActions.map((action) => (
                      <div key={action.severity} className="p-4 rounded-lg border">
                        <Badge className={action.color}>{action.severity}</Badge>
                        <p className="text-sm mt-2">{action.description}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Factors We Consider</h3>
                  <ul>
                    <li>Severity of the violation</li>
                    <li>Whether this is a first offense or repeated behavior</li>
                    <li>The user's overall account history</li>
                    <li>The impact on victims or the community</li>
                    <li>Whether the violation was intentional or unintentional</li>
                    <li>The user's response when confronted (cooperation vs. continued violation)</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Section 15: Appeals */}
              <Card className="mb-6" id="appeals">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">15. Appeals Process</h2>
                  <p>
                    If you believe an enforcement action was taken in error, you have the right to appeal:
                  </p>

                  <h3 className="text-lg font-semibold mt-6 mb-3">How to Appeal</h3>
                  <ol>
                    <li>Go to Settings → Account → Appeals or email <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary">chat.priyanshuag@gmail.com</a></li>
                    <li>Include your username and the enforcement action you're appealing</li>
                    <li>Explain why you believe the decision was incorrect</li>
                    <li>Provide any evidence that supports your appeal</li>
                  </ol>

                  <h3 className="text-lg font-semibold mt-6 mb-3">What to Expect</h3>
                  <ul>
                    <li>We aim to review appeals within 5 business days</li>
                    <li>A different team member from the original decision-maker will review your case</li>
                    <li>You will receive a written response explaining the outcome</li>
                    <li>Appeal decisions are final</li>
                  </ul>

                  <p className="mt-4">
                    Note that some actions, such as those related to child safety or imminent threats, are not eligible for appeal.
                  </p>
                </CardContent>
              </Card>

              {/* Section 16: Updates */}
              <Card className="mb-6" id="updates">
                <CardContent className="prose prose-neutral dark:prose-invert max-w-none pt-6">
                  <h2 className="text-xl font-bold mb-4">16. Updates to These Guidelines</h2>
                  <p>
                    We may update these Community Guidelines from time to time to address new issues, reflect changes in our services, or incorporate user feedback. When we make significant changes:
                  </p>
                  <ul>
                    <li>We will update the "Last updated" date at the top of this page</li>
                    <li>We may notify you via email or in-app notification for material changes</li>
                    <li>We will provide reasonable notice before new guidelines take effect</li>
                  </ul>
                  <p>
                    Your continued use of PeerSpark after changes are posted constitutes your acceptance of the updated guidelines.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg mt-4 not-prose">
                    <p className="text-sm">
                      <strong>Questions?</strong> If you have questions about these guidelines or need clarification on any policy, please contact us at <a href="mailto:chat.priyanshuag@gmail.com" className="text-primary">chat.priyanshuag@gmail.com</a>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Acknowledgment */}
              <Card className="border-primary/50">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Thank You for Being Part of Our Community</h3>
                  <p className="text-muted-foreground mb-4">
                    By following these guidelines, you help create a safe, welcoming environment where every student can thrive. Together, we're building something special.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2">
                    <Link href="/register">
                      <Button>Join PeerSpark</Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline">Contact Us</Button>
                    </Link>
                  </div>
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
              <Link href="/community-guidelines" className="hover:text-foreground transition-colors font-medium text-foreground">Guidelines</Link>
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
