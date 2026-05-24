import { Bot, CalendarDays, FileText, Mic2, PenTool, Pin, Trophy, UsersRound, Video } from "lucide-react"

import { AvatarStack, IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const features = [
  { label: "Live discussion", icon: UsersRound },
  { label: "Voice rooms", icon: Mic2 },
  { label: "AI assistant", icon: Bot },
  { label: "Shared resources", icon: FileText },
  { label: "Whiteboard", icon: PenTool },
  { label: "Event calendar", icon: CalendarDays },
  { label: "Leaderboard", icon: Trophy },
  { label: "Pinned notes", icon: Pin },
]

export default function PodDetailPage() {
  return (
    <PeerSparkPage eyebrow="Pod workspace" title="Frontend Founders" description="A focused community space with discussion, voice rooms, shared resources, collaborative whiteboards, events, challenges, and AI support." actions={[{ label: "Join live room", href: "/app/pods/live", icon: Video }, { label: "Ask pod AI", href: "/app/ai?pod=true", icon: Bot }]}>
      <div className="grid gap-4 md:grid-cols-4"><Metric label="Members" value="24" detail="online" tone="green" /><Metric label="Resources" value="86" detail="shared" /><Metric label="Events" value="5" detail="week" tone="amber" /><Metric label="Pod XP" value="18k" detail="top 3" /></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface>
          <SectionTitle eyebrow="Command room" title="Everything your pod needs" />
          <div className="grid gap-4 md:grid-cols-2">{features.map((feature, index) => <div key={feature.label} className="flex items-center gap-4 rounded-[26px] border border-black/[0.06] bg-[#FCFCFD] p-5"><IconTile icon={feature.icon} tone={index % 3 === 0 ? "violet" : index % 3 === 1 ? "green" : "amber"} /><span className="font-black text-[#111111]">{feature.label}</span></div>)}</div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Active now" title="Room pulse" />
          <AvatarStack names={["Ananya", "Rohan", "Ishita", "Karan", "Priya"]} />
          <div className="mt-5 space-y-3"><Pill active>12 in voice</Pill><Pill>Whiteboard open</Pill><Pill>AI notes recording</Pill></div>
          <div className="mt-5 rounded-[24px] bg-[#111111] p-5 text-white"><Bot className="h-5 w-5 text-[#7C4DFF]" /><p className="mt-3 font-black">AI pod brief</p><p className="mt-1 text-sm font-semibold text-white/65">Today’s discussion is trending toward CSS architecture and motion systems.</p></div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
