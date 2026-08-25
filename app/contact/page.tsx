import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the student-led team behind Student.social.",
}

export default function ContactPage() {
  return <PublicPage slug="contact" />
}

