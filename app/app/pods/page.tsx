import { Bot, CalendarDays, Mic2, Plus, Radio, Sparkles, UsersRound, Video, Zap } from "lucide-react"

import { AvatarStack, IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const pods = [
  { name: "Frontend Founders", subject: "Web development", members: "24 members", icon: UsersRound, tone: "violet" as const },
  { name: "AI Explorers", subject: "Artificial intelligence", members: "42 members", icon: Bot, tone: "green" as const },
  { name: "Study Squad", subject: "General studies", members: "32 members", icon: Sparkles, tone: "amber" as const },
  { name: "Data Structures Night", subject: "Whiteboard practice", members: "18 members", icon: Zap, tone: "rose" as const },
]

export default function PodsPage() {
  return (
    <PeerSparkPage eyebrow="Pods" title="Learning communities that feel alive." description="Join focused pods, live study rooms, shared resources, discussions, challenges, calendars, whiteboards, and AI copilots built for collaborative momentum." actions={[{ label: "Create pod", href: "/app/pods?create=true", icon: Plus }, { label: "Join with invite", href: "/app/pods/join", icon: UsersRound }]}>
      <div className="grid gap-4 md:grid-cols-3"><Metric label="Joined pods" value="12" detail="active" /><Metric label="Live rooms" value="8" detail="now" tone="green" /><Metric label="Challenges" value="4" detail="open" tone="amber" /></div>
      <Surface className="bg-[linear-gradient(135deg,#7C4DFF_0%,#9C6BFF_55%,#D85CFF_100%)] p-7 text-white">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/70">My Pods</p><h2 className="mt-3 text-3xl font-black tracking-[-0.055em]">Your learning communities</h2><p className="mt-2 max-w-xl font-semibold leading-7 text-white/75">Drop into voice rooms, share notes, work challenges, and let AI keep everyone aligned.</p><div className="mt-5"><AvatarStack names={["Ananya", "Rohan", "Ishita", "Priya"]} /></div></div><div className="hidden h-36 w-36 items-center justify-center rounded-[40px] bg-white/14 backdrop-blur-2xl md:flex"><UsersRound className="h-16 w-16 text-white/55" /></div></div>
      </Surface>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface>
          <SectionTitle eyebrow="Discover" title="Recommended pods" action="AI matched" />
          <div className="grid gap-4 md:grid-cols-2">{pods.map((pod) => <div key={pod.name} className="rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5"><div className="flex items-start justify-between gap-4"><IconTile icon={pod.icon} tone={pod.tone} /><Pill>Join</Pill></div><h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#111111]">{pod.name}</h2><p className="mt-1 text-sm font-semibold text-[#6E6E73]">{pod.subject}</p><div className="mt-4 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[0.18em] text-[#A1A1AA]">{pod.members}</span><span className="flex items-center gap-1 text-xs font-black text-[#22C55E]"><span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Active</span></div></div>)}</div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Live now" title="Study rooms" />
          <div className="space-y-3">{[{ label: "Voice: Algorithms", icon: Mic2 }, { label: "Video: Design Crit", icon: Video }, { label: "Focus: Pomodoro", icon: Radio }, { label: "Calendar: Sprint", icon: CalendarDays }].map((room, index) => <div key={room.label} className="flex items-center gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={room.icon} tone={index % 2 ? "green" : "violet"} /><div><p className="font-black text-[#111111]">{room.label}</p><p className="text-sm font-semibold text-[#6E6E73]">{9 + index * 3} learners inside</p></div></div>)}</div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
