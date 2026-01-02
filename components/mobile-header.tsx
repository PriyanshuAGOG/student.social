"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MessageCircle, User, LogOut, BarChart3, UserIcon } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface MobileHeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showSearch?: boolean
  unreadChats?: number
}

export function MobileHeader({
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  unreadChats = 3,
}: MobileHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const user = {
    name: "Alex Johnson",
    email: "alex@peerspark.com",
    avatar: "/placeholder.svg?height=32&width=32",
  }

  // Only show mobile header on feed/home page
  const shouldShowMobileHeader = pathname === "/app/feed" || pathname === "/app/home" || pathname === "/app"

  const handleProfileClick = () => {
    router.push("/app/profile")
  }

  const handleChatClick = () => {
    router.push("/app/chat")
  }

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    })
    router.push("/")
  }

  if (!shouldShowMobileHeader) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
      <div className="flex items-center justify-between p-3 gap-3">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-10 w-10 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>AJ</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/app/dashboard")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search pods, people, posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 h-10 bg-secondary/50 border-0 focus:bg-background"
            />
          </div>
        )}

        {/* Chat Button */}
        <Button variant="ghost" size="sm" className="relative p-0 h-10 w-10 rounded-full" onClick={handleChatClick}>
          <MessageCircle className="h-5 w-5" />
          {unreadChats > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadChats > 9 ? "9+" : unreadChats}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  )
}
