import { Activity, Brain, Clock, Sparkles, TrendingUp, UsersRound } from "lucide-react"

import { IconTile, Metric, PeerSparkPage, SectionTitle, Surface } from "@/components/peerspark/primitives"

export default function AnalyticsPage() {
  return (
    <PeerSparkPage eyebrow="Learning analytics" title="Know your growth without staring at a spreadsheet." description="Beautiful, calm signals for focus time, pod momentum, resource completion, and AI-detected learning patterns." actions={[{ label: "Ask AI for insight", href: "/app/ai?analytics=true", icon: Sparkles }]}>
      <div className="grid gap-4 md:grid-cols-4"><Metric label="Focus" value="18h" detail="week" /><Metric label="Recall" value="84%" detail="up" tone="green" /><Metric label="Pods" value="6" detail="active" /><Metric label="XP" value="2.8k" detail="month" tone="amber" /></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><Surface><SectionTitle eyebrow="Trend" title="Weekly learning curve" /><div className="flex h-72 items-end gap-4 rounded-[28px] bg-[#F6F1FF] p-5">{[36, 44, 52, 46, 68, 74, 88].map((height) => <div key={height} className="flex-1 rounded-full bg-[#7C4DFF]" style={{ height: `${height}%` }} />)}</div></Surface><Surface><SectionTitle eyebrow="Signals" title="What matters" /><div className="space-y-3">{[{ label: "Best focus window: 8 PM", icon: Clock }, { label: "Strongest topic: Design systems", icon: Brain }, { label: "Pod momentum is rising", icon: UsersRound }, { label: "Recall improved 18%", icon: TrendingUp }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={item.icon} /><span className="font-black text-[#111111]">{item.label}</span></div>)}</div></Surface></div>
    </PeerSparkPage>
  )
}
