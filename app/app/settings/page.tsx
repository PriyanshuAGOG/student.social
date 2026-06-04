"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Search } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { settingsSections, type SettingItem } from "./sections"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { authService, profileService } from "@/lib/appwrite"
import {
  buildPeerSparkSettingsFromFlat,
  flattenPeerSparkSettings,
  normalizePeerSparkSettings,
  PEERSPARK_SETTINGS_PREF_KEY,
} from "@/lib/settings"

export default function SettingsPage() {
  const router = useRouter()
  const { user, refreshUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.$id) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await profileService.getProfile(user.$id)
        const persisted = normalizePeerSparkSettings((user.prefs as Record<string, any> | undefined)?.[PEERSPARK_SETTINGS_PREF_KEY])
        const flatSettings = flattenPeerSparkSettings(persisted)
        if (flatSettings["language.timezone"] === "auto" && typeof Intl !== "undefined") {
          flatSettings["language.timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        }
        setSettings({
          ...flatSettings,
          "profile.display-name": user.name || profile?.name || "",
          "profile.bio": profile?.bio || "",
        })

        if (persisted.appearance.theme && persisted.appearance.theme !== theme) {
          setTheme(persisted.appearance.theme)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user, theme, setTheme])

  const filteredSections = useMemo(
    () =>
      settingsSections.filter(
        (section) =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.items.some(
            (item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
      ),
    [searchQuery]
  )

  const persistPrefs = async (nextFlat: Record<string, any>) => {
    if (!user?.$id) return
    const nextPrefsSettings = buildPeerSparkSettingsFromFlat(nextFlat)
    await authService.updatePrefs({
      ...(user.prefs || {}),
      [PEERSPARK_SETTINGS_PREF_KEY]: nextPrefsSettings,
    })
    await refreshUser()
  }

  const handleSettingChange = async (sectionId: string, itemId: string, value: any) => {
    const settingKey = `${sectionId}.${itemId}`
    if (sectionId === "language" && itemId === "timezone" && value === "auto") {
      value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    }
    setSettings((prev) => ({ ...prev, [settingKey]: value }))

    if (sectionId === "appearance" && itemId === "theme") {
      setTheme(value)
    }
    if (sectionId === "appearance" && itemId === "font-size") {
      const fontScale = value === "small" ? "14px" : value === "large" ? "18px" : "16px"
      document.documentElement.style.setProperty("--peerspark-font-size", fontScale)
      document.documentElement.style.fontSize = fontScale
    }

    if (!user?.$id) {
      toast({ title: "Setting updated", description: "Your preference has been saved." })
      return
    }

    setIsSaving(true)
    try {
      if (sectionId === "profile" && itemId === "display-name") {
        await authService.updateName(String(value))
        await profileService.updateProfile(user.$id, { name: String(value) })
        await refreshUser()
      } else if (sectionId === "profile" && itemId === "bio") {
        await profileService.updateProfile(user.$id, { bio: String(value) })
      } else {
        await persistPrefs({ ...settings, [settingKey]: value })
      }

      toast({ title: "Setting updated", description: "Your preference has been saved." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save setting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to logout.", variant: "destructive" })
    }
  }

  const handleExportData = async () => {
    if (!user?.$id) return

    try {
      const profile = await profileService.getProfile(user.$id)
      const exportData = {
        user: { id: user.$id, name: user.name, email: user.email },
        profile,
        settings,
        includedData: ["account metadata", "profile", "settings/preferences"],
        notIncludedYet: ["full post history", "chat transcripts", "pod resources", "billing records"],
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `peerspark-data-export-${new Date().toISOString().split("T")[0]}.json`
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

  const handleAction = async (sectionId: string, itemId: string) => {
    try {
      switch (`${sectionId}.${itemId}`) {
        case "help.help-center":
          router.push("/help")
          return
        case "help.contact-support":
          router.push("/contact")
          return
        case "help.send-feedback":
          window.location.href = "mailto:support@student.social?subject=PeerSpark%20feedback"
          return
        case "help.report-bug":
          router.push("/contact?topic=bugs")
          return
        case "data.clear-cache":
          localStorage.clear()
          sessionStorage.clear()
          toast({ title: "Cache cleared", description: "Temporary data has been removed from this device." })
          return
        case "data.export-data":
        case "account.download-data":
          await handleExportData()
          return
        case "billing.current-plan":
        case "billing.payment-method":
        case "billing.billing-history":
          router.push("/help?topic=billing")
          return
        case "account.change-password": {
          const currentPassword = window.prompt("Enter your current password") || ""
          const newPassword = window.prompt("Enter your new password") || ""
          const confirmPassword = window.prompt("Confirm your new password") || ""
          if (!currentPassword || !newPassword || newPassword !== confirmPassword) return
          await authService.updatePassword(newPassword, currentPassword)
          toast({ title: "Password updated", description: "Your password has been changed successfully." })
          return
        }
        case "account.change-email": {
          const nextEmail = window.prompt("Enter your new email address") || ""
          const currentPassword = window.prompt("Enter your current password") || ""
          if (!nextEmail || !currentPassword) return
          await authService.updateEmail(nextEmail, currentPassword)
          await refreshUser()
          toast({ title: "Email updated", description: "Your email address has been changed." })
          return
        }
        case "account.deactivate-account":
          await handleLogout()
          return
        case "account.delete-account":
          if (!window.confirm("Delete your account permanently? This cannot be undone.")) return
          await authService.deleteAccount()
          router.push("/register")
          return
        case "account.logout":
          await handleLogout()
          return
        default:
          return
      }
    } catch (error: any) {
      toast({ title: "Action failed", description: error?.message || "Unable to complete this action.", variant: "destructive" })
    }
  }

  const renderSettingItem = (sectionId: string, item: SettingItem) => {
    const settingKey = `${sectionId}.${item.id}`
    const currentValue = settings[settingKey] ?? item.value

    if (item.type === "button" && item.id === "logout") {
      return (
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <Button variant={item.destructive ? "destructive" : "outline"} onClick={handleLogout}>
            {item.title}
          </Button>
        </div>
      )
    }

    if (item.type === "toggle") {
      return (
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor={item.id}>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <Switch
            id={item.id}
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => handleSettingChange(sectionId, item.id, checked)}
            disabled={isSaving}
          />
        </div>
      )
    }

    if (item.type === "select") {
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id}>{item.title}</Label>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          {sectionId === "appearance" && (
            <div className="rounded-md border p-3 text-sm" style={{ fontSize: "var(--peerspark-font-size, 16px)" }}>
              Live preview: PeerSpark will apply appearance changes instantly.
            </div>
          )}
          <Select
            value={String(currentValue)}
            onValueChange={(value) => handleSettingChange(sectionId, item.id, value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (item.type === "input") {
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id}>{item.title}</Label>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <Input
            id={item.id}
            value={String(currentValue)}
            onChange={(event) => handleSettingChange(sectionId, item.id, event.target.value)}
            placeholder={item.description}
            disabled={isSaving}
          />
        </div>
      )
    }

    if (item.type === "range") {
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id}>{item.title}</Label>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <Slider
            value={[Number(currentValue) || 0]}
            onValueChange={(value) => handleSettingChange(sectionId, item.id, value[0])}
            min={item.min}
            max={item.max}
            step={item.step}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{item.min}</span>
            <span>{currentValue}</span>
            <span>{item.max}</span>
          </div>
        </div>
      )
    }

    if (item.type === "button") {
      return (
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <Button variant={item.destructive ? "destructive" : "outline"} onClick={() => handleAction(sectionId, item.id)}>
            {item.title}
          </Button>
        </div>
      )
    }

    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 p-4 backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="hidden border-b bg-card p-6 md:block">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences and application settings</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 flex-col overflow-hidden border-r bg-card md:flex">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50 ${
                    selectedSection === section.id ? "bg-muted" : ""
                  }`}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{section.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="mb-6 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {selectedSection ? (
              (() => {
                const section = settingsSections.find((entry) => entry.id === selectedSection)
                if (!section) return null
                const Icon = section.icon

                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                        <p className="text-muted-foreground">{section.description}</p>
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {section.items.map((item, index) => (
                            <div key={item.id}>
                              {renderSettingItem(section.id, item)}
                              {index < section.items.length - 1 && <Separator className="mt-6" />}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })()
            ) : (
              <div className="space-y-6">
                {filteredSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Card key={section.id}>
                      <CardHeader
                        className="cursor-pointer md:cursor-default"
                        onClick={() => {
                          if (window.innerWidth >= 768) setSelectedSection(section.id)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            <CardDescription>{section.description}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="hidden md:inline-flex">
                            {section.items.length} settings
                          </Badge>
                        </div>
                      </CardHeader>

                      <div className="md:hidden">
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {section.items.map((item, index) => (
                              <div key={item.id}>
                                {renderSettingItem(section.id, item)}
                                {index < section.items.length - 1 && <Separator className="mt-4" />}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  )
                })}

                <div className="hidden py-12 text-center md:block">
                  <p className="text-muted-foreground">Select a category from the sidebar to view and modify settings</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
