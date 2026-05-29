'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  BookOpen,
  Bug,
  CheckCircle2,
  Database,
  FileWarning,
  Flag,
  FolderLock,
  Gauge,
  Lock,
  MessageSquareWarning,
  RefreshCw,
  Search,
  Server,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AdminBroadcast } from '@/components/notifications/AdminBroadcast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type ApiState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

type Overview = {
  admin: { email: string; role: string; permissions: string[] }
  health: Record<string, string>
  metrics: Record<string, number>
  modules: Array<{ id: string; label: string; value: number; status: string }>
  recentAudit: any[]
}

const nav = [
  { id: 'command', label: 'Command', icon: Gauge },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileWarning },
  { id: 'feed', label: 'Feed', icon: Activity },
  { id: 'pods', label: 'Pods', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageSquareWarning },
  { id: 'vault', label: 'Vault', icon: FolderLock },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'notifications', label: 'Notify', icon: BellRing },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'errors', label: 'Errors', icon: Bug },
  { id: 'system', label: 'System', icon: Server },
  { id: 'security', label: 'Security', icon: Lock },
]

const moduleEndpoints: Record<string, string> = {
  users: '/api/admin/users',
  reports: '/api/admin/reports',
  feed: '/api/admin/feed/posts',
  pods: '/api/admin/pods',
  chat: '/api/admin/chat/reports',
  vault: '/api/admin/vault/resources',
  courses: '/api/admin/courses',
  errors: '/api/admin/errors',
  analytics: '/api/admin/analytics',
  system: '/api/admin/system',
  audit: '/api/admin/audit-logs',
  flags: '/api/admin/feature-flags',
}

async function fetchAdmin<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error?.message || data?.error || `Request failed: ${response.status}`)
  }
  return data.data as T
}

function StatusBadge({ status }: { status?: string }) {
  const variant = status === 'attention' || status === 'open' ? 'destructive' : status === 'privacy-safe' ? 'outline' : 'secondary'
  return <Badge variant={variant as any}>{status || 'ready'}</Badge>
}

function EmptyRow({ label }: { label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

function DataTable({
  rows,
  columns,
  empty,
}: {
  rows: any[]
  columns: Array<{ key: string; label: string; render?: (row: any) => React.ReactNode }>
  empty: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow label={empty} />
        ) : (
          rows.map((row, index) => (
            <TableRow key={row.$id || row.id || `${row.key || row.email}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column.key} className="max-w-[280px] truncate">
                  {column.render ? column.render(row) : row[column.key] || '-'}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function ActionPanel({
  label,
  endpoint,
  targetId,
  targetType,
  actions,
  onDone,
}: {
  label: string
  endpoint: string
  targetId?: string
  targetType: string
  actions: string[]
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState('')

  const submit = async (action: string) => {
    if (!targetId) {
      toast.error(`Select a ${targetType} first`)
      return
    }
    if (reason.trim().length < 4) {
      toast.error('A clear reason is required for audited admin actions')
      return
    }

    setBusy(action)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetId, targetType, reason }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.success === false) throw new Error(data?.error?.message || 'Action failed')
      toast.success(`${label} action recorded`)
      setReason('')
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div>
        <Label htmlFor={`${targetType}-reason`}>Audit reason</Label>
        <Textarea
          id={`${targetType}-reason`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required for every admin mutation"
          className="mt-2 min-h-20"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action} size="sm" variant="outline" disabled={busy === action} onClick={() => submit(action)}>
            {busy === action ? 'Working...' : action}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function AdminCommandCenter({ adminEmail }: { adminEmail?: string }) {
  const [activeTab, setActiveTab] = useState('command')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, any>>({})
  const [overview, setOverview] = useState<ApiState<Overview>>({ data: null, loading: true, error: null })
  const [datasets, setDatasets] = useState<Record<string, ApiState<any>>>({})

  const loadOverview = useCallback(async () => {
    setOverview((current) => ({ ...current, loading: true, error: null }))
    try {
      setOverview({ data: await fetchAdmin<Overview>('/api/admin/overview'), loading: false, error: null })
    } catch (error) {
      setOverview({ data: null, loading: false, error: error instanceof Error ? error.message : 'Failed to load overview' })
    }
  }, [])

  const loadDataset = useCallback(async (key: string) => {
    const endpoint = moduleEndpoints[key]
    if (!endpoint) return
    setDatasets((current) => ({ ...current, [key]: { data: current[key]?.data || null, loading: true, error: null } }))
    try {
      const suffix = key === 'users' && query ? `?q=${encodeURIComponent(query)}` : ''
      const data = await fetchAdmin<any>(`${endpoint}${suffix}`)
      setDatasets((current) => ({ ...current, [key]: { data, loading: false, error: null } }))
    } catch (error) {
      setDatasets((current) => ({
        ...current,
        [key]: { data: null, loading: false, error: error instanceof Error ? error.message : 'Failed to load data' },
      }))
    }
  }, [query])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (activeTab !== 'command' && activeTab !== 'notifications' && activeTab !== 'security') {
      loadDataset(activeTab)
    }
    if (activeTab === 'system') {
      loadDataset('flags')
    }
    if (activeTab === 'security') {
      loadDataset('audit')
    }
  }, [activeTab, loadDataset])

  const analyticsRows = useMemo(() => {
    const data = datasets.analytics?.data
    return [...(data?.growth || []), ...(data?.engagement || []), ...(data?.reliability || [])]
  }, [datasets.analytics?.data])

  const refreshActive = () => {
    loadOverview()
    if (activeTab !== 'command') loadDataset(activeTab)
  }

  return (
    <div className="min-h-dvh bg-muted/20">
      <div className="border-b bg-background">
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Command Center
                </Badge>
                <StatusBadge status={overview.data?.health?.privacyMode || 'privacy-safe'} />
                <Badge variant="secondary">{overview.data?.admin?.role || 'checking'}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Platform operations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Full-app control, safety queues, observability, and audit-backed actions for {overview.data?.admin?.email || adminEmail}.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadDataset('users')
                  }}
                  placeholder="Search users by email"
                  className="w-full pl-8 sm:w-72"
                />
              </div>
              <Button variant="outline" onClick={refreshActive}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          {overview.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {overview.error}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr]">
        <aside className="border-b bg-background lg:min-h-[calc(100dvh-129px)] lg:border-b-0 lg:border-r">
          <nav className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-4 lg:grid-cols-1">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-10 items-center gap-2 rounded-md px-3 text-left text-sm transition ${
                    activeTab === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 p-4 lg:p-6">
          {activeTab === 'command' && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(overview.data?.modules || []).map((module) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm font-medium">
                        {module.label}
                        <StatusBadge status={module.status} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{module.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Card>
                  <CardHeader>
                    <CardTitle>System posture</CardTitle>
                    <CardDescription>Readiness signals collected from Appwrite-backed modules.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(overview.data?.health || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge variant="secondary">{value}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent audit</CardTitle>
                    <CardDescription>Newest admin actions and fallback audit events.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(overview.data?.recentAudit || []).length === 0 && <p className="text-sm text-muted-foreground">No audit entries yet.</p>}
                      {(overview.data?.recentAudit || []).map((entry: any) => (
                        <div key={entry.$id} className="rounded-md border p-3 text-sm">
                          <div className="font-medium">{entry.action || 'admin.action'}</div>
                          <div className="text-xs text-muted-foreground">{entry.createdAt || entry.$createdAt}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>User operations</CardTitle>
                <CardDescription>Search users, inspect safe identity metadata, and record audited account actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.users?.data?.documents || []}
                  empty={datasets.users?.loading ? 'Loading users...' : 'No users found.'}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'status', label: 'Status' },
                    { key: 'emailVerification', label: 'Verified', render: (row) => (row.emailVerification ? 'yes' : 'no') },
                    {
                      key: 'actions',
                      label: 'Select',
                      render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, users: row })}>Select</Button>,
                    },
                  ]}
                />
                <ActionPanel
                  label="User"
                  endpoint={`/api/admin/users/${selected.users?.id || selected.users?.$id || 'unknown'}/actions`}
                  targetId={selected.users?.id || selected.users?.$id}
                  targetType="user"
                  actions={['suspend', 'force_logout', 'resend_verification', 'mark_reviewed']}
                  onDone={() => loadDataset('users')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle>Trust and safety reports</CardTitle>
                <CardDescription>Review user-submitted reports across feed, profiles, chat, resources, and pods.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.reports?.data?.documents || []}
                  empty={datasets.reports?.loading ? 'Loading reports...' : 'No open reports.'}
                  columns={[
                    { key: 'contentType', label: 'Type' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'priority', label: 'Priority', render: (row) => <StatusBadge status={row.priority} /> },
                    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, reports: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Report"
                  endpoint={`/api/admin/reports/${selected.reports?.$id || 'unknown'}/actions`}
                  targetId={selected.reports?.contentId || selected.reports?.$id}
                  targetType={selected.reports?.contentType || 'report'}
                  actions={['resolve_no_violation', 'hide_content', 'escalate_safety', 'close_duplicate']}
                  onDone={() => loadDataset('reports')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'feed' && (
            <Card>
              <CardHeader>
                <CardTitle>Feed moderation</CardTitle>
                <CardDescription>Inspect posts, engagement counts, visibility, and moderation status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.feed?.data?.documents || []}
                  empty={datasets.feed?.loading ? 'Loading posts...' : 'No posts found.'}
                  columns={[
                    { key: 'authorName', label: 'Author' },
                    { key: 'content', label: 'Content' },
                    { key: 'visibility', label: 'Visibility' },
                    { key: 'likes', label: 'Likes' },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, feed: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Post"
                  endpoint={`/api/admin/feed/posts/${selected.feed?.$id || 'unknown'}/actions`}
                  targetId={selected.feed?.$id}
                  targetType="post"
                  actions={['hide', 'restore', 'lock_comments', 'mark_reviewed']}
                  onDone={() => loadDataset('feed')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'pods' && (
            <Card>
              <CardHeader>
                <CardTitle>Pods command</CardTitle>
                <CardDescription>Manage pod health, membership risk, visibility, and closure state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.pods?.data?.documents || []}
                  empty={datasets.pods?.loading ? 'Loading pods...' : 'No pods found.'}
                  columns={[
                    { key: 'name', label: 'Pod' },
                    { key: 'subject', label: 'Subject' },
                    { key: 'memberCount', label: 'Members' },
                    { key: 'healthScore', label: 'Health' },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, pods: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Pod"
                  endpoint={`/api/admin/pods/${selected.pods?.$id || 'unknown'}/actions`}
                  targetId={selected.pods?.$id}
                  targetType="pod"
                  actions={['close', 'restore', 'mark_reviewed']}
                  onDone={() => loadDataset('pods')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'chat' && (
            <Card>
              <CardHeader>
                <CardTitle>Chat safety</CardTitle>
                <CardDescription>Privacy-safe reported message review. Private content is not browsable without report context.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.chat?.data?.documents || []}
                  empty={datasets.chat?.loading ? 'Loading chat reports...' : 'No chat safety reports.'}
                  columns={[
                    { key: 'contentId', label: 'Message' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'privacyMode', label: 'Privacy' },
                    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, chat: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Chat"
                  endpoint={`/api/admin/chat/reports/${selected.chat?.$id || 'unknown'}/actions`}
                  targetId={selected.chat?.contentId || selected.chat?.$id}
                  targetType="message_report"
                  actions={['freeze_room', 'remove_participant', 'mark_resolved']}
                  onDone={() => loadDataset('chat')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'vault' && (
            <Card>
              <CardHeader>
                <CardTitle>Vault and resources</CardTitle>
                <CardDescription>Moderate uploads, downloads, approval state, and storage risk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataTable
                  rows={datasets.vault?.data?.documents || []}
                  empty={datasets.vault?.loading ? 'Loading resources...' : 'No resources found.'}
                  columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'fileType', label: 'Type' },
                    { key: 'fileSize', label: 'Bytes' },
                    { key: 'downloads', label: 'Downloads' },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, vault: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Resource"
                  endpoint={`/api/admin/vault/resources/${selected.vault?.$id || 'unknown'}/actions`}
                  targetId={selected.vault?.$id}
                  targetType="resource"
                  actions={['hide', 'quarantine', 'restore']}
                  onDone={() => loadDataset('vault')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'courses' && (
            <Card>
              <CardHeader>
                <CardTitle>Courses and learning</CardTitle>
                <CardDescription>Course catalog, pod course assignment state, generated course queues, and chapter coverage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{datasets.courses?.data?.total || 0}</div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{datasets.courses?.data?.podCourses?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Pod course links</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-2xl font-semibold">{datasets.courses?.data?.chapterCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Tracked chapters</div>
                  </div>
                </div>
                <DataTable
                  rows={datasets.courses?.data?.documents || []}
                  empty={datasets.courses?.loading ? 'Loading courses...' : 'No courses found.'}
                  columns={[
                    { key: 'title', label: 'Course' },
                    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                    { key: 'createdBy', label: 'Created by' },
                    { key: '$createdAt', label: 'Created' },
                    { key: 'actions', label: 'Select', render: (row) => <Button size="sm" variant="outline" onClick={() => setSelected({ ...selected, courses: row })}>Select</Button> },
                  ]}
                />
                <ActionPanel
                  label="Course"
                  endpoint={`/api/admin/courses/${selected.courses?.$id || 'unknown'}/actions`}
                  targetId={selected.courses?.$id}
                  targetType="course"
                  actions={['retry_generation', 'mark_reviewed', 'archive']}
                  onDone={() => loadDataset('courses')}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && <AdminBroadcast />}

          {activeTab === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Growth, engagement, safety, and reliability rollups.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'errors' && (
            <Card>
              <CardHeader>
                <CardTitle>Error and bug center</CardTitle>
                <CardDescription>Client runtime failures, API errors, fingerprints, owners, and lifecycle state.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  rows={datasets.errors?.data?.documents || []}
                  empty={datasets.errors?.loading ? 'Loading errors...' : 'No open errors.'}
                  columns={[
                    { key: 'source', label: 'Source' },
                    { key: 'route', label: 'Route' },
                    { key: 'message', label: 'Message' },
                    { key: 'lastSeenAt', label: 'Last seen' },
                    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System readiness
                  </CardTitle>
                  <CardDescription>Collections, storage, feature flags, and operational controls.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(datasets.system?.data?.checks || []).map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">{item.name}</span>
                      {item.status === 'ready' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Feature flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable
                    rows={datasets.flags?.data?.documents || []}
                    empty={datasets.flags?.loading ? 'Loading flags...' : 'No feature flags configured.'}
                    columns={[
                      { key: 'key', label: 'Key' },
                      { key: 'enabled', label: 'Enabled', render: (row) => (row.enabled ? 'yes' : 'no') },
                      { key: 'rollout', label: 'Rollout' },
                      { key: 'updatedAt', label: 'Updated' },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security and audit</CardTitle>
                <CardDescription>Every admin mutation is reasoned, correlated, and logged.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium"><Shield className="h-4 w-4" /> RBAC</div>
                    <p className="mt-1 text-sm text-muted-foreground">Multi-role permissions enforced server-side.</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4" /> Privacy safe</div>
                    <p className="mt-1 text-sm text-muted-foreground">Chat content access requires report context and reason.</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4" /> No spoof headers</div>
                    <p className="mt-1 text-sm text-muted-foreground">Admin APIs require verified session cookies.</p>
                  </div>
                </div>
                <Separator />
                <DataTable
                  rows={datasets.audit?.data?.documents || []}
                  empty={datasets.audit?.loading ? 'Loading audit logs...' : 'No audit logs yet.'}
                  columns={[
                    { key: 'actorEmail', label: 'Actor' },
                    { key: 'action', label: 'Action' },
                    { key: 'targetType', label: 'Target' },
                    { key: 'reason', label: 'Reason' },
                    { key: 'createdAt', label: 'Time' },
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
