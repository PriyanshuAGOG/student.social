import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Rules for responsible use of Student.social.",
}

export default function TermsPage() {
  return <PublicPage slug="terms" />
}

