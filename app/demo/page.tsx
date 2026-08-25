import type { Metadata } from "next"
import { PublicPage } from "@/components/public/PublicPages"

export const metadata: Metadata = {
  title: "Product demo",
  description: "See Student.social in action.",
}

export default function DemoPage() {
  return <PublicPage slug="demo" />
}

