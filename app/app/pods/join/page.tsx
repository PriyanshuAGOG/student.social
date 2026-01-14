"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { podService } from "@/lib/appwrite"

export default function JoinPodPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error" | "need-login">("idle")
  const [error, setError] = useState("")
  const [podName, setPodName] = useState("")
  const [podId, setPodId] = useState("")

  const inviteCode = searchParams.get("code") || ""
  const legacyInvite = searchParams.get("invite") || ""
  const legacyPodParam = searchParams.get("pod") || ""

  const legacyPodId = useMemo(() => {
    if (!legacyInvite) return legacyPodParam
    try {
      const decoded = atob(legacyInvite)
      const parts = decoded.split(":")
      if (parts[0] === "pod" && parts[1]) {
        return parts[1]
      }
    } catch {
      // ignore malformed legacy tokens
    }
    return legacyPodParam
  }, [legacyInvite, legacyPodParam])

  useEffect(() => {
    if (!inviteCode && !legacyPodId) {
      setError("No invite link or pod information was provided.")
      setStatus("error")
      return
    }

    if (!user?.$id) {
      setStatus("need-login")
      return
    }

    let cancelled = false
    const join = async () => {
      setStatus("joining")
      try {
        let result: any
        if (inviteCode) {
          result = await podService.joinWithInviteCode(inviteCode, user.$id)
        } else if (legacyPodId) {
          result = await podService.joinPod(legacyPodId, user.$id)
        }

        if (cancelled) return

        const joinedPod = result?.pod
        const resolvedPodId = joinedPod?.$id || joinedPod?.id || legacyPodId
        setPodId(resolvedPodId || "")
        setPodName(joinedPod?.name || "")

        setStatus("success")

        // Navigate to pod after a short delay
        setTimeout(() => {
          if (resolvedPodId) {
            router.push(`/app/pods/${resolvedPodId}`)
          } else {
            router.push("/app/pods")
          }
        }, 900)
      } catch (err: any) {
        if (cancelled) return
        setError(err?.message || "Failed to join pod. Please check the invite and try again.")
        setStatus("error")
      }
    }

    join()
    return () => {
      cancelled = true
    }
  }, [inviteCode, legacyPodId, user?.$id, router])

  const handleGoToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Join Pod</CardTitle>
          <CardDescription>Accept an invite and jump straight into the pod and its chat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "joining" && (
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Joining pod...</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="border-green-200 bg-green-50 text-green-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <AlertDescription>
                  You have joined {podName || "the pod"}! Redirecting you to the pod space now.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {status === "need-login" && (
            <Alert variant="destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-[2px]" />
                <div className="space-y-2">
                  <AlertDescription>
                    You need to sign in to accept pod invitations.
                  </AlertDescription>
                  <Button onClick={handleGoToLogin}>Go to Login</Button>
                </div>
              </div>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 mt-[2px]" />
                <div className="space-y-2">
                  <AlertDescription>{error}</AlertDescription>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/app/pods")}>Browse Pods</Button>
                    <Button onClick={() => router.refresh()}>Try Again</Button>
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {status === "success" && podId && (
            <Button className="w-full" onClick={() => router.push(`/app/pods/${podId}`)}>
              Open Pod
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
