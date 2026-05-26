import { redirect } from "next/navigation"

export default function ExploreRedirectPage() {
  redirect("/app/pods?tab=discover")
}
