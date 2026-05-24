import { Award, Bell, CalendarDays, CheckCheck, Flame, Sparkles, UserPlus } from "lucide-react"

import { IconTile, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const notifications = [
  { title: "Ananya invited you to Design Sprint Pod", detail: "Join the live critique room starting in 12 minutes.", icon: UserPlus, tone: "violet" as const, badge: "Action" },
  { title: "14 day streak unlocked", detail: "You kept your learning rhythm alive all week.", icon: Flame, tone: "amber" as const, badge: "Streak" },
  { title: "AI summary is ready", detail: "Your uploaded systems notes became a 12-card deck.", icon: Sparkles, tone: "green" as const, badge: "AI" },
  { title: "Leaderboard movement", detail: "You moved up 4 places after yesterday’s session.", icon: Award, tone: "violet" as const, badge: "XP" },
]

export default function NotificationsPage() {
  return (
    <PeerSparkPage eyebrow="Notifications" title="Signal without noise." description="A focused notification inbox for pod invites, AI outputs, streaks, reminders, and achievement moments." actions={[{ label: "Mark all read", href: "/app/notifications?read=all", icon: CheckCheck }]}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"><Pill active>All</Pill><Pill>Invites</Pill><Pill>AI</Pill><Pill>Streaks</Pill><Pill>Reminders</Pill></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface>
          <SectionTitle eyebrow="Inbox" title="Latest signals" />
          <div className="space-y-3">{notifications.map((item) => <div key={item.title} className="flex gap-4 rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5"><IconTile icon={item.icon} tone={item.tone} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black tracking-[-0.03em] text-[#111111]">{item.title}</h2><Pill>{item.badge}</Pill></div><p className="mt-2 text-sm font-semibold leading-6 text-[#6E6E73]">{item.detail}</p></div></div>)}</div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Today" title="Smart digest" />
          <div className="space-y-3"><div className="rounded-[24px] bg-[#F6F1FF] p-5"><Bell className="h-5 w-5 text-[#7C4DFF]" /><p className="mt-3 font-black text-[#111111]">4 important updates</p><p className="mt-1 text-sm font-semibold text-[#6E6E73]">Everything else is quietly grouped for later.</p></div><div className="rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-5"><CalendarDays className="h-5 w-5 text-[#F59E0B]" /><p className="mt-3 font-black text-[#111111]">Next reminder</p><p className="mt-1 text-sm font-semibold text-[#6E6E73]">DSA sprint starts at 8:00 PM.</p></div></div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
