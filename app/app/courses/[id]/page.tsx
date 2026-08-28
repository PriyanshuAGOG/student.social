import { LearningTrackPage } from "@/components/pods3/LearningTrackHub"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LearningTrackPage courseId={id} />
}
