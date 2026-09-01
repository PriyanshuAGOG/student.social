import { Suspense } from 'react'
import { ProfileExperience } from '@/components/profile/ProfileExperience'

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <Suspense><ProfileExperience identifier={username} /></Suspense>
}
