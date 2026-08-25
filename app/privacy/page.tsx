import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Student.social intends to handle personal information responsibly.",
}

export default function PrivacyPage() {
  return <PublicPage slug="privacy" />
}

