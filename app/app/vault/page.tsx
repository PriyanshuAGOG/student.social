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
import { FolderOpen, Search, Upload, Filter, Grid3X3, List, FileText, ImageIcon, Video, Code, BookOpen, Download, Share2, Star, Eye, Clock, Heart, ExternalLink, Play, Loader2, RefreshCw } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { resourceService, profileService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Load resources from database
  const loadResources = useCallback(async () => {
    if (!user?.$id) return

    setIsLoading(true)
    try {
      // Load all public resources and user's own resources
      const [publicResult, myResult] = await Promise.all([
        resourceService.getResources({ visibility: "public" }, 100),
        resourceService.getResources({ authorId: user.$id }, 100),
      ])

      // Merge and deduplicate
      const allDocs = [...publicResult.documents, ...myResult.documents]
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
        isBookmarked: false, // TODO: Implement bookmarks
        isLiked: false, // TODO: Implement likes
        visibility: doc.visibility || "public",
      }))

      setResources(transformedResources)
      setMyResourcesCount(myResult.documents.length)
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
  }, [user, toast])

  useEffect(() => {
    if (!authLoading && user) {
      loadResources()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, loadResources, router])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.$id) return

    setIsUploading(true)
    try {
      await resourceService.uploadResource(file, {
        title: file.name,
        description: "",
        tags: [],
        authorId: user.$id,
        visibility: "public",
        category: getCategoryFromFileType(file.type),
      })

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded`,
      })

      // Refresh resources
      await loadResources()
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getCategoryFromFileType = (fileType: string): string => {
    if (fileType.includes("image")) return "images"
    if (fileType.includes("video")) return "videos"
    if (fileType.includes("pdf") || fileType.includes("document")) return "notes"
    if (fileType.includes("javascript") || fileType.includes("typescript") || fileType.includes("text/plain")) return "code"
    return "other"
  }

  const handleDownload = async (resourceId: string) => {
    const resource = resources.find(r => r.$id === resourceId)
    if (resource) {
      toast({
        title: "Downloading",
        description: `Starting download of ${resource.title}`,
      })
      
      try {
        const downloadUrl = await resourceService.downloadResource(resourceId)
        window.open(downloadUrl.toString(), "_blank")
        
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

  const handleLike = (resourceId: string) => {
    setResources(prev => 
      prev.map(resource => 
        resource.$id === resourceId 
          ? { 
              ...resource, 
              isLiked: !resource.isLiked,
              likes: resource.isLiked ? resource.likes - 1 : resource.likes + 1
            }
          : resource
      )
    )
    
    const resource = resources.find(r => r.$id === resourceId)
    if (resource) {
      toast({
        title: resource.isLiked ? "Like Removed" : "Resource Liked",
        description: resource.isLiked ? "Removed from liked resources" : `Added ${resource.title} to your liked resources`,
      })
    }
  }

  const handleBookmark = (resourceId: string) => {
    setResources(prev => 
      prev.map(resource => 
        resource.$id === resourceId 
          ? { ...resource, isBookmarked: !resource.isBookmarked }
          : resource
      )
    )
    
    const resource = resources.find(r => r.$id === resourceId)
    if (resource) {
      toast({
        title: resource.isBookmarked ? "Bookmark Removed" : "Resource Bookmarked",
        description: resource.isBookmarked ? "Removed from bookmarks" : `Saved ${resource.title} to your bookmarks`,
      })
    }
  }

  const handleView = (resourceId: string) => {
    const resource = resources.find(r => r.$id === resourceId)
    if (resource && resource.fileUrl) {
      setResources(prev => 
        prev.map(r => 
          r.$id === resourceId 
            ? { ...r, views: r.views + 1 }
            : r
        )
      )
      toast({
        title: "Opening Resource",
        description: `Opening ${resource.title}`,
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
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === "all" || resource.category === selectedType

    return matchesSearch && matchesType
  })

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
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Resource Vault</h1>
            <p className="text-sm text-muted-foreground">Your learning library</p>
          </div>
          <Button 
            size="sm" 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-primary hover:bg-primary/90"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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

      {/* Desktop Header */}
      <div className="hidden md:block p-4 md:p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Resource Vault</h1>
              <p className="text-muted-foreground">Your centralized learning library</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => loadResources()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-primary hover:bg-primary/90"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Resource
              </Button>
            </div>
          </div>
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
                    {resources.filter(r => r.isBookmarked).length}
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
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
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
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-primary" : ""}
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
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-primary" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
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
                {viewMode === "grid" ? renderResourceGrid(filteredResources) : renderResourceList(filteredResources)}
              </TabsContent>

              <TabsContent value="my-uploads" className="space-y-4">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start sharing your knowledge with the community
                    </p>
                    <Button onClick={handleUpload} className="bg-primary hover:bg-primary/90">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Resource
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookmarked" className="space-y-4">
                {viewMode === "grid"
                  ? renderResourceGrid(filteredResources.filter((r) => r.isBookmarked))
                  : renderResourceList(filteredResources.filter((r) => r.isBookmarked))}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Viewed</CardTitle>
                    <CardDescription>Resources you&apos;ve accessed in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredResources.slice(0, 5).map((resource) => (
                      <div key={resource.id} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          {getTypeIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{resource.title}</h4>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Viewed {resource.uploadDate}</span>
                            <span>•</span>
                            <span>{resource.size}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleView(resource.id)}>
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
    </div>
  )
}
