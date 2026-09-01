import { redirect } from 'next/navigation'

export default function RetiredAnalyticsPage() {
  redirect('/app/profile?tab=progress')
}
