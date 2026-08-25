import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "DMCA policy",
  description: "Copyright reporting and counter-notification process.",
}

export default function DmcaPage() {
  return <PublicPage slug="dmca" />
}

