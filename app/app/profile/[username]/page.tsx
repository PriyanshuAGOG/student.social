"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { MapPin, Calendar, LinkIcon, MessageSquare, UserPlus, Target, BookOpen, Users, Clock, Award, TrendingUp, Heart, Share2, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { profileService, feedService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { Query } from "appwrite"

interface UserProfile {
  userId: string
  name: string
  username: string
  avatar: string
  bio: string
  location: string
  website: string
  joinedDate: string
  followers: number
  following: number
  isFollowing: boolean
  stats: {
    studyStreak: number
    totalHours: number
    podsJoined: number
    resourcesShared: number
    postsCreated: number
    helpfulVotes: number
  }
}

interface Post {
  id: string
  title: string
  content: string
  timestamp: string
  likes: number
  comments: number
  shares?: number
  tags: string[]
  isLiked: boolean
  isBookmarked: boolean
}

function relationshipCount(value: unknown, fallback = 0) {
  if (Array.isArray(value)) return value.length
  if (typeof value === "number") return value
  return fallback
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState("posts")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  // Load profile by username
  const loadProfile = useCallback(async () => {
    if (!username) return

    setIsLoading(true)
    try {
      // Try to find profile by username (search by name or email prefix)
      const searchName = username.replace(/_/g, " ")
      const profile = await profileService.getProfileByUsername(username)
      
      if (profile) {
        const joinedDate = profile.joinedAt
          ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : ""

        setUserProfile({
          userId: profile.userId || profile.$id,
          name: profile.name || username,
          username: `@${username}`,
          avatar: profile.avatar || "/placeholder.svg?height=120&width=120",
          bio: profile.bio || "",
          location: profile.location || "",
          website: profile.website || "",
          joinedDate,
          followers: relationshipCount(profile.followers, profile.followerCount || 0),
          following: relationshipCount(profile.following, profile.followingCount || 0),
          isFollowing: false,
          stats: {
            studyStreak: profile.studyStreak || 0,
            totalHours: profile.totalHours || 0,
            podsJoined: profile.podsJoined || 0,
            resourcesShared: profile.resourcesShared || 0,
            postsCreated: profile.postsCreated || 0,
            helpfulVotes: profile.helpfulVotes || 0,
          },
        })
      } else {
        toast({
          title: "User not found",
          description: "Could not find a user with that username.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [username, toast])

  // Load user posts
  const loadPosts = useCallback(async () => {
    if (!userProfile?.userId) return

    setIsLoadingPosts(true)
    try {
      const [result, savedResult] = await Promise.all([
        feedService.getUserPosts(userProfile.userId),
        user?.$id ? feedService.getSavedPosts(user.$id) : Promise.resolve({ documents: [] }),
      ])
      const savedIds = new Set((savedResult.documents || []).map((post: any) => post.$id))
      const posts = (result.documents || []).map((p: any) => ({
        id: p.$id,
        title: p.content?.substring(0, 50) || "Post",
        content: p.content || "",
        timestamp: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "Recently",
        likes: p.likes || 0,
        comments: p.comments || 0,
        shares: 0,
        tags: p.tags || [],
        isLiked: user?.$id ? (p.likedBy || []).includes(user.$id) : false,
        isBookmarked: savedIds.has(p.$id),
      }))
      setUserPosts(posts)
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [userProfile?.userId, user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (userProfile) {
      loadPosts()
    }
  }, [userProfile, loadPosts])

  useEffect(() => {
    const checkFollow = async () => {
      if (!user?.$id || !userProfile?.userId) return
      try {
        const following = await profileService.isFollowing(user.$id, userProfile.userId)
        setIsFollowing(following)
      } catch (error) {
        console.error("Failed to check follow state:", error)
      }
    }

    checkFollow()
  }, [user?.$id, userProfile?.userId])

  const handleFollow = async () => {
    if (!user?.$id || !userProfile) return

    try {
      const response = await fetch(`/api/users/${userProfile.userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.$id }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update follow state")
      }

      const nextFollowing = Boolean(data.isFollowing)
      setIsFollowing(nextFollowing)
      setUserProfile(prev => prev ? ({
        ...prev,
        followers: typeof data.followerCount === "number"
          ? data.followerCount
          : Math.max(0, prev.followers + (nextFollowing ? 1 : -1)),
      }) : prev)

      toast({
        title: nextFollowing ? "Following" : "Unfollowed",
        description: data.message || (nextFollowing ? `You are now following ${userProfile.name}` : `You unfollowed ${userProfile.name}`),
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update follow state",
        variant: "destructive",
      })
    }
  }

  const handleMessage = () => {
    if (!userProfile) return
    router.push(`/app/messages/${userProfile.userId}`)
  }

  const handleLike = async (postId: string) => {
    if (!user?.$id) return
    try {
      const updated = await feedService.toggleLike(postId, user.$id)
      setUserPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isLiked: updated.isLiked, likes: updated.likes || 0 }
            : post,
        ),
      )
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update like state.",
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
          title: post?.title || `${userProfile?.name || "Student.social"} post`,
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  // User not found
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The user &quot;{username}&quot; could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 pt-3 md:px-8 md:pt-6">
        <Card className="student-profile-card mb-4 overflow-hidden md:mb-8">
          <div className="student-profile-cover">
            <div>
              <span>LEARNING PROFILE</span>
              <p>See what {userProfile.name} is exploring, contributing, and building with the community.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft />Back</Button>
          </div>
          <CardContent className="student-profile-content">
            <div className="student-profile-identity">
              <Avatar className="student-profile-avatar">
                <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="student-profile-copy">
                <div><h1>{userProfile.name}</h1><p>{userProfile.username}</p></div>
                {userProfile.bio ? <p className="student-profile-bio">{userProfile.bio}</p> : null}
                <div className="student-profile-meta">
                  {userProfile.location ? <span><MapPin />{userProfile.location}</span> : null}
                  {userProfile.website ? <span><LinkIcon />{userProfile.website}</span> : null}
                  {userProfile.joinedDate ? <span><Calendar />Joined {userProfile.joinedDate}</span> : null}
                </div>
              </div>
              <div className="student-profile-actions">
                <Button onClick={handleMessage} variant="outline"><MessageSquare />Message</Button>
                <Button onClick={handleFollow} className={isFollowing ? "bg-muted hover:bg-muted/80 text-muted-foreground" : ""}>
                  <UserPlus />{isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            </div>
            <div className="student-profile-network">
              <button type="button"><strong>{userProfile.following.toLocaleString()}</strong><span>Following</span></button>
              <button type="button"><strong>{userProfile.followers.toLocaleString()}</strong><span>Followers</span></button>
              <div><strong>{userPosts.length}</strong><span>Shared posts</span></div>
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
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          {/* Tab navigation */}
          <div className="student-profile-tabs mb-6">
            <div className="border-b border-border">
              <div className="flex space-x-0">
                {[
                  { value: "posts", label: "Posts", icon: "📝", count: userPosts.length },
                  { value: "achievements", label: "Achievements", icon: "🏆", count: 5 },
                  { value: "activity", label: "Activity", icon: "⚡", count: null },
                ].map((tab) => (
                  <button
                    key={tab.value}
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

          <TabsContent value="posts" className="space-y-4">
            {userPosts.map((post) => (
              <Card key={post.id} className="student-feed-post hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={userProfile.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{userProfile.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{userProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                    </div>
                  </div>

                  {post.title && <h3 className="font-semibold text-base md:text-lg mb-3">{post.title}</h3>}
                  <div className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</div>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
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
                      >
                        <Heart className={`w-4 h-4 mr-1 md:mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                        <span className="text-xs md:text-sm">{post.likes}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:text-blue-500 h-8 px-2 md:px-3">
                        <MessageSquare className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">{post.comments}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post.id)}
                        className="hover:text-green-500 h-8 px-2 md:px-3"
                      >
                        <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                        <span className="text-xs md:text-sm">{post.shares}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No public achievements</h3>
              <p className="text-muted-foreground">This user&apos;s achievements are private</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
              <p className="text-muted-foreground">This user&apos;s activity is private</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
