"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, Camera, Download, Eye, EyeOff, Lock, Save, Shield, Trash2, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { authService, profileService } from "@/lib/appwrite"
import {
  getDefaultPeerSparkSettings,
  normalizePeerSparkSettings,
  PEERSPARK_SETTINGS_PREF_KEY,
  type PeerSparkSettings,
} from "@/lib/settings"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ProfileState = {
  name: string
  email: string
  bio: string
  location: string
  website: string
  avatar: string
}

type SecurityState = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  twoFactorEnabled: boolean
  loginAlerts: boolean
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [prefs, setPrefs] = useState<PeerSparkSettings>(getDefaultPeerSparkSettings())
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
  })
  const [privacy, setPrivacy] = useState<PeerSparkSettings["privacy"]>(getDefaultPeerSparkSettings().privacy)
  const [notifications, setNotifications] = useState<PeerSparkSettings["notifications"]>(getDefaultPeerSparkSettings().notifications)
  const [security, setSecurity] = useState<SecurityState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    loginAlerts: true,
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      if (!open || !user?.$id) return

      try {
        const profileData = await profileService.getProfile(user.$id)
        const normalizedPrefs = normalizePeerSparkSettings((user.prefs as Record<string, any> | undefined)?.[PEERSPARK_SETTINGS_PREF_KEY])

        setPrefs(normalizedPrefs)
        setPrivacy(normalizedPrefs.privacy)
        setNotifications(normalizedPrefs.notifications)
        setSecurity((current) => ({
          ...current,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          twoFactorEnabled: normalizedPrefs.privacy.twoFactorEnabled,
          loginAlerts: normalizedPrefs.privacy.loginAlerts,
        }))
        setProfile({
          name: user.name || profileData?.name || "",
          email: user.email || profileData?.email || "",
          bio: profileData?.bio || "",
          location: profileData?.location || "",
          website: profileData?.website || "",
          avatar: profileData?.avatar || "",
        })
      } catch (error) {
        console.error("Failed to load settings:", error)
        setProfile({
          name: user.name || "",
          email: user.email || "",
          bio: "",
          location: "",
          website: "",
          avatar: "",
        })
        const defaultPrefs = getDefaultPeerSparkSettings()
        setPrefs(defaultPrefs)
        setPrivacy(defaultPrefs.privacy)
        setNotifications(defaultPrefs.notifications)
        setSecurity((current) => ({
          ...current,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          twoFactorEnabled: defaultPrefs.privacy.twoFactorEnabled,
          loginAlerts: defaultPrefs.privacy.loginAlerts,
        }))
      }
    }

    loadSettings()
  }, [open, user])

  const commitPrefs = async (nextPrefs: PeerSparkSettings) => {
    if (!user?.$id) return
    await authService.updatePrefs({ ...(user.prefs || {}), [PEERSPARK_SETTINGS_PREF_KEY]: nextPrefs })
    setPrefs(nextPrefs)
    await refreshUser()
  }

  const handleSaveProfile = async () => {
    if (!user?.$id) return

    setIsLoading(true)
    try {
      await profileService.updateProfile(user.$id, {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      })

      if (profile.name && profile.name !== user.name) {
        await authService.updateName(profile.name)
      }

      await refreshUser()
      toast({ title: "Profile updated", description: "Your profile has been saved." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePrivacy = async () => {
    if (!user?.$id) return

    setIsLoading(true)
    try {
      const nextPrefs = {
        ...prefs,
        privacy: {
          ...prefs.privacy,
          ...privacy,
          twoFactorEnabled: security.twoFactorEnabled,
          loginAlerts: security.loginAlerts,
        },
      }
      await commitPrefs(nextPrefs)
      setPrivacy(nextPrefs.privacy)
      setSecurity((current) => ({ ...current, twoFactorEnabled: nextPrefs.privacy.twoFactorEnabled, loginAlerts: nextPrefs.privacy.loginAlerts }))
      toast({ title: "Privacy updated", description: "Your privacy preferences have been saved." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update privacy settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user?.$id) return

    setIsLoading(true)
    try {
      const nextPrefs = {
        ...prefs,
        notifications: {
          ...prefs.notifications,
          ...notifications,
        },
      }
      await commitPrefs(nextPrefs)
      setNotifications(nextPrefs.notifications)
      toast({ title: "Notifications updated", description: "Your notification preferences have been saved." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update notifications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!security.currentPassword) {
      toast({ title: "Current password required", description: "Enter your current password.", variant: "destructive" })
      return
    }

    if (!security.newPassword || security.newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" })
      return
    }

    if (security.newPassword !== security.confirmPassword) {
      toast({ title: "Passwords do not match", description: "Confirm the new password.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      await authService.updatePassword(security.newPassword, security.currentPassword)
      setSecurity((current) => ({ ...current, currentPassword: "", newPassword: "", confirmPassword: "" }))
      toast({ title: "Password changed", description: "Your password was updated successfully." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to change password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.$id) return

    setIsLoading(true)
    try {
      const avatarUrl = await profileService.uploadAvatar(file, user.$id)
      setProfile((current) => ({ ...current, avatar: avatarUrl }))
      toast({ title: "Avatar updated", description: "Your avatar has been saved." })
      await refreshUser()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload avatar.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      event.target.value = ""
    }
  }

  const handleExportData = async () => {
    if (!user?.$id) return

    try {
      const profileData = await profileService.getProfile(user.$id)
      const exportData = {
        user: { id: user.$id, name: user.name, email: user.email },
        profile: profileData,
        preferences: prefs,
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `student-social-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: "Data exported", description: "Your data download has started." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to export data.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Delete your account permanently? This cannot be undone.")
    if (!confirmed) return

    setIsLoading(true)
    try {
      await authService.deleteAccount()
      onOpenChange(false)
      router.push("/register")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const userInitials = profile.name
    ? profile.name.split(" ").map((part) => part[0]).join("").toUpperCase()
    : user?.name?.split(" ").map((part) => part[0]).join("").toUpperCase() || "U"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account, privacy, notifications, and security.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data">
              <Download className="mr-2 h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
            <TabsContent value="profile" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update the public details shown on your profile.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name || "Profile avatar"} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" onClick={handleAvatarUpload} disabled={isLoading}>
                        <Camera className="mr-2 h-4 w-4" />
                        Change avatar
                      </Button>
                      <p className="text-sm text-muted-foreground">JPG, PNG, or GIF up to 2MB.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full name</Label>
                      <Input
                        id="profile-name"
                        value={profile.name}
                        onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input id="profile-email" value={profile.email} readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea
                      id="profile-bio"
                      value={profile.bio}
                      onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-location">Location</Label>
                      <Input
                        id="profile-location"
                        value={profile.location}
                        onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-website">Website</Label>
                      <Input
                        id="profile-website"
                        value={profile.website}
                        onChange={(event) => setProfile((current) => ({ ...current, website: event.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Controls</CardTitle>
                  <CardDescription>Control what other people can see and how they can reach you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Profile visibility</Label>
                    <Select
                      value={privacy.profileVisibility}
                      onValueChange={(value) => setPrivacy((current) => ({ ...current, profileVisibility: value as PeerSparkSettings["privacy"]["profileVisibility"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {[
                    ["showEmail", "Show email address", "Allow others to see your email"],
                    ["showLocation", "Show location", "Display your location on your profile"],
                    ["allowMessages", "Allow direct messages", "Let other users send you messages"],
                    ["showOnlineStatus", "Show online status", "Display when you are online"],
                    ["showActivityStatus", "Show activity status", "Display recent activity on your profile"],
                    ["dataSharing", "Share anonymous usage data", "Help improve the platform with usage insights"],
                    ["searchVisibility", "Appear in search", "Allow others to find you in search"],
                  ].map(([key, title, description]) => (
                    <div className="flex items-center justify-between rounded-lg border p-4" key={key}>
                      <div className="space-y-0.5">
                        <Label>{title}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={Boolean((privacy as any)[key])}
                        onCheckedChange={(checked) => setPrivacy((current) => ({ ...current, [key]: checked } as PeerSparkSettings["privacy"]))}
                        disabled={isLoading}
                      />
                    </div>
                  ))}

                  <Button onClick={handleSavePrivacy} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save privacy
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose when and how you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Notification frequency</Label>
                    <Select
                      value={notifications.notificationFrequency}
                      onValueChange={(value) => setNotifications((current) => ({ ...current, notificationFrequency: value as PeerSparkSettings["notifications"]["notificationFrequency"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {[
                    ["pushNotifications", "Push notifications", "Receive notifications on your device"],
                    ["emailNotifications", "Email notifications", "Receive notification emails"],
                    ["podNotifications", "Pod activity", "Get updates from your study pods"],
                    ["messageNotifications", "Direct messages", "Be notified when someone messages you"],
                    ["calendarReminders", "Calendar reminders", "Reminders for upcoming events"],
                    ["weeklyDigest", "Weekly digest", "Receive a summary of activity"],
                    ["marketingEmails", "Marketing emails", "Receive product and feature updates"],
                    ["podUpdates", "Pod updates", "Get notified about pod posts and events"],
                    ["directMessages", "Direct message alerts", "Immediate alerts for new direct messages"],
                    ["mentions", "Mentions", "Be notified when you are mentioned"],
                    ["achievements", "Achievements", "Celebrate badges and milestones"],
                  ].map(([key, title, description]) => (
                    <div className="flex items-center justify-between rounded-lg border p-4" key={key}>
                      <div className="space-y-0.5">
                        <Label>{title}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        checked={Boolean((notifications as any)[key])}
                        onCheckedChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked } as PeerSparkSettings["notifications"]))}
                        disabled={isLoading}
                      />
                    </div>
                  ))}

                  <Button onClick={handleSaveNotifications} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save notifications
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Change your password and manage account protection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={security.currentPassword}
                        onChange={(event) => setSecurity((current) => ({ ...current, currentPassword: event.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword((current) => !current)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={security.newPassword}
                        onChange={(event) => setSecurity((current) => ({ ...current, newPassword: event.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword((current) => !current)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={security.confirmPassword}
                      onChange={(event) => setSecurity((current) => ({ ...current, confirmPassword: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Two-factor authentication</Label>
                        <p className="text-sm text-muted-foreground">Store the preference and surface it in the account settings.</p>
                      </div>
                      <Switch
                        checked={security.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecurity((current) => ({ ...current, twoFactorEnabled: checked }))}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label>Login alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified when a new login is detected.</p>
                      </div>
                      <Switch
                        checked={security.loginAlerts}
                        onCheckedChange={(checked) => setSecurity((current) => ({ ...current, loginAlerts: checked }))}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleChangePassword} disabled={isLoading}>
                      <Lock className="mr-2 h-4 w-4" />
                      Change password
                    </Button>
                    <Button onClick={handleSavePrivacy} variant="outline" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      Save security settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="mt-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data export</CardTitle>
                  <CardDescription>Download a copy of your profile and preference data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export data
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger zone</CardTitle>
                  <CardDescription>Irreversible account actions live here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-destructive">Delete account</h4>
                        <p className="text-sm text-muted-foreground">
                          This permanently removes your account and associated data.
                        </p>
                        <Button onClick={handleDeleteAccount} variant="destructive" size="sm" disabled={isLoading}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
