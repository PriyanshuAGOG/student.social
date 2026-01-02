"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/appwrite"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await authService.requestPasswordReset(email)

      setSubmitted(true)
      toast({
        title: "Check your email",
        description: "We've sent you a link to reset your password.",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">PeerSpark</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>

          {!submitted ? (
            <>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <Link href="/login" className="w-full">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Check your email for a password reset link. The link will expire in 1 hour.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive an email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setEmail("")
                    }}
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>
                  .
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/login" className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90">Back to login</Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
