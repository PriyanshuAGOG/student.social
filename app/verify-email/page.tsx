"use client"

import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/appwrite"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    setIsSending(true)
    try {
      await authService.resendVerification()
      toast({ title: "Verification Sent", description: "A new verification email was sent." })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to resend verification", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
            <CardDescription>Verify your email to activate your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you clicked a verification link, your account should now be verified. Try signing in.
            </p>
            <div className="mt-4">
              <Button onClick={() => router.push('/login')} className="mr-2">Go to Login</Button>
              <Button variant="outline" onClick={handleResend} disabled={isSending}>{isSending ? 'Sending...' : 'Resend verification'}</Button>
            </div>
          </CardContent>
          <CardFooter />
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
