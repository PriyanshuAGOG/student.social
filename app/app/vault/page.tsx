// @ts-nocheck
"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderOpen, Search, Upload, Filter, Grid3X3, List, FileText, ImageIcon, Video, Code, BookOpen, Download, Share2, Star, Eye, Clock, Heart, ExternalLink, Play, Loader2, RefreshCw, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { resourceService, profileService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { AppPageHeader } from "@/components/internal/AppPageHeader"

const RESOURCE_TYPES = [
  { id: "all", label: "All", icon: FolderOpen },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "videos", label: "Videos", icon: Video },
  { id: "code", label: "Code", icon: Code },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
]

interface Resource {
  $id: string
  title: string
  description: string
  category: string
  fileType: string
  fileSize: number
  fileUrl: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  podId?: string
  podName?: string
  tags: string[]
  uploadedAt: string
  views: number
  likes: number
  downloads: number
  isBookmarked?: boolean
  isLiked?: boolean
  visibility: string
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  } catch {
    return dateString
  }
}

// Get file format from file type
function getFileFormat(fileType: string): string {
  if (fileType.includes("pdf")) return "pdf"
  if (fileType.includes("image")) return "image"
  if (fileType.includes("video")) return "video"
  if (fileType.includes("javascript") || fileType.includes("typescript") || fileType.includes("text")) return "code"
  if (fileType.includes("json")) return "json"
  return "file"
}

export default function VaultPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [sortBy, setSortBy] = useState("recent")
  const [activeTab, setActiveTab] = useState("all")
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [myResourcesCount, setMyResourcesCount] = useState(0)
  const [bookmarkedCount, setBookmarkedCount] = useState(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadVisibility, setUploadVisibility] = useState("private")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const scopedPodId = searchParams.get("pod")

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("student:composer-focus", { detail: { focused: isUploading } }))
    return () => {
      window.dispatchEvent(new CustomEvent("student:composer-focus", { detail: { focused: false } }))
    }
  }, [isUploading])

  // Load resources from database
  const loadResources = useCallback(async () => {
    if (!user?.$id) return

    setIsLoading(true)
    try {
      // Load public resources, user's own resources, and pod-scoped resources when requested.
      const [publicResult, myResult, podResult] = await Promise.all([
        resourceService.getResources({ visibility: "public" }, 100),
        resourceService.getResources({ authorId: user.$id }, 100),
        scopedPodId ? resourceService.getResources({ podId: scopedPodId }, 100) : Promise.resolve({ documents: [] }),
      ])

      // Merge and deduplicate
      const allDocs = scopedPodId
        ? [...podResult.documents, ...myResult.documents]
        : [...publicResult.documents, ...myResult.documents]
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.$id === doc.$id)
      )

      // Enrich with author info
      const authorIds = [...new Set(uniqueDocs.map((d: any) => d.authorId).filter(Boolean))]
      const authorMap = new Map()
      
      await Promise.all(
        authorIds.map(async (authorId) => {
          try {
            const profile = await profileService.getProfile(authorId)
            if (profile) {
              authorMap.set(authorId, {
                name: profile.name || "Unknown",
                avatar: profile.avatar || "",
              })
            }
          } catch (e) {
            // Ignore
          }
        })
      )

      const transformedResources = uniqueDocs.map((doc: any) => ({
        $id: doc.$id,
        title: doc.title || doc.fileName || "Untitled",
        description: doc.description || "",
        category: doc.category || "other",
        fileType: doc.fileType || "",
        fileSize: doc.fileSize || 0,
        fileUrl: doc.fileUrl || "",
        authorId: doc.authorId,
        authorName: authorMap.get(doc.authorId)?.name || "Unknown",
        authorAvatar: authorMap.get(doc.authorId)?.avatar || "",
        podId: doc.podId,
        podName: doc.podName,
        tags: doc.tags || [],
        uploadedAt: doc.uploadedAt,
        views: doc.views || 0,
        likes: doc.likes || 0,
        downloads: doc.downloads || 0,
        isBookmarked: Array.isArray(doc.bookmarkedBy) ? doc.bookmarkedBy.includes(user.$id) : false,
        isLiked: Array.isArray(doc.likedBy) ? doc.likedBy.includes(user.$id) : false,
        visibility: doc.visibility || (doc.podId ? "pod" : "public"),
      }))

      setResources(transformedResources)
      setMyResourcesCount(transformedResources.filter((resource) => resource.authorId === user.$id).length)
      setBookmarkedCount(transformedResources.filter((resource) => resource.isBookmarked).length)
    } catch (error) {
      console.error("Failed to load resources:", error)
      toast({
        title: "Error",
        description: "Failed to load resources. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast, scopedPodId])

  useEffect(() => {
    if (!authLoading && user) {
      loadResources()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, loadResources, router])

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.$id) return

    setUploadFile(file)
    setUploadTitle(file.name.replace(/\.[^.]+$/, ""))
    setUploadDescription("")
    setUploadTags("")
    setUploadVisibility(scopedPodId ? "pod" : "private")
    event.target.value = ""
  }

  const submitUpload = async () => {
    const file = uploadFile
    if (!file || !user?.$id || !uploadTitle.trim()) return

    setIsUploading(true)
    try {
      await resourceService.uploadResource(user.$id, file, {
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        tags: uploadTags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean).slice(0, 10),
        visibility: scopedPodId ? "pod" : uploadVisibility,
        podId: scopedPodId || undefined,
      })

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded`,
      })

      // Refresh resources
      await loadResources()
      setUploadFile(null)
    } catch (error: any) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (resourceId: string) => {
    const resource = resources.find(r => r.$id === resourceId)
    if (resource) {
      toast({
        title: "Downloading",
        description: `Starting download of ${resource.title}`,
      })
      
      try {
        const download = await resourceService.downloadResource(resourceId)
        if (!download?.url) {
          throw new Error("Download URL missing")
        }
        window.open(download.url, "_blank")
        
        // Update local state
        setResources(prev => 
          prev.map(r => 
            r.$id === resourceId 
              ? { ...r, downloads: r.downloads + 1 }
              : r
          )
        )
      } catch (error) {
        console.error("Download failed:", error)
        toast({
          title: "Download Failed",
          description: "Failed to download resource. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLike = async (resourceId: string) => {
    if (!user?.$id) return

    try {
      const result = await resourceService.toggleLikeResource(resourceId, user.$id)
      setResources(prev =>
        prev.map(resource =>
          resource.$id === resourceId
            ? { ...resource, isLiked: result.isLiked, likes: result.likes }
            : resource
        )
      )

      const resource = resources.find(r => r.$id === resourceId)
      if (resource) {
        toast({
          title: result.isLiked ? "Resource Liked" : "Like Removed",
          description: result.isLiked ? `Added ${resource.title} to your liked resources` : "Removed from liked resources",
        })
      }
    } catch (error) {
      console.error("Like failed:", error)
      toast({
        title: "Like Failed",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async (resourceId: string) => {
    if (!user?.$id) return

    try {
      const result = await resourceService.toggleBookmarkResource(resourceId, user.$id)
      setResources(prev => 
        prev.map(resource => 
          resource.$id === resourceId 
            ? { ...resource, isBookmarked: result.bookmarked }
            : resource
        )
      )
      setBookmarkedCount((prev) => Math.max(0, prev + (result.bookmarked ? 1 : -1)))

      toast({
        title: result.bookmarked ? "Resource Bookmarked" : "Bookmark Removed",
        description: result.bookmarked ? "Saved to your bookmarks" : "Removed from bookmarks",
      })
    } catch (error) {
      console.error("Bookmark failed:", error)
      toast({
        title: "Bookmark Failed",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleView = (resourceId: string) => {
    const resource = resources.find(r => r.$id === resourceId)
    if (resource && resource.fileUrl) {
      toast({
        title: "Opening Resource",
        description: `Opening ${resource.title}`,
      })
      resourceService.incrementResourceView(resourceId)
        .then((result) => {
          setResources(prev =>
            prev.map(r =>
              r.$id === resourceId
                ? { ...r, views: result.views }
                : r
            )
          )
        })
        .catch((error) => {
          console.error("Failed to record resource view:", error)
        })
      window.open(resource.fileUrl, '_blank')
    }
  }

  const handleShare = (resourceId: string) => {
    const resource = resources.find(r => r.$id === resourceId)
    if (resource) {
      const shareUrl = `${window.location.origin}/app/vault?resource=${resourceId}`
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: `Share link for ${resource.title} copied to clipboard`,
      })
    }
  }

  // Hidden file input for upload
  const FileInput = () => (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      onChange={handleUpload}
      accept="*/*"
    />
  )

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resource.authorName || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType === "all" || resource.category === selectedType

    return matchesSearch && matchesType
  })

  const sortedResources = filteredResources.slice().sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.likes + b.views) - (a.likes + a.views)
      case "downloads":
        return b.downloads - a.downloads
      case "alphabetical":
        return a.title.localeCompare(b.title)
      case "recent":
      default:
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    }
  })

  const myUploads = sortedResources.filter((resource) => resource.authorId === user?.$id)
  const bookmarkedResources = sortedResources.filter((resource) => resource.isBookmarked)
  const recentResources = sortedResources.slice(0, 5)
  const hasResources = resources.length > 0

  const renderEmptyResources = (title = "No resources yet", description = "Upload notes, images, videos, code snippets, or flashcards to build your vault.") => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-4">{description}</p>
        <Button onClick={openFilePicker} className="bg-primary hover:bg-primary/90">
          <Upload className="w-4 h-4 mr-2" />
          Upload Resource
        </Button>
      </CardContent>
    </Card>
  )

  const getTypeIcon = (type: string) => {
    const typeMap = {
      notes: FileText,
      images: ImageIcon,
      videos: Video,
      code: Code,
      flashcards: BookOpen,
    }
    const Icon = typeMap[type as keyof typeof typeMap] || FileText
    return <Icon className="w-4 h-4" />
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "pod":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "private":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    )
  }

  const renderResourceGrid = (resources: Resource[]) => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => (
        <Card key={resource.$id} className="hover:shadow-md transition-shadow group">
          <CardContent className="p-4">
            {/* Thumbnail / Icon */}
            <div className="relative mb-3">
              <div 
                className="w-full h-32 bg-secondary/50 rounded-lg cursor-pointer flex items-center justify-center"
                onClick={() => handleView(resource.$id)}
              >
                {resource.fileType.includes("image") && resource.fileUrl ? (
                  <img
                    src={resource.fileUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    {getTypeIcon(resource.category)}
                  </div>
                )}
              </div>
              <div className="absolute top-2 left-2">
                <Badge className={getVisibilityColor(resource.visibility)}>{resource.visibility}</Badge>
              </div>
              <div className="absolute top-2 right-2">
                <div className="bg-black/50 rounded-full p-1 text-white">{getTypeIcon(resource.category)}</div>
              </div>
              {resource.category === "videos" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white rounded-full"
                    onClick={() => handleView(resource.$id)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary" onClick={() => handleView(resource.$id)}>
                  {resource.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{resource.description}</p>
              </div>

              {/* Author and Pod */}
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={resource.authorAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{(resource.authorName || "U")[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">{resource.authorName || "Unknown"}</span>
                {resource.podName && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Badge variant="outline" className="text-xs truncate">
                      {resource.podName}
                    </Badge>
                  </>
                )}
              </div>

              {/* Tags */}
              {resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {resource.views}
                  </span>
                  <span className="flex items-center">
                    <Heart className={`w-3 h-3 mr-1 ${resource.isLiked ? 'text-red-500 fill-current' : ''}`} />
                    {resource.likes}
                  </span>
                  <span className="flex items-center">
                    <Download className="w-3 h-3 mr-1" />
                    {resource.downloads}
                  </span>
                </div>
                <span>{formatFileSize(resource.fileSize)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  className="flex-1 min-w-[80px] bg-primary hover:bg-primary/90"
                  onClick={() => handleView(resource.$id)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownload(resource.$id)}
                  className="bg-transparent"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleLike(resource.$id)}
                  className={`bg-transparent ${resource.isLiked ? 'text-red-500 border-red-200' : ''}`}
                >
                  <Heart className={`w-3 h-3 ${resource.isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBookmark(resource.$id)}
                  className={`bg-transparent ${resource.isBookmarked ? 'text-yellow-500 border-yellow-200' : ''}`}
                >
                  <Star className={`w-3 h-3 ${resource.isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleShare(resource.$id)}
                  className="bg-transparent"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderResourceList = (resources: Resource[]) => (
    <div className="space-y-2">
      {resources.map((resource) => (
        <Card key={resource.$id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              {/* Thumbnail */}
              <div 
                className="w-16 h-16 bg-secondary/50 rounded-lg flex-shrink-0 cursor-pointer flex items-center justify-center"
                onClick={() => handleView(resource.$id)}
              >
                {resource.fileType.includes("image") && resource.fileUrl ? (
                  <img
                    src={resource.fileUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-muted-foreground scale-150">
                    {getTypeIcon(resource.category)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate cursor-pointer hover:text-primary" onClick={() => handleView(resource.$id)}>
                      {resource.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{resource.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={resource.authorAvatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{(resource.authorName || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{resource.authorName || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(resource.uploadedAt)}</span>
                      <Badge className={getVisibilityColor(resource.visibility)}>{resource.visibility}</Badge>
                    </div>
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground mt-2 sm:mt-0 sm:ml-4">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {resource.views}
                    </span>
                    <span className="flex items-center">
                      <Heart className={`w-3 h-3 mr-1 ${resource.isLiked ? 'text-red-500 fill-current' : ''}`} />
                      {resource.likes}
                    </span>
                    <span className="flex items-center">
                      <Download className="w-3 h-3 mr-1" />
                      {resource.downloads}
                    </span>
                    <span>{formatFileSize(resource.fileSize)}</span>
                    <div className="flex gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        onClick={() => handleView(resource.$id)}
                        className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownload(resource.$id)}
                        className="bg-transparent"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <FileInput />
      
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-8 md:pt-6">
        <AppPageHeader
          title={scopedPodId ? "Pod resources" : "Resource vault"}
          meta={<span>{resources.length} resources</span>}
          actions={<><Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? <Loader2 className="animate-spin" /> : <Upload />}Upload</Button><Button variant="outline" onClick={() => loadResources()}><RefreshCw />Refresh</Button></>}
        />
      </div>

      <div className="md:hidden px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search resources"
          />
        </div>

        {/* Mobile Type Filter */}
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedType === type.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <type.icon className="w-4 h-4" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 md:pb-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Folders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">My Resources</span>
                  <Badge variant="secondary" className="text-xs">
                    {myResourcesCount}
                  </Badge>
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">Shared Resources</span>
                  <Badge variant="secondary" className="text-xs">
                    {resources.filter(r => r.authorId !== user?.$id).length}
                  </Badge>
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Star className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">Bookmarked</span>
                  <Badge variant="secondary" className="text-xs">
                    {bookmarkedCount}
                  </Badge>
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">All Resources</span>
                  <Badge variant="secondary" className="text-xs">
                    {resources.length}
                  </Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Resource Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {RESOURCE_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "default" : "ghost"}
                    className={`w-full justify-start ${selectedType === type.id ? "bg-primary" : ""}`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <type.icon className="w-4 h-4 mr-3" />
                    {type.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Used</span>
                  <span>2.4 GB / 5 GB</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "48%" }}></div>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Upgrade Storage
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 md:space-y-6">
            {/* Desktop Search and Controls */}
            <div className="hidden md:flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources, tags, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  disabled={!hasResources}
                  aria-disabled={!hasResources}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={setSortBy} disabled={!hasResources}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>
                    <SelectItem value="alphabetical">A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-primary" : ""}
                    aria-label="Show resources in a grid"
                    aria-pressed={viewMode === "grid"}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-primary" : ""}
                    aria-label="Show resources in a list"
                    aria-pressed={viewMode === "list"}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile View Mode Toggle */}
            <div className="md:hidden flex items-center justify-between">
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-primary" : ""}
                  aria-label="Show resources in a grid"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary" : ""}
                  aria-label="Show resources in a list"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Select value={sortBy} onValueChange={setSortBy} disabled={!hasResources}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resources Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-2">All</TabsTrigger>
                <TabsTrigger value="my-uploads" className="text-xs sm:text-sm py-2">Uploads</TabsTrigger>
                <TabsTrigger value="bookmarked" className="text-xs sm:text-sm py-2">Bookmarks</TabsTrigger>
                <TabsTrigger value="recent" className="text-xs sm:text-sm py-2">Recent</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {sortedResources.length > 0
                  ? (viewMode === "grid" ? renderResourceGrid(sortedResources) : renderResourceList(sortedResources))
                  : renderEmptyResources(searchQuery || selectedType !== "all" ? "No matching resources" : "No resources yet", searchQuery || selectedType !== "all" ? "Clear search and filters or upload a new resource." : undefined)}
              </TabsContent>

              <TabsContent value="my-uploads" className="space-y-4">
                {myUploads.length > 0 ? (
                  viewMode === "grid" ? renderResourceGrid(myUploads) : renderResourceList(myUploads)
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Start sharing your knowledge with the community
                      </p>
                      <Button onClick={openFilePicker} className="bg-primary hover:bg-primary/90">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Resource
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="bookmarked" className="space-y-4">
                {bookmarkedResources.length > 0
                  ? (viewMode === "grid" ? renderResourceGrid(bookmarkedResources) : renderResourceList(bookmarkedResources))
                  : renderEmptyResources("No bookmarked resources", "Bookmark useful resources and they will appear here.")}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Viewed</CardTitle>
                    <CardDescription>Resources you&apos;ve accessed in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentResources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recently viewed resources yet.</p>
                    ) : recentResources.map((resource) => (
                      <div key={resource.$id} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          {getTypeIcon(resource.category)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{resource.title}</h4>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Uploaded {formatRelativeTime(resource.uploadedAt)}</span>
                            <span>•</span>
                            <span>{formatFileSize(resource.fileSize)}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleView(resource.$id)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {uploadFile ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Add resource to Vault">
          <div className="w-full max-w-xl overflow-hidden rounded-t-[30px] border border-border/60 bg-card shadow-2xl sm:rounded-[30px]">
            <header className="flex items-start justify-between border-b border-border/50 px-5 py-4">
              <div><h2 className="text-base font-semibold tracking-[-0.02em]">Add to Resource Vault</h2><p className="mt-0.5 text-xs text-muted-foreground">Describe it once so it stays searchable across chats, Pods, calendar, and AI.</p></div>
              <button type="button" onClick={() => setUploadFile(null)} disabled={isUploading} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Cancel upload"><X className="h-4 w-4" /></button>
            </header>
            <div className="max-h-[70dvh] space-y-4 overflow-y-auto p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border/55 bg-background p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#6f6a4f]/12 text-[#6f6a4f] dark:text-[#c9c39e]"><FileText className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium">{uploadFile.name}</span><span className="block text-xs text-muted-foreground">{uploadFile.type || "File"} · {formatFileSize(uploadFile.size)}</span></span></div>
              <label className="block text-xs font-medium text-muted-foreground">Resource title<Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} maxLength={180} className="mt-1.5 h-11 bg-background text-foreground" /></label>
              <label className="block text-xs font-medium text-muted-foreground">Description<textarea value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value.slice(0, 2000))} rows={3} placeholder="What will this help someone learn?" className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/45 focus:ring-2 focus:ring-primary/10" /></label>
              <label className="block text-xs font-medium text-muted-foreground">Tags<Input value={uploadTags} onChange={(event) => setUploadTags(event.target.value)} placeholder="java, interview, week-2" className="mt-1.5 h-11 bg-background text-foreground" /><span className="mt-1 block text-[10px] font-normal opacity-70">Separate up to 10 tags with commas.</span></label>
              {!scopedPodId ? <label className="block text-xs font-medium text-muted-foreground">Access<Select value={uploadVisibility} onValueChange={setUploadVisibility}><SelectTrigger className="mt-1.5 h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">Only me</SelectItem><SelectItem value="public">Student.social community</SelectItem></SelectContent></Select></label> : null}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-border/50 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:pb-4"><Button variant="ghost" onClick={() => setUploadFile(null)} disabled={isUploading}>Cancel</Button><Button onClick={submitUpload} disabled={isUploading || !uploadTitle.trim()}>{isUploading ? <Loader2 className="animate-spin" /> : <Upload />} {isUploading ? "Uploading…" : "Add to Vault"}</Button></footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
