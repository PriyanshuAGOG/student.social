import { Crown, Flame, Medal, Sparkles, Trophy, TrendingUp } from "lucide-react"

import { IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const top = [
  { name: "Rohan Mehta", xp: "2,150 XP", rank: "2", tone: "green" as const },
  { name: "Ananya Sharma", xp: "2,450 XP", rank: "1", tone: "amber" as const },
  { name: "Ishita Verma", xp: "1,850 XP", rank: "3", tone: "violet" as const },
]
const rows = ["Karan Singh", "Neha Gupta", "Aditya Raj", "Priya Nair", "Arjun Malhotra"]

export default function LeaderboardPage() {
  return (
    <PeerSparkPage eyebrow="Leaderboard" title="Competition that feels elegant, not exhausting." description="Track XP, streaks, badges, and pod momentum through a premium ranking space designed to motivate without noise." actions={[{ label: "This month", href: "/app/leaderboard?range=month", icon: Trophy }]}>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Your rank" value="#23" detail="up 4" tone="green" />
        <Metric label="Total XP" value="650" detail="today" />
        <Metric label="Best streak" value="14" detail="days" tone="amber" />
      </div>

      <div className="grid items-end gap-5 md:grid-cols-3">
        {top.map((person, index) => (
          <Surface key={person.name} className={index === 1 ? "md:-mt-8 p-7" : "p-6"}>
            <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B] text-sm font-black text-white shadow-[0_12px_28px_rgba(245,158,11,0.2)]">{person.rank}</div>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EFE8FF] text-3xl font-black text-[#7C4DFF] shadow-[0_18px_44px_rgba(124,77,255,0.13)]">{person.name[0]}</span>
                {index === 1 ? <Crown className="absolute -top-4 left-1/2 h-7 w-7 -translate-x-1/2 text-[#F59E0B]" /> : null}
              </div>
              <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#111111]">{person.name}</h2>
              <p className="mt-1 font-mono text-sm font-black text-[#7C4DFF]">{person.xp}</p>
              <div className="mt-4"><Pill active={index === 1}>{index === 1 ? "Top spark" : "Rising"}</Pill></div>
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface>
          <SectionTitle eyebrow="Ranks" title="Momentum table" />
          <div className="space-y-3">
            {rows.map((name, index) => (
              <div key={name} className="flex items-center gap-4 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4 transition-transform duration-300 hover:-translate-y-0.5">
                <span className="w-8 font-mono text-sm font-black text-[#A1A1AA]">{index + 4}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFE8FF] font-black text-[#7C4DFF]">{name[0]}</span>
                <div className="min-w-0 flex-1"><p className="font-black text-[#111111]">{name}</p><p className="text-sm font-semibold text-[#6E6E73]">Level {17 - index} · {14 - index} day streak</p></div>
                <span className="font-mono text-sm font-black text-[#7C4DFF]">{1620 - index * 140} XP</span>
              </div>
            ))}
          </div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Your progress" title="XP curve" />
          <div className="flex h-44 items-end gap-3 rounded-[26px] bg-[#F6F1FF] p-4">
            {[32, 45, 52, 68, 78, 88].map((height, index) => <div key={height} className="flex-1 rounded-full bg-[#7C4DFF] opacity-80" style={{ height: `${height}%` }} />)}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center gap-3"><IconTile icon={Flame} tone="amber" /><div><p className="font-black">14 Day Streak</p><p className="text-sm font-semibold text-[#6E6E73]">Keep learning every day.</p></div></div>
            <div className="flex items-center gap-3"><IconTile icon={Medal} /><div><p className="font-black">Top Achiever Badge</p><p className="text-sm font-semibold text-[#6E6E73]">Unlocked this week.</p></div></div>
          </div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
