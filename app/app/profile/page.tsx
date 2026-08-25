// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, Calendar, LinkIcon, Edit, MessageSquare, UserPlus, Target, BookOpen, Users, Clock, Award, TrendingUp, Heart, Share2, Settings, Shield, Bell, Key, Palette, Globe, User, Upload, Save, Crown, Zap, Download, Trash2, Bookmark } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { feedService, profileService } from "@/lib/appwrite"

// Default profile structure (will be overwritten with actual user data)
const DEFAULT_PROFILE = {
  name: "",
  username: "",
  avatar: "/placeholder.svg?height=120&width=120",
  bio: "",
  location: "",
  website: "",
  joinedDate: "",
  followers: 0,
  following: 0,
  isFollowing: false,
  stats: {
    studyStreak: 0,
    totalHours: 0,
    podsJoined: 0,
    resourcesShared: 0,
    postsCreated: 0,
    helpfulVotes: 0,
  },
}

const USER_ACHIEVEMENTS = [
  {
    id: "1",
    title: "Study Streak Master",
    description: "Maintained a 30+ day study streak",
    icon: "🔥",
    earned: true,
    progress: 100,
    rarity: "Epic",
  },
  {
    id: "2",
    title: "Knowledge Sharer",
    description: "Shared 20+ helpful resources",
    icon: "📚",
    earned: true,
    progress: 100,
    rarity: "Rare",
  },
  {
    id: "3",
    title: "Community Helper",
    description: "Received 100+ helpful votes",
    icon: "🤝",
    earned: true,
    progress: 100,
    rarity: "Rare",
  },
  {
    id: "4",
    title: "Pod Leader",
    description: "Successfully led a study pod",
    icon: "👑",
    earned: false,
    progress: 75,
    rarity: "Legendary",
  },
  {
    id: "5",
    title: "Mentor",
    description: "Helped 50+ students achieve their goals",
    icon: "🎓",
    earned: false,
    progress: 60,
    rarity: "Epic",
  },
  {
    id: "6",
    title: "Code Warrior",
    description: "Solved 500+ coding problems",
    icon: "⚔️",
    earned: false,
    progress: 45,
    rarity: "Legendary",
  },
]

function relationshipCount(value: unknown, fallback = 0) {
  if (Array.isArray(value)) return value.length
  if (typeof value === "number") return value
  return fallback
}

// Sample posts are no longer used - posts are loaded dynamically from database
// Keeping empty array as placeholder for fallback
const USER_POSTS: any[] = []

const USER_ACTIVITY = [
  {
    id: "1",
    type: "achievement",
    message: "Earned the 'Study Streak Master' achievement",
    timestamp: "2 hours ago",
    icon: "🏆",
  },
  {
    id: "2",
    type: "post",
    message: "Created a new post about system design learning",
    timestamp: "2 days ago",
    icon: "📝",
  },
  {
    id: "3",
    type: "pod",
    message: "Joined the 'Advanced React Patterns' pod",
    timestamp: "3 days ago",
    icon: "👥",
  },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isOwnProfile] = useState(true)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // User profile state - loaded from database
  const [userProfile, setUserProfile] = useState(DEFAULT_PROFILE)

  // Load user profile from Appwrite
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.$id) {
        setIsLoadingProfile(false)
        return
      }
      
      try {
        const profile = await profileService.getProfile(user.$id)
        
        // Format joined date
        const joinedDate = user.$createdAt 
          ? new Date(user.$createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : profile?.joinedAt 
            ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : ""
        
        setUserProfile({
          name: user.name || profile?.name || "",
          username: `@${(user.name || profile?.name || "user").toLowerCase().replace(/\s+/g, '_')}`,
          avatar: profile?.avatar || "/placeholder.svg?height=120&width=120",
          bio: profile?.bio || "",
          location: profile?.location || "",
          website: profile?.website || "",
          joinedDate,
          followers: relationshipCount(profile?.followers, profile?.followerCount || 0),
          following: relationshipCount(profile?.following, profile?.followingCount || 0),
          isFollowing: false,
          stats: {
            studyStreak: profile?.studyStreak || 0,
            totalHours: profile?.totalHours || 0,
            podsJoined: profile?.podsJoined || 0,
            resourcesShared: profile?.resourcesShared || 0,
            postsCreated: profile?.postsCreated || 0,
            helpfulVotes: profile?.helpfulVotes || 0,
          },
        })
      } catch (error) {
        console.error("Failed to load profile:", error)
        // Use auth user data as fallback
        if (user) {
          setUserProfile(prev => ({
            ...prev,
            name: user.name || "",
            username: `@${(user.name || "user").toLowerCase().replace(/\s+/g, '_')}`,
          }))
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }
    
    loadProfile()
  }, [user])

  // Load user's posts from Appwrite
  useEffect(() => {
    const loadPosts = async () => {
      if (!user?.$id) return
      setIsLoadingPosts(true)
      try {
        const [result, savedResult] = await Promise.all([
          feedService.getUserPosts(user.$id),
          feedService.getSavedPosts(user.$id),
        ])
        const savedIds = new Set((savedResult.documents || []).map((post: any) => post.$id))
        const posts = (result.documents || []).map((p: any) => ({
          id: p.$id,
          title: p.content?.substring(0, 50) || "Post",
          content: p.content || "",
          timestamp: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "Recently",
          likes: p.likes || 0,
          comments: p.comments || 0,
          isLiked: (p.likedBy || []).includes(user.$id),
          isBookmarked: savedIds.has(p.$id),
          tags: p.tags || [],
          image: p.imageUrl || null,
        }))
        setUserPosts(posts)
      } catch (error) {
        console.error("Failed to load posts:", error)
      } finally {
        setIsLoadingPosts(false)
      }
    }
    loadPosts()
  }, [user?.$id])

  // Profile edit state - synced with userProfile
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  })

  // Sync profile edit data with loaded profile
  useEffect(() => {
    setProfileData({
      name: userProfile.name,
      bio: userProfile.bio,
      location: userProfile.location,
      website: userProfile.website,
    })
  }, [userProfile])

  // Settings state
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    showStudyStats: true,
    allowPodInvites: true,
    showOnlineStatus: false,
    allowDirectMessages: true,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    sessionReminders: true,
    podUpdates: true,
    socialNotifications: false,
    weeklyDigest: true,
  })

  const handleFollow = () => {
    if (isOwnProfile) {
      toast({
        title: "Own profile",
        description: "You cannot follow your own profile.",
      })
      return
    }
    setIsFollowing(!isFollowing)
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing ? `You unfollowed ${userProfile.name}` : `You are now following ${userProfile.name}`,
    })
  }

  const handleMessage = () => {
    router.push("/app/chat")
  }

  const handleEditProfile = () => {
    setIsEditDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!user?.$id) return
    
    try {
      await profileService.updateProfile(user.$id, {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
      })
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
      }))
      
      setIsEditDialogOpen(false)
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  const handleSettings = () => {
    router.push('/app/settings')
  }

  const handleLike = async (postId: string) => {
    if (!user?.$id) return
    try {
      const updated = await feedService.toggleLike(postId, user.$id)
      setUserPosts(prev => prev.map(post => (
        post.id === postId
          ? { ...post, isLiked: updated.isLiked, likes: updated.likes || 0 }
          : post
      )))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update like.",
        variant: "destructive",
      })
    }
  }

  const handleComment = (postId: string) => {
    router.push(`/app/feed?post=${postId}`)
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.$id) return
    try {
      const result = await feedService.toggleSavePost(postId, user.$id)
      setUserPosts(prev => prev.map(post => (
        post.id === postId
          ? { ...post, isBookmarked: result.saved }
          : post
      )))
      toast({
        title: result.saved ? "Post Saved" : "Bookmark Removed",
        description: result.saved ? "Added to your saved posts" : "Removed from saved posts",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update bookmark.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (postId: string) => {
    const post = userPosts.find((item) => item.id === postId)
    const shareUrl = `${window.location.origin}/app/feed?post=${postId}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Student.social post",
          text: post?.content?.slice(0, 160) || "Check out this Student.social post",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Shared",
          description: "Post link copied to clipboard!",
        })
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not share this post right now.", variant: "destructive" })
      }
    }
  }

  const handlePostClick = (authorId: string) => {
    if (user?.$id && authorId === user.$id) {
      router.push('/app/profile')
      return
    }

    router.push(`/app/profile/${authorId}`)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common":
        return "text-gray-500"
      case "Rare":
        return "text-blue-500"
      case "Epic":
        return "text-purple-500"
      case "Legendary":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-3 md:px-8 md:pt-6">
        <Card className="student-profile-card mb-4 overflow-hidden md:mb-8">
          <div className="student-profile-cover">
            <div>
              <span>LEARNING IDENTITY</span>
              <p>A living record of what you study, share, and build with others.</p>
            </div>
            <div className="student-profile-cover-stat">
              <strong>{userProfile.stats.studyStreak}</strong>
              <span>day momentum</span>
            </div>
          </div>
          <CardContent className="student-profile-content">
            <div className="student-profile-identity">
              <Avatar className="student-profile-avatar">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
                <AvatarFallback>
                  {userProfile.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="student-profile-copy">
                <div>
                  <h1>{userProfile.name}</h1>
                  <p>{userProfile.username}</p>
                </div>
                <p className="student-profile-bio">{userProfile.bio}</p>
                <div className="student-profile-meta">
                  {userProfile.location ? <span><MapPin />{userProfile.location}</span> : null}
                  {userProfile.website ? <span><LinkIcon />{userProfile.website}</span> : null}
                  <span><Calendar />Joined {userProfile.joinedDate}</span>
                </div>
              </div>

              <div className="student-profile-actions">
                {isOwnProfile ? (
                  <>
                    <Button onClick={handleEditProfile} variant="outline"><Edit />Edit profile</Button>
                    <Button onClick={handleSettings}><Settings />Settings</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleMessage} variant="outline"><MessageSquare />Message</Button>
                    <Button onClick={handleFollow} className={isFollowing ? "bg-muted hover:bg-muted/80 text-muted-foreground" : ""}>
                      <UserPlus />{isFollowing ? "Following" : "Follow"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="student-profile-network">
              <div><strong>{userProfile.following.toLocaleString()}</strong><span>Following</span></div>
              <div><strong>{userProfile.followers.toLocaleString()}</strong><span>Followers</span></div>
              <div><strong>{USER_ACHIEVEMENTS.filter((achievement) => achievement.earned).length}</strong><span>Milestones</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="student-profile-stats grid gap-3 grid-cols-2 md:grid-cols-4 mb-4 md:mb-8">
          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Target className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold">{userProfile.stats.studyStreak}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold">{userProfile.stats.totalHours}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Study Hours</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Users className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold">{userProfile.stats.podsJoined}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pods Joined</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold">{userProfile.stats.resourcesShared}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Resources Shared</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="student-profile-tabs mb-6">
          <div className="border-b border-border">
            <div className="flex space-x-0" role="tablist" aria-label="Profile sections">
              {[
                { value: "posts", label: "Posts", icon: "📝", count: userPosts.length },
                { value: "achievements", label: "Achievements", icon: "🏆", count: USER_ACHIEVEMENTS.filter(a => a.earned).length },
                { value: "activity", label: "Activity", icon: "⚡", count: USER_ACTIVITY.length },
                { value: "stats", label: "Stats", icon: "📊", count: null },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 flex flex-col items-center py-3 px-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.value
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    <span className="text-lg">{tab.icon}</span>
                    {tab.count !== null && (
                      <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1">
                        {tab.count}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="posts" className="space-y-4">
            {isLoadingPosts && (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            )}
            {!isLoadingPosts && userPosts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                </CardContent>
              </Card>
            )}
            {userPosts.map((post) => (
              <Card key={post.id} className="student-feed-post hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar 
                      className="w-8 h-8 cursor-pointer" 
                    >
                      <AvatarImage src={user?.prefs?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user?.name?.slice(0, 2) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p 
                        className="font-medium text-sm cursor-pointer hover:underline"
                      >
                        {user?.name || "You"}
                      </p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                    </div>
                  </div>

                  {post.title && <h3 className="font-semibold text-base md:text-lg mb-3">{post.title}</h3>}
                  <div className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`${post.isLiked ? "text-red-500" : ""} hover:text-red-500 h-8 px-2 md:px-3`}
                        aria-label={post.isLiked ? "Unlike this post" : "Like this post"}
                      >
                        <Heart className={`w-4 h-4 mr-1 md:mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                        <span className="text-xs md:text-sm">{post.likes}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:text-blue-500 h-8 px-2 md:px-3"
                        onClick={() => handleComment(post.id)}
                        aria-label="Comment on this post"
                      >
                        <MessageSquare className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">{post.comments}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post.id)}
                        className="hover:text-green-500 h-8 px-2 md:px-3"
                        aria-label="Share this post"
                      >
                        <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">0</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(post.id)}
                        className={`${post.isBookmarked ? "text-yellow-500" : ""} hover:text-yellow-500 h-8 px-2 md:px-3`}
                        aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark this post"}
                      >
                        <Bookmark className={`w-4 h-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {USER_ACHIEVEMENTS.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`${achievement.earned ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10" : "opacity-75"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{achievement.title}</h4>
                          <Badge
                            variant={achievement.earned ? "default" : "secondary"}
                            className={`text-xs ${getRarityColor(achievement.rarity)}`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {USER_ACTIVITY.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Study Consistency</span>
                        <span className="text-sm text-muted-foreground">92%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Goal Achievement</span>
                        <span className="text-sm text-muted-foreground">78%</span>
                      </div>
                      <Progress value={78} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Award className="w-4 h-4 mr-2" />
                    Achievements Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-yellow-600">3</div>
                      <div className="text-xs text-muted-foreground">Earned</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">3</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Make changes to your profile information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings & Preferences</DialogTitle>
            <DialogDescription>Manage your account settings and preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Privacy Settings */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow others to find and view your profile</p>
                  </div>
                  <Switch
                    checked={privacySettings.profilePublic}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, profilePublic: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Study Statistics</Label>
                    <p className="text-sm text-muted-foreground">Display your study hours and streaks</p>
                  </div>
                  <Switch
                    checked={privacySettings.showStudyStats}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showStudyStats: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Pod Invitations</Label>
                    <p className="text-sm text-muted-foreground">Let others invite you to study pods</p>
                  </div>
                  <Switch
                    checked={privacySettings.allowPodInvites}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowPodInvites: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pod Updates</Label>
                    <p className="text-sm text-muted-foreground">Notifications about pod activities</p>
                  </div>
                  <Switch
                    checked={notificationSettings.podUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, podUpdates: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Account
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSettingsDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
