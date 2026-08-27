"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { AuthShell } from "@/components/public/AuthShell"
import { authService } from "@/lib/appwrite"
import { getPasswordRequirements } from "@/lib/password-security"
import { signInWithGoogle } from "@/lib/server/oauth"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const router = useRouter()
  const { toast } = useToast()
  const { hasActiveSession, isEmailVerified, loading: authLoading, checkSession, sessionChecked } = useAuth()

  useEffect(() => {
    const checkExistingSession = async () => {
      if (authLoading) return

      if (!sessionChecked) {
        await checkSession()
        return
      }

      if (hasActiveSession && isEmailVerified) {
        toast({
          title: "Welcome back!",
          description: "You already have an active session.",
        })
        router.replace("/app/feed")
        return
      }

      if (hasActiveSession && !isEmailVerified) {
        router.replace("/verify-email?required=1")
      }
    }

    checkExistingSession()
  }, [authLoading, checkSession, hasActiveSession, isEmailVerified, router, sessionChecked, toast])

  // Get real-time password requirements
  const requirements = useMemo(() => getPasswordRequirements(formData.password), [formData.password])
  const allRequirementsMet = Object.values(requirements).every((req) => req.met)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ""

  // Calculate visual strength indicator
  const metRequirements = Object.values(requirements).filter((req) => req.met).length
  const totalRequirements = Object.keys(requirements).length
  const passwordStrength = (metRequirements / totalRequirements) * 100

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allRequirementsMet) {
      toast({
        title: "Password Requirements Not Met",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Use real Appwrite authentication
      await authService.register(formData.email.trim().toLowerCase(), formData.password, formData.name.trim())
      try {
        await authService.logout()
      } catch {
        // No active session is fine
      }

      toast({
        title: "Account Created",
        description: "A verification email has been sent. Please verify your email to continue.",
      })

      router.replace("/verify-email?sent=1")
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMessage = error?.message || error?.toString() || "Registration failed. Please try again."

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
        <Card className="ss-auth-inner border-0 shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>Build a better study rhythm with Student.social</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className={allRequirementsMet && formData.password ? "border-green-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={passwordStrength} className="h-2 flex-1" />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {passwordStrength < 33 ? "Weak" : passwordStrength < 66 ? "Fair" : "Strong"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Password Requirements Checklist */}
                {formData.password && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Password Requirements</p>
                    <div className="space-y-1.5">
                      {/* Min Length */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${requirements.minLength.met ? "bg-green-500" : "bg-slate-300"}`}>
                          {requirements.minLength.met ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs ${requirements.minLength.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {requirements.minLength.label} ({formData.password.length})
                        </span>
                      </div>

                      {/* Uppercase */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${requirements.uppercase.met ? "bg-green-500" : "bg-slate-300"}`}>
                          {requirements.uppercase.met ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs ${requirements.uppercase.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {requirements.uppercase.label}
                        </span>
                      </div>

                      {/* Lowercase */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${requirements.lowercase.met ? "bg-green-500" : "bg-slate-300"}`}>
                          {requirements.lowercase.met ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs ${requirements.lowercase.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {requirements.lowercase.label}
                        </span>
                      </div>

                      {/* Number */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${requirements.number.met ? "bg-green-500" : "bg-slate-300"}`}>
                          {requirements.number.met ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs ${requirements.number.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {requirements.number.label}
                        </span>
                      </div>

                      {/* Special Character */}
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${requirements.special.met ? "bg-green-500" : "bg-slate-300"}`}>
                          {requirements.special.met ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs ${requirements.special.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {requirements.special.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className={passwordsMatch && formData.confirmPassword ? "border-green-500" : formData.confirmPassword && !passwordsMatch ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-10 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {formData.confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {passwordsMatch ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {formData.password && !allRequirementsMet && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">Password must meet all requirements above</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch || !formData.name || !formData.email}
              >
                {isLoading ? "Creating account..." : "Create Account"}
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

            <div className="auth-oauth">
              <form action={signInWithGoogle}>
                <Button variant="outline" type="submit" className="w-full" disabled={isLoading}>
                  <span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-bold text-[#76556d] shadow-sm" aria-hidden>G</span>
                  Continue with Google
                </Button>
              </form>
            </div>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
    </AuthShell>
  )
}
