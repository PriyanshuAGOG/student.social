import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Help center",
  description: "Find guidance for the Student.social platform.",
}

export default function HelpPage() {
  return <PublicPage slug="help" />
}

