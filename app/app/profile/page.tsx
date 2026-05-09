import { Award, Bookmark, Brain, CalendarDays, Edit3, Flame, Settings, Sparkles, UsersRound } from "lucide-react"

import { IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const menu = [
  { label: "My Activity", icon: CalendarDays },
  { label: "Saved Resources", icon: Bookmark },
  { label: "Certifications", icon: Award },
  { label: "Connections", icon: UsersRound },
  { label: "Settings", icon: Settings },
]

export default function ProfilePage() {
  return (
    <PeerSparkPage eyebrow="Profile" title="Your learning identity, made beautifully personal." description="A premium home for your XP, streaks, achievements, saved resources, pod memberships, and AI learning personality." actions={[{ label: "Edit profile", href: "/app/settings", icon: Edit3 }]}>
      <Surface className="overflow-hidden p-0">
        <div className="relative min-h-[360px] bg-[radial-gradient(circle_at_18%_22%,rgba(124,77,255,0.18),transparent_22rem),radial-gradient(circle_at_82%_26%,rgba(127,255,212,0.2),transparent_24rem),linear-gradient(180deg,#fff,#fbfbff)] p-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="relative">
              <span className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-[#EDE7FF] text-5xl font-black text-[#7C4DFF] shadow-[0_28px_70px_rgba(124,77,255,0.16)]">A</span>
              <span className="absolute bottom-4 right-2 h-5 w-5 rounded-full border-4 border-white bg-[#22C55E]" />
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.06em] text-[#111111]">Arjun Malhotra</h2>
            <p className="mt-1 text-sm font-bold text-[#6E6E73]">@arjun.m · Active Learner</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2"><Pill active><Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Strategist</Pill><Pill><Flame className="mr-1.5 h-3.5 w-3.5" /> 14 day streak</Pill><Pill><Brain className="mr-1.5 h-3.5 w-3.5" /> Systems thinker</Pill></div>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Pods" value="12" detail="active" />
        <Metric label="Followers" value="248" detail="+19" tone="green" />
        <Metric label="Following" value="156" detail="peers" />
        <Metric label="XP" value="650" detail="today" tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Surface>
          <SectionTitle eyebrow="Learning graph" title="Growth arc" />
          <div className="grid gap-4 md:grid-cols-6">
            {[30, 42, 48, 64, 72, 86].map((height, index) => <div key={height} className="flex h-56 flex-col justify-end gap-3"><div className="rounded-full bg-[#7C4DFF] shadow-[0_12px_28px_rgba(124,77,255,0.16)]" style={{ height: `${height}%` }} /><p className="text-center text-xs font-black text-[#A1A1AA]">W{index + 1}</p></div>)}
          </div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="AI personality" title="Calm builder" />
          <p className="text-sm font-semibold leading-7 text-[#6E6E73]">You learn best by converting concepts into systems, teaching them to others, and closing loops with visual notes.</p>
          <div className="mt-5 space-y-3">{["Visual synthesis", "Late-night focus", "Pod accountability"].map((item) => <Pill key={item}>{item}</Pill>)}</div>
        </Surface>
      </div>

      <Surface>
        <SectionTitle eyebrow="Profile hub" title="Everything connected" />
        <div className="grid gap-3 md:grid-cols-2">
          {menu.map((item) => <div key={item.label} className="flex items-center gap-4 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={item.icon} /><span className="font-black text-[#111111]">{item.label}</span></div>)}
        </div>
      </Surface>
    </PeerSparkPage>
  )
}
