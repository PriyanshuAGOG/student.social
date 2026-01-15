// @ts-nocheck
"use client"

/**
 * EnhancedMembersTab Component
 * 
 * Complete member management with invite functionality, member list, and admin controls.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  UserPlus, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Crown, 
  MoreVertical,
  Search,
  Mail,
  Loader2,
  MessageSquare
} from "lucide-react"
import { podService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Member {
  id: string
  name: string
  role?: string
  avatar?: string
  isOnline?: boolean
  bio?: string
  streak?: number
  points?: number
}

interface EnhancedMembersTabProps {
  podId: string
  pod: any
  memberProfiles: Member[]
  isCreator: boolean
  onMemberInvited?: () => void
}

export function EnhancedMembersTab({ 
  podId, 
  pod, 
  memberProfiles, 
  isCreator,
  onMemberInvited 
}: EnhancedMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    const loadInviteLink = async () => {
      try {
        const result = await podService.generateInviteLink(podId, user?.$id)
        const link = typeof result === "string" ? result : result?.inviteLink
        if (!cancelled && link) {
          setInviteLink(link)
        }
      } catch (error: any) {
        if (cancelled) return
        setInviteLink("")
        toast({
          title: "Invite link unavailable",
          description: error?.message || "Could not generate invite link",
          variant: "destructive",
        })
      }
    }

    loadInviteLink()
    return () => {
      cancelled = true
    }
  }, [podId, user?.$id, toast])
  
  const handleCopyLink = async () => {
    if (!inviteLink) {
      toast({ title: "Invite link unavailable", description: "Try again in a moment", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast({ title: "Link copied!", description: "Share this link to invite members." })
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast({ title: "Failed to copy", description: "Please copy the link manually.", variant: "destructive" })
    }
  }

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !user?.$id) return
    
    setIsInviting(true)
    try {
      await podService.addMemberByEmail(podId, inviteEmail.trim(), user.$id)
      toast({ 
        title: "Member invited!", 
        description: `${inviteEmail} has been added to the pod.` 
      })
      setInviteEmail("")
      setInviteDialogOpen(false)
      onMemberInvited?.()
    } catch (error: any) {
      toast({ 
        title: "Failed to invite", 
        description: error?.message || "Could not find user with this email.",
        variant: "destructive" 
      })
    } finally {
      setIsInviting(false)
    }
  }

  const filteredMembers = memberProfiles.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.bio || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineMembers = filteredMembers.filter(m => m.isOnline)
  const offlineMembers = filteredMembers.filter(m => !m.isOnline)

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pod Members ({memberProfiles.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {onlineMembers.length} online now
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          
          {/* Invite Dialog */}
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Members to {pod.name}</DialogTitle>
                <DialogDescription>
                  Share the invite link or add members by their email address.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Invite Link */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Share Invite Link
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      value={inviteLink} 
                      readOnly 
                      className="flex-1 text-xs"
                    />
                    <Button onClick={handleCopyLink} variant="outline" size="icon">
                      {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Anyone with this link can join the pod
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Invite by Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Add by Email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address..."
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
                      className="flex-1"
                    />
                    <Button onClick={handleInviteByEmail} disabled={!inviteEmail.trim() || isInviting}>
                      {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The user must already have a PeerSpark account
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Online Now ({onlineMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {onlineMembers.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  isCreator={member.id === pod.creatorId}
                  isCurrentUser={member.id === user?.$id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Members / Offline */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">
            {onlineMembers.length > 0 ? `Offline (${offlineMembers.length})` : `All Members (${filteredMembers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {searchQuery ? "No members match your search." : "No members yet. Invite some!"}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(onlineMembers.length > 0 ? offlineMembers : filteredMembers).map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  isCreator={member.id === pod.creatorId}
                  isCurrentUser={member.id === user?.$id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MemberCard({ member, isCreator, isCurrentUser }: { member: Member; isCreator: boolean; isCurrentUser: boolean }) {
  const router = useRouter()

  const handleMessage = () => {
    if (isCurrentUser) return
    router.push(`/app/messages/${member.id}`)
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
          <AvatarFallback>{(member.name || "M").slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{member.name}</p>
          {isCreator && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              <Crown className="w-3 h-3 mr-0.5" /> Creator
            </Badge>
          )}
          {isCurrentUser && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">You</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {member.streak !== undefined && member.streak > 0 && (
            <span>🔥 {member.streak} day streak</span>
          )}
          {member.points !== undefined && member.points > 0 && (
            <span>⭐ {member.points} pts</span>
          )}
        </div>
        {member.bio && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{member.bio}</p>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleMessage} disabled={isCurrentUser}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
