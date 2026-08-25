import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Community guidelines",
  description: "Shared expectations for the Student.social community.",
}

export default function CommunityGuidelinesPage() {
  return <PublicPage slug="community-guidelines" />
}

