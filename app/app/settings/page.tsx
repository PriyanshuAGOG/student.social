import { Bell, Eye, Lock, LogOut, Moon, Palette, Shield, Sparkles, UserRound } from "lucide-react"

import { IconTile, PeerSparkPage, SectionTitle, Surface } from "@/components/peerspark/primitives"

const groups = [
  { title: "Account", items: ["Profile identity", "Email and login", "Connected accounts"], icon: UserRound },
  { title: "Privacy", items: ["Learning visibility", "Pod discovery", "Blocked users"], icon: Lock },
  { title: "Notifications", items: ["Study reminders", "Pod activity", "Achievement moments"], icon: Bell },
  { title: "Experience", items: ["Motion intensity", "Ambient blur", "Theme preference"], icon: Palette },
]

export default function SettingsPage() {
  return (
    <PeerSparkPage eyebrow="Settings" title="Minimal controls for a premium learning OS." description="Tune privacy, notifications, identity, motion, and AI preferences without entering a corporate control panel." actions={[{ label: "AI preferences", href: "/app/ai?preferences=true", icon: Sparkles }]}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface>
          <SectionTitle eyebrow="Controls" title="Preferences" />
          <div className="grid gap-4 md:grid-cols-2">{groups.map((group, index) => <div key={group.title} className="rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5"><IconTile icon={group.icon} tone={index === 1 ? "green" : index === 2 ? "amber" : "violet"} /><h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#111111]">{group.title}</h2><div className="mt-4 space-y-3">{group.items.map((item) => <div key={item} className="flex items-center justify-between rounded-[18px] bg-white px-3 py-2.5 text-sm font-bold text-[#6E6E73]"><span>{item}</span><span className="h-5 w-9 rounded-full bg-[#EFE8FF] p-0.5"><span className="block h-4 w-4 rounded-full bg-[#7C4DFF]" /></span></div>)}</div></div>)}</div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Security" title="Launch-ready defaults" />
          <div className="space-y-3">
            {[{ label: "Private by default", icon: Shield }, { label: "Comfortable motion", icon: Eye }, { label: "Silent hours enabled", icon: Moon }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={item.icon} /><span className="font-black text-[#111111]">{item.label}</span></div>)}
          </div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#EF4444]/15 bg-[#FFF1F2] px-4 py-3 font-black text-[#EF4444]"><LogOut className="h-4 w-4" /> Sign out</button>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
