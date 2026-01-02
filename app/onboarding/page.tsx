"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { podService, profileService } from "@/lib/appwrite"
import { rankPodsForUser } from "@/lib/pod-matching"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GraduationCap,
  BookOpen,
  Users,
  Lightbulb,
  Target,
  Brain,
  Heart,
  Trophy,
  Code,
  Palette,
  Calculator,
  Globe,
  Microscope,
  Music,
  Camera,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Zap,
  Upload,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const LEARNING_IDENTITIES = [
  { id: "student", label: "Student", icon: GraduationCap, description: "Currently enrolled in school/college" },
  { id: "self-learner", label: "Self-Learner", icon: BookOpen, description: "Learning independently" },
  { id: "coach", label: "Coach", icon: Users, description: "Teaching and mentoring others" },
  { id: "mentor", label: "Mentor", icon: Lightbulb, description: "Guiding and supporting learners" },
  { id: "enthusiast", label: "Enthusiast", icon: Target, description: "Passionate about continuous learning" },
]

const INTERESTS = [
  { id: "dsa", label: "DSA & Coding", icon: Code, category: "tech" },
  { id: "uiux", label: "UI/UX Design", icon: Palette, category: "design" },
  { id: "math", label: "Mathematics", icon: Calculator, category: "academic" },
  { id: "neet", label: "NEET Prep", icon: Microscope, category: "exam" },
  { id: "jee", label: "JEE Prep", icon: Calculator, category: "exam" },
  { id: "web-dev", label: "Web Development", icon: Globe, category: "tech" },
  { id: "startup", label: "Startup Basics", icon: Briefcase, category: "business" },
  { id: "music", label: "Music Theory", icon: Music, category: "creative" },
  { id: "photography", label: "Photography", icon: Camera, category: "creative" },
  { id: "science", label: "General Science", icon: Microscope, category: "academic" },
]

const LEARNING_GOALS = [
  { id: "interview-prep", label: "Interview prep" },
  { id: "exam-prep", label: "Exam prep" },
  { id: "skill-growth", label: "Skill growth" },
  { id: "career-switch", label: "Career switch" },
  { id: "hobby", label: "Hobby learning" },
]

const LEARNING_PACE = [
  { id: "slow", label: "Slow & steady" },
  { id: "moderate", label: "Moderate" },
  { id: "fast", label: "Fast track" },
]

const SESSION_TYPES = [
  { id: "live", label: "Live study" },
  { id: "async", label: "Async" },
  { id: "hybrid", label: "Hybrid" },
]

const AVAILABILITY = [
  { id: "weekday-morning", label: "Weekday mornings" },
  { id: "weekday-evening", label: "Weekday evenings" },
  { id: "weekend", label: "Weekends" },
]

const LEARNING_VIBES = [
  {
    id: "motivation",
    label: "Need daily motivation",
    icon: Heart,
    description: "I need encouragement to stay consistent",
  },
  { id: "ai-help", label: "Want AI help", icon: Brain, description: "I love using AI tools for learning" },
  { id: "teach", label: "Here to teach", icon: Users, description: "I enjoy helping others learn" },
  { id: "challenge", label: "Want to join challenges", icon: Trophy, description: "I'm motivated by competitions" },
]

const SAMPLE_PODS = [
  {
    id: "dsa-masters",
    name: "DSA Masters",
    members: 24,
    streak: 15,
    description: "Daily coding practice and algorithm discussions",
    nextSession: "Today 8:00 PM",
    tags: ["DSA", "Coding", "Interview Prep"],
  },
  {
    id: "neet-biology",
    name: "NEET Biology Squad",
    members: 18,
    streak: 22,
    description: "Comprehensive biology preparation for NEET",
    nextSession: "Tomorrow 6:00 PM",
    tags: ["NEET", "Biology", "Medical"],
  },
  {
    id: "design-thinking",
    name: "Design Thinking Hub",
    members: 12,
    streak: 8,
    description: "UI/UX design principles and portfolio building",
    nextSession: "Today 7:30 PM",
    tags: ["UI/UX", "Design", "Portfolio"],
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedIdentity, setSelectedIdentity] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedPace, setSelectedPace] = useState("moderate")
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>(["live"])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([])
  const [recommendedPods, setRecommendedPods] = useState<any[]>([])
  const [selectedPod, setSelectedPod] = useState("")
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    avatar: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecos, setIsLoadingRecos] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const totalSteps = 6
  const progress = ((currentStep + 1) / totalSteps) * 100

  const buildProfileForMatch = () => ({
    interests: selectedInterests,
    learningGoals: selectedGoals,
    learningPace: selectedPace,
    preferredSessionTypes: selectedSessionTypes,
    availability: selectedAvailability,
    vibes: selectedVibes,
  })

  const loadRecommendations = async () => {
    if (!user?.$id) return
    setIsLoadingRecos(true)
    try {
      const podsRes = await podService.getAllPods(100, 0, {})
      const ranked = rankPodsForUser(buildProfileForMatch(), podsRes.documents || [], 5)
      setRecommendedPods(ranked)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Couldn't load pods", description: e?.message, variant: "destructive" })
    } finally {
      setIsLoadingRecos(false)
    }
  }

  useEffect(() => {
    if (currentStep === 4) {
      loadRecommendations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedInterests, selectedGoals, selectedPace, selectedSessionTypes, selectedAvailability])

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      if (!user) throw new Error("Not authenticated")

      // Update profile with collected data
      await profileService.updateProfile(user.$id, {
        name: profileData.name,
        bio: profileData.bio,
        interests: selectedInterests,
        identity: selectedIdentity,
        vibes: selectedVibes,
        learningGoals: selectedGoals,
        learningPace: selectedPace,
        preferredSessionTypes: selectedSessionTypes,
        availability: selectedAvailability,
        currentFocusAreas: selectedInterests,
      })

      // Upload avatar if selected
      if (avatarFile) {
        await profileService.uploadAvatar(avatarFile, user.$id)
      }

      const matchProfile = buildProfileForMatch()
      const matchResult = await podService.autoMatchAndJoin(user.$id, matchProfile, { matchLimit: 5, joinLimit: 3 })

      toast({
        title: "Welcome to PeerSpark! 🎉",
        description: matchResult.joined.length
          ? `We auto-joined you to ${matchResult.joined.length} pods to get you started.`
          : "Your learning journey starts now! Recommendations are ready.",
      })
      router.push("/app/home")
    } catch (e: any) {
      toast({
        title: "Setup failed",
        description: e?.message || "Could not complete onboarding",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedIdentity !== ""
      case 1:
        return selectedInterests.length >= 1
      case 2:
        return selectedVibes.length >= 1
      case 3:
        return selectedGoals.length >= 1 && selectedPace !== "" && selectedSessionTypes.length >= 1
      case 4:
        return true
      case 5:
        return profileData.name !== ""
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose your learning identity</h2>
              <p className="text-muted-foreground">How do you see yourself in the learning community?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {LEARNING_IDENTITIES.map((identity) => (
                <Card
                  key={identity.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedIdentity === identity.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedIdentity(identity.id)}
                >
                  <CardContent className="p-4 text-center">
                    <identity.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">{identity.label}</h3>
                    <p className="text-sm text-muted-foreground">{identity.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select your interests</h2>
              <p className="text-muted-foreground">Pick up to 5 topics to help us find your tribe!</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {INTERESTS.map((interest) => (
                <Card
                  key={interest.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedInterests.includes(interest.id) ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (selectedInterests.includes(interest.id)) {
                      setSelectedInterests(selectedInterests.filter((id) => id !== interest.id))
                    } else if (selectedInterests.length < 5) {
                      setSelectedInterests([...selectedInterests, interest.id])
                    }
                  }}
                >
                  <CardContent className="p-3 text-center">
                    <interest.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="text-sm font-medium">{interest.label}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Selected: {selectedInterests.length}/5</p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">What&apos;s your learning vibe?</h2>
              <p className="text-muted-foreground">Tell us how you like to learn and engage</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {LEARNING_VIBES.map((vibe) => (
                <Card
                  key={vibe.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedVibes.includes(vibe.id) ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => {
                    if (selectedVibes.includes(vibe.id)) {
                      setSelectedVibes(selectedVibes.filter((id) => id !== vibe.id))
                    } else {
                      setSelectedVibes([...selectedVibes, vibe.id])
                    }
                  }}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start space-x-4">
                      <vibe.icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold mb-1">{vibe.label}</h3>
                        <p className="text-sm text-muted-foreground">{vibe.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">How do you like to study?</h2>
              <p className="text-muted-foreground">We will use this to match you with the right pods</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Your goals</h3>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_GOALS.map((goal) => (
                    <Button
                      key={goal.id}
                      variant={selectedGoals.includes(goal.id) ? "default" : "outline"}
                      onClick={() =>
                        setSelectedGoals((prev) =>
                          prev.includes(goal.id) ? prev.filter((g) => g !== goal.id) : [...prev, goal.id]
                        )
                      }
                    >
                      {goal.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Learning pace</h3>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_PACE.map((pace) => (
                    <Button
                      key={pace.id}
                      variant={selectedPace === pace.id ? "default" : "outline"}
                      onClick={() => setSelectedPace(pace.id)}
                    >
                      {pace.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Session type</h3>
                <div className="flex flex-wrap gap-2">
                  {SESSION_TYPES.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedSessionTypes.includes(type.id) ? "default" : "outline"}
                      onClick={() =>
                        setSelectedSessionTypes((prev) =>
                          prev.includes(type.id) ? prev.filter((v) => v !== type.id) : [...prev, type.id]
                        )
                      }
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Availability</h3>
                <div className="flex flex-wrap gap-2">
                  {AVAILABILITY.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedAvailability.includes(slot.id) ? "default" : "outline"}
                      onClick={() =>
                        setSelectedAvailability((prev) =>
                          prev.includes(slot.id) ? prev.filter((v) => v !== slot.id) : [...prev, slot.id]
                        )
                      }
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your recommended pods</h2>
              <p className="text-muted-foreground">Join 1-3 pods that fit your goals. You can skip and join later.</p>
            </div>
            <div className="space-y-3">
              {isLoadingRecos && <div className="text-center text-muted-foreground text-sm">Finding the best pods for you...</div>}
              {!isLoadingRecos && recommendedPods.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">No matches yet. You can still continue and explore later.</div>
              )}
              {recommendedPods.map(({ pod, score }) => (
                <Card key={pod.$id} className="border shadow-sm">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{pod.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{pod.description}</p>
                      </div>
                      <Badge variant="secondary">{score}% match</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" /> {pod.memberCount ?? pod.members?.length ?? 0} members
                      {pod.difficulty && <Badge variant="outline" className="text-xs">{pod.difficulty}</Badge>}
                      {(pod.tags || pod.matchingTags || []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={async () => {
                          if (!user?.$id) return
                          try {
                            await podService.joinPod(pod.$id, user.$id)
                            toast({ title: `Joined ${pod.name}`, description: "Welcome aboard!" })
                          } catch (e: any) {
                            toast({ title: "Couldn't join pod", description: e?.message, variant: "destructive" })
                          }
                        }}
                      >
                        Join pod
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedPod(pod.$id)}>Mark to join later</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Complete your profile</h2>
              <p className="text-muted-foreground">Let others know who you are</p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">
                      {profileData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const url = URL.createObjectURL(file)
                      setAvatarFile(file)
                      setProfileData({ ...profileData, avatar: url })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself... (e.g., I love studying late at night!)"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">PeerSpark</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">{renderStep()}</CardContent>
          <div className="flex justify-between p-6 border-t border-border">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {currentStep === totalSteps - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Setting up..." : "Start Learning"}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()} className="bg-primary hover:bg-primary/90">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
