"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Zap, 
  ArrowLeft, 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Server,
  Database,
  Video,
  MessageSquare,
  Bot,
  Upload,
  Globe,
  Bell,
  Mail,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { useState, useEffect } from "react"

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString())
  }, [])

  const overallStatus = "operational" // operational, degraded, outage

  const services = [
    {
      name: "Web Application",
      description: "Main web platform and dashboard",
      status: "operational",
      icon: Globe,
      uptime: "99.99%",
    },
    {
      name: "API Services",
      description: "REST and GraphQL APIs",
      status: "operational",
      icon: Server,
      uptime: "99.98%",
    },
    {
      name: "Database",
      description: "Primary database cluster",
      status: "operational",
      icon: Database,
      uptime: "99.99%",
    },
    {
      name: "Real-time Chat",
      description: "Messaging and notifications",
      status: "operational",
      icon: MessageSquare,
      uptime: "99.95%",
    },
    {
      name: "Video Calling",
      description: "WebRTC video and audio",
      status: "operational",
      icon: Video,
      uptime: "99.90%",
    },
    {
      name: "AI Assistant",
      description: "AI-powered learning assistant",
      status: "operational",
      icon: Bot,
      uptime: "99.85%",
    },
    {
      name: "File Storage",
      description: "Resource vault and uploads",
      status: "operational",
      icon: Upload,
      uptime: "99.99%",
    },
    {
      name: "Email Services",
      description: "Transactional emails",
      status: "operational",
      icon: Mail,
      uptime: "99.95%",
    },
    {
      name: "Push Notifications",
      description: "Mobile and web push",
      status: "operational",
      icon: Bell,
      uptime: "99.90%",
    },
  ]

  const incidents = [
    {
      id: 1,
      title: "Resolved: Elevated API Latency",
      status: "resolved",
      date: "January 14, 2025",
      updates: [
        { time: "15:45 UTC", message: "The issue has been fully resolved. API response times are back to normal." },
        { time: "15:20 UTC", message: "We've identified the root cause and are implementing a fix. Some users may still experience slower response times." },
        { time: "14:55 UTC", message: "We're investigating reports of increased API latency affecting some users." },
      ],
    },
    {
      id: 2,
      title: "Resolved: Video Call Connection Issues",
      status: "resolved",
      date: "January 10, 2025",
      updates: [
        { time: "09:30 UTC", message: "All video calling services are fully restored. Thank you for your patience." },
        { time: "09:00 UTC", message: "We've deployed a fix and are monitoring the situation." },
        { time: "08:30 UTC", message: "Some users are experiencing difficulty connecting to video calls. We are investigating." },
      ],
    },
    {
      id: 3,
      title: "Resolved: Database Maintenance",
      status: "resolved",
      date: "January 5, 2025",
      updates: [
        { time: "06:00 UTC", message: "Scheduled maintenance completed successfully. All services are operational." },
        { time: "04:00 UTC", message: "Maintenance has begun. Some features may be temporarily unavailable." },
        { time: "03:45 UTC", message: "Reminder: Scheduled database maintenance will begin at 04:00 UTC." },
      ],
    },
  ]

  const scheduledMaintenance = [
    {
      title: "Infrastructure Upgrade",
      date: "January 25, 2025",
      time: "03:00 - 05:00 UTC",
      description: "We will be upgrading our infrastructure to improve performance. Brief interruptions may occur.",
      affectedServices: ["Web Application", "API Services"],
    },
  ]

  const uptimeHistory = [
    { month: "December 2024", uptime: "99.98%" },
    { month: "November 2024", uptime: "99.99%" },
    { month: "October 2024", uptime: "99.97%" },
    { month: "September 2024", uptime: "99.99%" },
    { month: "August 2024", uptime: "99.95%" },
    { month: "July 2024", uptime: "99.99%" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      case "outage":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Operational
          </Badge>
        )
      case "degraded":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        )
      case "outage":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Outage
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">PeerSpark</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`py-12 sm:py-16 ${
        overallStatus === "operational" 
          ? "bg-gradient-to-b from-green-500/10 to-background" 
          : overallStatus === "degraded"
          ? "bg-gradient-to-b from-yellow-500/10 to-background"
          : "bg-gradient-to-b from-red-500/10 to-background"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
            overallStatus === "operational" 
              ? "bg-green-500/20" 
              : overallStatus === "degraded"
              ? "bg-yellow-500/20"
              : "bg-red-500/20"
          }`}>
            {overallStatus === "operational" ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : overallStatus === "degraded" ? (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {overallStatus === "operational" 
              ? "All Systems Operational" 
              : overallStatus === "degraded"
              ? "Some Systems Experiencing Issues"
              : "System Outage Detected"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {overallStatus === "operational" 
              ? "PeerSpark is running smoothly. All services are functioning normally."
              : "We're aware of the issue and working to resolve it as quickly as possible."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
            <Button variant="ghost" size="sm" onClick={() => setLastUpdated(new Date().toLocaleString())}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Current Status */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Current Status
              </h2>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Subscribe to Updates
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0 divide-y">
                {services.map((service) => (
                  <div 
                    key={service.name} 
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <service.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {service.uptime} uptime
                      </span>
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Uptime Chart */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">90-Day Uptime</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-end gap-1 h-16 mb-4">
                  {Array.from({ length: 90 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${
                        Math.random() > 0.02 ? "bg-green-500" : "bg-yellow-500"
                      }`}
                      style={{ height: `${Math.random() * 20 + 80}%` }}
                      title={`Day ${90 - i}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>90 days ago</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-green-500" />
                      <span>Operational</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                      <span>Degraded</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-red-500" />
                      <span>Outage</span>
                    </div>
                  </div>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uptime History */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Historical Uptime</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uptimeHistory.map((month) => (
                <Card key={month.month}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">{month.month}</span>
                    <Badge className="bg-green-500/10 text-green-600">
                      {month.uptime}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Scheduled Maintenance */}
          {scheduledMaintenance.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Maintenance
              </h2>
              <div className="space-y-4">
                {scheduledMaintenance.map((maintenance, index) => (
                  <Card key={index} className="border-blue-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{maintenance.title}</h3>
                            <Badge variant="outline" className="text-blue-600 border-blue-600/30">
                              Scheduled
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {maintenance.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {maintenance.date}, {maintenance.time}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {maintenance.affectedServices.map((service) => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Incidents */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Incidents
            </h2>
            {incidents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Recent Incidents</h3>
                  <p className="text-sm text-muted-foreground">
                    All systems have been running smoothly. Check back later for updates.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base">{incident.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{incident.date}</p>
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 border-l-2 border-muted pl-4">
                        {incident.updates.map((update, index) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-[21px] w-2 h-2 rounded-full bg-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground mb-1">{update.time}</p>
                            <p className="text-sm">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Subscribe CTA */}
          <Card className="border-primary/50">
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Subscribe to receive notifications about service status, scheduled maintenance, and incident updates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Button className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Notifications
                </Button>
                <Button variant="outline" className="flex-1">
                  RSS Feed
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PeerSpark</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/status" className="hover:text-foreground transition-colors font-medium text-foreground">Status</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PeerSpark. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
