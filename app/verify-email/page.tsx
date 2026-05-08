"use client"

import React, { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/appwrite"
import { useAuth } from "@/lib/auth-context"

type VerifyState = "idle" | "verifying" | "verified" | "error"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { hasActiveSession, isEmailVerified, refreshUser, logout } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [verifyState, setVerifyState] = useState<VerifyState>("idle")
  const [message, setMessage] = useState("")

  const userId = searchParams?.get("userId") || ""
  const secret = searchParams?.get("secret") || ""
  const sent = searchParams?.get("sent") === "1"
  const required = searchParams?.get("required") === "1"

  const heading = useMemo(() => {
    if (verifyState === "verified") return "Email verified"
    if (verifyState === "verifying") return "Verifying your email"
    return "Verify your email"
  }, [verifyState])

  useEffect(() => {
    if (isEmailVerified) {
      router.replace("/app/feed")
    }
  }, [isEmailVerified, router])

  useEffect(() => {
    const confirmVerification = async () => {
      if (!userId || !secret || verifyState !== "idle") return

      setVerifyState("verifying")
      try {
        await authService.confirmEmailVerification(userId, secret)
        setVerifyState("verified")
        setMessage("Your email has been verified. Please sign in to continue to PeerSpark.")
        toast({ title: "Email verified", description: "You can now sign in securely." })
        try {
          await refreshUser()
        } catch {
          // Verification does not require an active session; sign-in remains the safe fallback.
        }
      } catch (error: any) {
        setVerifyState("error")
        setMessage(error?.message || "This verification link is invalid or expired. Please request a new one.")
        toast({
          title: "Verification failed",
          description: error?.message || "Please request a new verification email.",
          variant: "destructive",
        })
      }
    }

    confirmVerification()
  }, [userId, secret, verifyState, refreshUser, toast])

  const handleResend = async () => {
    setIsSending(true)
    try {
      if (!hasActiveSession) {
        toast({
          title: "Sign in required",
          description: "Enter your email and password first so we can send a new verification link.",
          variant: "destructive",
        })
        router.push("/login?verify=required")
        return
      }

      await authService.resendVerification()
      toast({ title: "Verification sent", description: "A new verification email was sent." })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to resend verification", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const handleUseDifferentAccount = async () => {
    try {
      await logout()
    } finally {
      router.replace("/login")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-lg sm:rounded-2xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {verifyState === "verified" ? <CheckCircle2 className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
            </div>
            <CardTitle className="text-2xl font-bold">{heading}</CardTitle>
            <CardDescription>Email verification is required before you can use the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {required && verifyState !== "verified" && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Verification required</AlertTitle>
                <AlertDescription>
                  Your account exists, but app access is locked until your email address is verified.
                </AlertDescription>
              </Alert>
            )}

            {sent && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Check your inbox</AlertTitle>
                <AlertDescription>
                  We sent a verification link. Open it in this browser, then sign in after verification succeeds.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm leading-6 text-muted-foreground">
              {message ||
                "For your security, PeerSpark requires a verified email before loading feeds, pods, messages, or profile data. If you do not see the email, check spam or request a new link."}
            </p>

            {verifyState === "verifying" && (
              <div className="flex items-center justify-center py-4">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {verifyState === "verified" ? (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/login">Go to sign in</Link>
              </Button>
            ) : (
              <>
                <Button onClick={handleResend} disabled={isSending || verifyState === "verifying"} className="w-full sm:w-auto">
                  {isSending ? "Sending..." : "Resend verification"}
                </Button>
                <Button variant="outline" onClick={handleUseDifferentAccount} className="w-full sm:w-auto">
                  Use another account
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
