"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/appwrite"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const userId = searchParams?.get("userId") || ""
  const secret = searchParams?.get("secret") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirm) {
      toast({ title: "Error", description: "Please fill both fields", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      await authService.confirmPasswordReset(userId, secret, password, confirm)
      toast({ title: "Password reset", description: "Your password has been updated. You can now sign in." })
      router.push("/login")
    } catch (err: any) {
      toast({ title: "Reset Failed", description: err?.message || "Failed to reset password", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Choose a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {!userId || !secret ? (
              <p className="text-sm text-muted-foreground">No reset token found. Please use the link from your email.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-primary" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update password'}</Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => router.push('/login')}>Back to login</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
