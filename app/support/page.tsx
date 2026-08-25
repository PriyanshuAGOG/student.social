import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Support the project",
  description: "Help build a more human study space.",
}

export default function SupportPage() {
  return <PublicPage slug="support" />
}

