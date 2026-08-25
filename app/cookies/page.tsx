import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How Student.social uses cookies and similar technologies.",
}

export default function CookiesPage() {
  return <PublicPage slug="cookies" />
}

