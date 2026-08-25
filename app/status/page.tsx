import type { Metadata } from "next"
import { LiveStatusPage } from "@/components/public/LiveStatusPage"

export const metadata: Metadata = {
  title: "Platform status",
  description: "Live provider checks for the Student.social platform.",
}

export default function StatusPage() {
  return <LiveStatusPage />
}

