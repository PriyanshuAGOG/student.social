import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "About",
  description: "Built by a student, for students.",
}

export default function AboutPage() {
  return <PublicPage slug="about" />
}

