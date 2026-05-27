import { redirect } from "next/navigation"

export default function AppSearchRedirectPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q ? `?q=${encodeURIComponent(searchParams.q)}` : ""
  redirect(`/app/explore${q}`)
}
