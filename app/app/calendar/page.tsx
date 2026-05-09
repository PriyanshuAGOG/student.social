import { CalendarPlus, Clock, Flame, Sparkles, UsersRound, Video } from "lucide-react"

import { IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const sessions = [
  { time: "09:30", title: "Design critique warmup", pod: "Frontend Founders", icon: Video },
  { time: "13:00", title: "Calculus problem room", pod: "Math Circle", icon: UsersRound },
  { time: "20:00", title: "DSA whiteboard sprint", pod: "AI Explorers", icon: Flame },
]

export default function CalendarPage() {
  return (
    <PeerSparkPage eyebrow="Calendar" title="A calm command center for sessions, deadlines, and focus." description="Coordinate pods, reminders, challenge events, AI scheduling, and deep-work blocks without making time feel crowded." actions={[{ label: "Schedule session", href: "/app/calendar?mode=schedule", icon: CalendarPlus }, { label: "AI plan my week", href: "/app/ai?planner=true", icon: Sparkles }]}>
      <div className="grid gap-4 md:grid-cols-3"><Metric label="Today" value="3" detail="sessions" /><Metric label="Focus time" value="4.5h" detail="planned" tone="green" /><Metric label="Deadlines" value="2" detail="soon" tone="amber" /></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface>
          <SectionTitle eyebrow="May 2026" title="Weekly rhythm" action="Today" />
          <div className="grid gap-3 md:grid-cols-7">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => <div key={day} className={`min-h-44 rounded-[26px] border border-black/[0.06] p-3 ${index === 2 ? "bg-[#F6F1FF]" : "bg-[#FCFCFD]"}`}><p className="text-xs font-black uppercase tracking-[0.2em] text-[#A1A1AA]">{day}</p><p className="mt-2 font-mono text-2xl font-black text-[#111111]">{11 + index}</p>{index === 2 || index === 5 ? <Pill active>Focus</Pill> : null}</div>)}</div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Timeline" title="Today" />
          <div className="space-y-3">{sessions.map((session, index) => <div key={session.title} className="flex gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={session.icon} tone={index === 2 ? "amber" : "violet"} /><div><p className="font-mono text-xs font-black text-[#7C4DFF]">{session.time}</p><p className="font-black text-[#111111]">{session.title}</p><p className="text-sm font-semibold text-[#6E6E73]">{session.pod}</p></div></div>)}</div>
          <div className="mt-5 rounded-[24px] bg-[#111111] p-5 text-white"><Clock className="h-5 w-5 text-[#7C4DFF]" /><p className="mt-3 font-black">AI scheduling tip</p><p className="mt-1 text-sm font-semibold text-white/65">Move your quiz review before dinner while recall energy is higher.</p></div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
