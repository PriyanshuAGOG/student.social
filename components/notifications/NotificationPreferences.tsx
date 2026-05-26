'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface PreferencesData {
  $id?: string
  inAppEnabled: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
  dailyDigestEnabled: boolean
  weeklyDigestEnabled: boolean
  digestTime: string
  maxPushPerHour: number
  maxPushPerDay: number
  maxEmailsPerDay: number
  maxSmsPerDay: number
  // Category preferences would be added here
  [key: string]: any
}

const categories = [
  { id: 'study', label: 'Study Sessions' },
  { id: 'class', label: 'Class Updates' },
  { id: 'deadline', label: 'Deadlines' },
  { id: 'calendar', label: 'Calendar Events' },
  { id: 'progress', label: 'Progress Updates' },
  { id: 'streak', label: 'Streaks' },
  { id: 'goal', label: 'Goals' },
  { id: 'habit', label: 'Habits' },
  { id: 'social', label: 'Social' },
  { id: 'system', label: 'System' },
  { id: 'security', label: 'Security' },
  { id: 'admin', label: 'Admin' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'reengagement', label: 'Re-engagement' },
  { id: 'digest', label: 'Digests' },
]

const channels = [
  { id: 'Push', label: 'Push' },
  { id: 'Email', label: 'Email' },
  { id: 'Sms', label: 'SMS' },
]

export function NotificationPreferences() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<PreferencesData | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.$id) {
      loadPreferences()
    }
  }, [user?.$id])

  const loadPreferences = async () => {
    if (!user?.$id) return
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'x-user-id': user.$id,
        },
      })
      const data = await response.json()
      if (data.data) {
        setPreferences(data.data)
      } else {
        // Initialize with defaults
        setPreferences({
          inAppEnabled: true,
          pushEnabled: false,
          emailEnabled: true,
          smsEnabled: false,
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          timezone: 'UTC',
          dailyDigestEnabled: true,
          weeklyDigestEnabled: true,
          digestTime: '20:00',
          maxPushPerHour: 3,
          maxPushPerDay: 8,
          maxEmailsPerDay: 2,
          maxSmsPerDay: 1,
        })
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleChannelToggle = (channel: string) => {
    setPreferences((prev) =>
      prev
        ? {
            ...prev,
            [`${channel.toLowerCase()}Enabled`]: !prev[`${channel.toLowerCase()}Enabled`],
          }
        : null
    )
  }

  const handleCategoryChannelToggle = (category: string, channel: string) => {
    const key = `${category}${channel}`
    setPreferences((prev) =>
      prev
        ? {
            ...prev,
            [key]: !prev[key],
          }
        : null
    )
  }

  const handleSave = async () => {
    if (!user?.$id) return
    setSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.$id,
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast.success('Preferences saved successfully')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !preferences) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="channels" className="w-full">
            <TabsList>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="quiet-hours">Quiet Hours</TabsTrigger>
              <TabsTrigger value="digests">Digests</TabsTrigger>
            </TabsList>

            <TabsContent value="channels" className="space-y-4">
              <div className="space-y-4">
                {['In-app', 'Push', 'Email', 'SMS'].map((channel) => (
                  <div key={channel} className="flex items-center justify-between">
                    <Label>{channel}</Label>
                    <Switch
                      checked={preferences[`${channel.toLowerCase()}Enabled`]}
                      onCheckedChange={() => handleChannelToggle(channel)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      {channels.map((ch) => (
                        <th key={ch.id} className="text-center py-2">
                          {ch.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b">
                        <td className="py-2">{cat.label}</td>
                        {channels.map((ch) => (
                          <td key={`${cat.id}-${ch.id}`} className="text-center py-2">
                            <Switch
                              checked={preferences[`${cat.id}${ch.id}`] !== false}
                              onCheckedChange={() => handleCategoryChannelToggle(cat.id, ch.id)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="quiet-hours" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Quiet Hours</Label>
                <Switch
                  checked={preferences.quietHoursEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, quietHoursEnabled: checked } : null
                    )
                  }
                />
              </div>

              {preferences.quietHoursEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) =>
                        setPreferences((prev) =>
                          prev ? { ...prev, quietHoursStart: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) =>
                        setPreferences((prev) =>
                          prev ? { ...prev, quietHoursEnd: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={preferences.timezone}
                      onChange={(e) =>
                        setPreferences((prev) =>
                          prev ? { ...prev, timezone: e.target.value } : null
                        )
                      }
                      placeholder="e.g., UTC, America/New_York"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="digests" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Daily Digest</Label>
                <Switch
                  checked={preferences.dailyDigestEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, dailyDigestEnabled: checked } : null
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Weekly Digest</Label>
                <Switch
                  checked={preferences.weeklyDigestEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) =>
                      prev ? { ...prev, weeklyDigestEnabled: checked } : null
                    )
                  }
                />
              </div>

              {(preferences.dailyDigestEnabled || preferences.weeklyDigestEnabled) && (
                <div className="space-y-2">
                  <Label htmlFor="digest-time">Digest Time</Label>
                  <Input
                    id="digest-time"
                    type="time"
                    value={preferences.digestTime}
                    onChange={(e) =>
                      setPreferences((prev) =>
                        prev ? { ...prev, digestTime: e.target.value } : null
                      )
                    }
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
