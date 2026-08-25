"use client"

export const dynamic = "force-dynamic"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LandingPage from "@/components/public/LandingPage"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { loading, hasActiveSession, isEmailVerified, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading || !hasActiveSession) return
    if (isAuthenticated && isEmailVerified) {
      router.replace("/feed")
      return
    }
    if (!isEmailVerified) router.replace("/verify-email?required=1")
  }, [loading, hasActiveSession, isAuthenticated, isEmailVerified, router])

  return <LandingPage />
}

