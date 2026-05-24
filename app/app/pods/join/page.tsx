import { Hash, Sparkles, UsersRound } from "lucide-react"

import { IconTile, PeerSparkPage, SectionTitle, Surface } from "@/components/peerspark/primitives"

export default function JoinPodPage() {
  return (
    <PeerSparkPage eyebrow="Join pod" title="Enter a learning community in seconds." description="Use an invite code or let PeerSpark AI recommend pods based on your goals, subjects, schedule, and energy." actions={[{ label: "Discover pods", href: "/app/pods", icon: Sparkles }]}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Surface><SectionTitle eyebrow="Invite" title="Have a code?" /><div className="rounded-[26px] border border-black/[0.06] bg-[#FCFCFD] p-4"><div className="flex items-center gap-3"><Hash className="h-5 w-5 text-[#A1A1AA]" /><span className="text-sm font-semibold text-[#A1A1AA]">PEER-SPARK-2026</span></div></div><button className="mt-4 w-full rounded-[20px] bg-[#7C4DFF] px-4 py-3 font-black text-white shadow-[0_14px_34px_rgba(124,77,255,0.18)]">Join Pod</button></Surface>
        <Surface><SectionTitle eyebrow="AI match" title="Recommended fit" /><div className="flex gap-4 rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5"><IconTile icon={UsersRound} /><div><p className="font-black text-[#111111]">AI Explorers</p><p className="mt-1 text-sm font-semibold text-[#6E6E73]">Best match for your current AI and product design goals.</p></div></div></Surface>
      </div>
    </PeerSparkPage>
  )
}
