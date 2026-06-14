import { PodWorkspacePage } from "@/components/pods2/Pod2App"

export default async function Page({ params }: { params: Promise<{ podId: string }> }) {
  const { podId } = await params
  return <PodWorkspacePage podId={podId} tab="roadmap" />
}
