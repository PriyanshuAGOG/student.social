import { redirect } from 'next/navigation'

// proxy.ts preserves the legacy user id in /app/chat?user=... before this
// fallback renders. Keep the page synchronous beneath the client auth layout.
export default function LegacyDirectMessagePage() {
  redirect('/app/chat')
}
