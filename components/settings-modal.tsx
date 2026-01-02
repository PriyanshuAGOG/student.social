"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Lock, Bell, Shield, Eye, EyeOff, Camera, Save, Trash2, Download, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { profileService, authService } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state - initialized with user data
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
  })

  // Load user profile data when modal opens or user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.$id || !open) return
      
      try {
        const profileData = await profileService.getProfile(user.$id)
        setProfile({
          name: user.name || profileData?.name || "",
          email: user.email || "",
          bio: profileData?.bio || "",
          location: profileData?.location || "",
          website: profileData?.website || "",
          avatar: profileData?.avatar || "",
        })
      } catch (error) {
        console.error("Failed to load profile:", error)
        // Fallback to auth user data
        setProfile({
          name: user.name || "",
          email: user.email || "",
          bio: "",
          location: "",
          website: "",
          avatar: "",
        })
      }
    }
    
    loadProfile()
  }, [user, open])

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    showOnlineStatus: true,
    showActivity: true,
  })

  // Notification state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    podUpdates: true,
    directMessages: true,
    mentions: true,
    achievements: true,
    weeklyDigest: false,
    marketingEmails: false,
  })

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    loginAlerts: true,
  })

  const handleSaveProfile = async () => {
    if (!user?.$id) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Update profile in database
      await profileService.updateProfile(user.$id, {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      })

      // Update account name if changed
      if (profile.name !== user.name) {
        try {
          await authService.updateName(profile.name)
          await refreshUser()
        } catch (e) {
          console.warn("Could not update account name:", e)
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile. Please try again.",
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
      // Save privacy settings to profile
      await profileService.updateProfile(user.$id, {
        privacySettings: privacy,
      })

      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
      })
    } catch (error: any) {
      console.error("Privacy update error:", error)
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
      // Save notification settings to profile
      await profileService.updateProfile(user.$id, {
        notificationSettings: notifications,
      })

      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error: any) {
      console.error("Notification update error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update notification settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      })
      return
    }

    if (security.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    if (!security.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await authService.updatePassword(security.newPassword, security.currentPassword)

      setSecurity({
        ...security,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Password change error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to change password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.$id) return

    setIsLoading(true)
    try {
      const avatarUrl = await profileService.uploadAvatar(file, user.$id)
      setProfile(prev => ({ ...prev, avatar: avatarUrl }))
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!user?.$id) return

    try {
      // Gather user data
      const profileData = await profileService.getProfile(user.$id)
      const exportData = {
        user: {
          id: user.$id,
          name: user.name,
          email: user.email,
        },
        profile: profileData,
        exportedAt: new Date().toISOString(),
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `peerspark-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error("Data export error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to export data.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
    )
    
    if (!confirmed) return

    try {
      // Note: Account deletion typically requires additional confirmation
      toast({
        title: "Account Deletion Requested",
        description: "Please contact support to complete account deletion.",
        variant: "destructive",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to process account deletion request.",
        variant: "destructive",
      })
    }
  }

  // Get user initials for avatar fallback
  const userInitials = profile.name
    ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Hidden file input for avatar upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-border pr-4">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent p-0 space-y-1">
                <TabsTrigger
                  value="profile"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Data & Privacy
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content */}
            <div className="flex-1 pl-6 overflow-y-auto">
              <TabsContent value="profile" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>

                  {/* Avatar */}
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button onClick={handleAvatarUpload} variant="outline" size="sm" disabled={isLoading}>
                        <Camera className="w-4 h-4 mr-2" />
                        {isLoading ? "Uploading..." : "Change Avatar"}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Profile Visibility</CardTitle>
                        <CardDescription>Control who can see your profile information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show email address</Label>
                            <p className="text-sm text-muted-foreground">Allow others to see your email</p>
                          </div>
                          <Switch
                            checked={privacy.showEmail}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show location</Label>
                            <p className="text-sm text-muted-foreground">Display your location on profile</p>
                          </div>
                          <Switch
                            checked={privacy.showLocation}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, showLocation: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show online status</Label>
                            <p className="text-sm text-muted-foreground">Let others see when you&apos;re online</p>
                          </div>
                          <Switch
                            checked={privacy.showOnlineStatus}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, showOnlineStatus: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Show activity</Label>
                            <p className="text-sm text-muted-foreground">Display your recent activity</p>
                          </div>
                          <Switch
                            checked={privacy.showActivity}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, showActivity: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Communication</CardTitle>
                        <CardDescription>Manage how others can contact you</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Allow direct messages</Label>
                            <p className="text-sm text-muted-foreground">Let other users send you messages</p>
                          </div>
                          <Switch
                            checked={privacy.allowMessages}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, allowMessages: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={handleSavePrivacy} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Privacy Settings"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">General Notifications</CardTitle>
                        <CardDescription>Choose how you want to receive notifications</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={notifications.emailNotifications}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, emailNotifications: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Push notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                          </div>
                          <Switch
                            checked={notifications.pushNotifications}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, pushNotifications: checked })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Activity Notifications</CardTitle>
                        <CardDescription>Get notified about specific activities</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Pod updates</Label>
                            <p className="text-sm text-muted-foreground">New posts and activities in your pods</p>
                          </div>
                          <Switch
                            checked={notifications.podUpdates}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, podUpdates: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Direct messages</Label>
                            <p className="text-sm text-muted-foreground">When someone sends you a message</p>
                          </div>
                          <Switch
                            checked={notifications.directMessages}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, directMessages: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Mentions</Label>
                            <p className="text-sm text-muted-foreground">When someone mentions you</p>
                          </div>
                          <Switch
                            checked={notifications.mentions}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, mentions: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Achievements</Label>
                            <p className="text-sm text-muted-foreground">When you earn badges or complete goals</p>
                          </div>
                          <Switch
                            checked={notifications.achievements}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, achievements: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Email Preferences</CardTitle>
                        <CardDescription>Control what emails you receive</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Weekly digest</Label>
                            <p className="text-sm text-muted-foreground">Summary of your weekly activity</p>
                          </div>
                          <Switch
                            checked={notifications.weeklyDigest}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Marketing emails</Label>
                            <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
                          </div>
                          <Switch
                            checked={notifications.marketingEmails}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, marketingEmails: checked })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={handleSaveNotifications} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Notification Settings"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Security Settings</h3>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="current-password">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showCurrentPassword ? "text" : "password"}
                              value={security.currentPassword}
                              onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? "text" : "password"}
                              value={security.newPassword}
                              onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={security.confirmPassword}
                            onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                          />
                        </div>

                        <Button onClick={handleChangePassword} disabled={isLoading}>
                          <Lock className="w-4 h-4 mr-2" />
                          {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                        <CardDescription>Add an extra layer of security to your account</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable 2FA</Label>
                            <p className="text-sm text-muted-foreground">
                              {security.twoFactorEnabled
                                ? "Two-factor authentication is enabled"
                                : "Secure your account with 2FA"}
                            </p>
                          </div>
                          <Switch
                            checked={security.twoFactorEnabled}
                            onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Login alerts</Label>
                            <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                          </div>
                          <Switch
                            checked={security.loginAlerts}
                            onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Export Your Data</CardTitle>
                        <CardDescription>
                          Download a copy of your data including posts, messages, and profile information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={handleExportData} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Request Data Export
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                          Irreversible actions that will permanently affect your account
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-destructive">Delete Account</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Once you delete your account, there is no going back. This will permanently delete your
                                profile, posts, and remove you from all pods.
                              </p>
                              <Button onClick={handleDeleteAccount} variant="destructive" size="sm" className="mt-3">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
