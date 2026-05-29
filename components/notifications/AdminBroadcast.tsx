'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

const targetSegments = [
  { id: 'all_users', label: 'All Users' },
  { id: 'active_users', label: 'Active Users (Last 24h)' },
  { id: 'inactive_3d', label: 'Inactive (3+ days)' },
  { id: 'inactive_7d', label: 'Inactive (7+ days)' },
  { id: 'new_users', label: 'New Users (Last 7 days)' },
  { id: 'students_with_sessions', label: 'Students with Sessions' },
  { id: 'students_without_sessions', label: 'Students without Sessions' },
  { id: 'streak_users', label: 'Streak Users (3+ days)' },
]

const categories = [
  'admin',
  'marketing',
  'reengagement',
  'system',
  'social',
]

export function AdminBroadcast() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'admin',
    targetSegment: 'all_users',
    channels: {
      inApp: true,
      push: false,
      email: false,
    },
    scheduleFor: 'now',
    scheduledTime: new Date().toISOString().slice(0, 16),
  })

  const [preview, setPreview] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChannelToggle = (channel: 'inApp' | 'push' | 'email') => {
    setFormData((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: !prev.channels[channel] },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.body.trim()) {
      toast.error('Body is required')
      return
    }

    if (!Object.values(formData.channels).some((v) => v)) {
      toast.error('Select at least one channel')
      return
    }

    setLoading(true)
    try {
      const scheduledFor = formData.scheduleFor === 'now' 
        ? new Date().toISOString() 
        : new Date(formData.scheduledTime).toISOString()

      const response = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          category: formData.category,
          channels: Object.entries(formData.channels)
            .filter(([, enabled]) => enabled)
            .map(([channel]) => channel)
            .join(','),
          targetSegment: formData.targetSegment,
          scheduledFor,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create broadcast')
      }

      toast.success(data?.data?.message || 'Broadcast created successfully')
      setFormData({
        title: '',
        body: '',
        category: 'admin',
        targetSegment: 'all_users',
        channels: { inApp: true, push: false, email: false },
        scheduleFor: 'now',
        scheduledTime: new Date().toISOString().slice(0, 16),
      })
    } catch (error) {
      console.error('Error creating broadcast:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create broadcast')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Admin Broadcast</CardTitle>
          <CardDescription>Send notifications to user segments</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Broadcast title"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{formData.title.length}/100</p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder="Broadcast message"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formData.body.length}/500</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Segment */}
            <div className="space-y-2">
              <Label htmlFor="target">Target Segment</Label>
              <Select value={formData.targetSegment} onValueChange={(v) => handleSelectChange('targetSegment', v)}>
                <SelectTrigger id="target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetSegments.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      {seg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <Label>Channels</Label>
              <div className="space-y-2">
                {[
                  { id: 'inApp', label: 'In-App' },
                  { id: 'push', label: 'Push' },
                  { id: 'email', label: 'Email' },
                ].map((ch) => (
                  <div key={ch.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={ch.id}
                      checked={formData.channels[ch.id as keyof typeof formData.channels]}
                      onCheckedChange={() => handleChannelToggle(ch.id as 'inApp' | 'push' | 'email')}
                    />
                    <Label htmlFor={ch.id} className="cursor-pointer font-normal">
                      {ch.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <Label>Send</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="now"
                    checked={formData.scheduleFor === 'now'}
                    onCheckedChange={() => handleSelectChange('scheduleFor', 'now')}
                  />
                  <Label htmlFor="now" className="cursor-pointer font-normal">
                    Now
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="later"
                    checked={formData.scheduleFor === 'later'}
                    onCheckedChange={() => handleSelectChange('scheduleFor', 'later')}
                  />
                  <Label htmlFor="later" className="cursor-pointer font-normal">
                    Schedule for later
                  </Label>
                </div>

                {formData.scheduleFor === 'later' && (
                  <Input
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                )}
              </div>
            </div>

            {/* Preview */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreview(!preview)}
                className="mb-4"
              >
                {preview ? 'Hide Preview' : 'Show Preview'}
              </Button>

              {preview && (
                <Card className="bg-muted p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{formData.title || 'Title Preview'}</h3>
                    <p className="text-sm">{formData.body || 'Message preview'}</p>
                    <p className="text-xs text-muted-foreground">
                      Category: {formData.category} | Target: {targetSegments.find((s) => s.id === formData.targetSegment)?.label}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Broadcast
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({
                    title: '',
                    body: '',
                    category: 'admin',
                    targetSegment: 'all_users',
                    channels: { inApp: true, push: false, email: false },
                    scheduleFor: 'now',
                    scheduledTime: new Date().toISOString().slice(0, 16),
                  })
                }
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Be thoughtful:</strong> Only send broadcasts when there&apos;s important information to share.
          </p>
          <p>
            <strong>Respect preferences:</strong> User notification settings are still respected for all broadcasts.
          </p>
          <p>
            <strong>Test first:</strong> Send to a small segment before broadcasting to all users.
          </p>
          <p>
            <strong>Avoid spam:</strong> Limit marketing broadcasts to 1-2 per week maximum.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
