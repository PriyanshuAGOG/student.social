import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Learning journal",
  description: "Notes from building a more human way to learn.",
}

export default function BlogPage() {
  return <PublicPage slug="blog" />
}

