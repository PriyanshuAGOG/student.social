import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Student.social accessibility commitment.",
}

export default function AccessibilityPage() {
  return <PublicPage slug="accessibility" />
}

