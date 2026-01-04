"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Github, Mail } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { authService } from "@/lib/appwrite"

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { refreshUser, isAuthenticated, loading: authLoading, checkSession, hasActiveSession, sessionChecked } = useAuth()

  // Check for existing session and redirect if authenticated
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsCheckingSession(true)
        
        // Wait for auth to finish loading
        if (authLoading) return
        
        // If already authenticated, redirect to feed
        if (isAuthenticated && hasActiveSession) {
          toast({
            title: "Welcome back!",
            description: "You already have an active session.",
          })
          router.replace("/app/feed")
          return
        }
        
        // Double-check session if not yet checked
        if (!sessionChecked) {
          const hasSession = await checkSession()
          if (hasSession) {
            toast({
              title: "Session restored",
              description: "Redirecting to your feed...",
            })
            router.replace("/app/feed")
            return
          }
        }
      } catch (err) {
        // No active session, stay on login page
        console.log('No active session found')
      } finally {
        setIsCheckingSession(false)
      }
    }
    
    checkExistingSession()
  }, [isAuthenticated, authLoading, hasActiveSession, sessionChecked, checkSession, router, toast])

  useEffect(() => {
    try {
      if (searchParams?.get("verify") === "sent") {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email and verify your account before signing in.",
        })
      }
      if (searchParams?.get("session") === "expired") {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
        })
      }
    } catch (err) {
      // ignore
    }
  }, [searchParams, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // First check if there's already an active session
      const hasExistingSession = await checkSession()
      if (hasExistingSession) {
        toast({
          title: "Already logged in",
          description: "You already have an active session. Redirecting...",
        })
        router.replace("/app/feed")
        return
      }

      // Use real Appwrite authentication
      const session = await authService.login(email, password)
      // Refresh auth context with the new user
      await refreshUser()
      
      // Check if user has completed onboarding by checking profile
      try {
        const { profileService } = await import('@/lib/appwrite')
        const profile = await profileService.getProfile(session.userId)
        // If profile has identity set, onboarding is complete
        if (profile && profile.identity) {
          toast({
            title: "Welcome back!",
            description: "You've been successfully logged in.",
          })
          router.replace("/app/feed")
          return
        }
      } catch (e) {
        // No profile found, needs onboarding
      }
      
      toast({
        title: "Welcome!",
        description: "Let's complete your profile setup.",
      })
      
      // Redirect to onboarding for new users
      router.replace("/onboarding")
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = error?.message || error?.toString() || "Login failed. Please check your credentials."
      
      // Handle specific error cases with user-friendly messages
      if (errorMessage.includes('Creation of a session is prohibited') || errorMessage.includes('session is active')) {
        // There's already an active session - redirect instead of showing error
        toast({
          title: "Session Active",
          description: "You already have an active session. Redirecting...",
        })
        await refreshUser()
        router.replace("/app/feed")
        return
      }
      
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('Invalid email or password')) {
        errorMessage = "Invalid email or password. Please try again."
      } else if (errorMessage.includes('Rate limit')) {
        errorMessage = "Too many login attempts. Please wait a moment and try again."
      } else if (errorMessage.includes('User not found')) {
        errorMessage = "No account found with this email. Please register first."
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = (provider: string) => {
    toast({
      title: `${provider} Login`,
      description: `Redirecting to ${provider} authentication...`,
    })
  }

  // Show loading while checking for existing session
  if (isCheckingSession || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3">
            <Image src="/logo.png" alt="PeerSpark" width={40} height={40} className="object-cover" />
          </div>
          <span className="text-2xl font-bold">PeerSpark</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue learning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleOAuthLogin("Google")}>
                <Mail className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuthLogin("GitHub")}>
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
