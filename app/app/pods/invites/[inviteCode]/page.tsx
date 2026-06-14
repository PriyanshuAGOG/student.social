import { PodInviteAcceptPage } from "@/components/pods2/Pod2App"

export default async function InvitePage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params
  return <PodInviteAcceptPage inviteCode={inviteCode} />
}
