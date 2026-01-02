"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search } from 'lucide-react'
import { useRouter } from "next/navigation"
import { settingsSections, type SettingSection, type SettingItem } from "./sections"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [settings, setSettings] = useState<Record<string, any>>({})

  const filteredSections = settingsSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.items.some(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleSettingChange = (sectionId: string, itemId: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [`${sectionId}.${itemId}`]: value
    }))
    
    toast({
      title: "Setting updated",
      description: "Your preference has been saved.",
    })
  }

  const renderSettingItem = (sectionId: string, item: SettingItem) => {
    const settingKey = `${sectionId}.${item.id}`
    const currentValue = settings[settingKey] ?? item.value

    switch (item.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={item.id}>{item.title}</Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={item.id}
              checked={currentValue}
              onCheckedChange={(checked) => handleSettingChange(sectionId, item.id, checked)}
            />
          </div>
        )

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <Select
              value={currentValue}
              onValueChange={(value) => handleSettingChange(sectionId, item.id, value)}
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

      case 'input':
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <Input
              id={item.id}
              value={currentValue}
              onChange={(e) => handleSettingChange(sectionId, item.id, e.target.value)}
              placeholder={item.description}
            />
          </div>
        )

      case 'range':
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>{item.title}</Label>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="px-2">
              <Slider
                value={[currentValue]}
                onValueChange={(value) => handleSettingChange(sectionId, item.id, value[0])}
                min={item.min}
                max={item.max}
                step={item.step}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{item.min}</span>
                <span>{currentValue}</span>
                <span>{item.max}</span>
              </div>
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{item.title}</Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Button
              variant={item.destructive ? "destructive" : "outline"}
              onClick={item.action}
            >
              {item.title}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block border-b bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and application settings</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="hidden md:flex w-80 border-r bg-card flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-colors ${
                      selectedSection === section.id ? "bg-muted" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{section.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{section.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {/* Mobile Search */}
            <div className="md:hidden mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Settings Content */}
            {selectedSection ? (
              // Desktop: Show selected section
              (() => {
                const section = settingsSections.find(s => s.id === selectedSection)
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
              // Mobile: Show all sections, Desktop: Show overview
              <div className="space-y-6">
                {filteredSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <Card key={section.id}>
                      <CardHeader 
                        className="cursor-pointer md:cursor-default"
                        onClick={() => window.innerWidth < 768 ? null : setSelectedSection(section.id)}
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
                      
                      {/* Mobile: Show all items, Desktop: Hide items in overview */}
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

                {/* Desktop: Show instruction */}
                <div className="hidden md:block text-center py-12">
                  <p className="text-muted-foreground">Select a category from the sidebar to view and modify settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
