import { Bot, Mic, Paperclip, Phone, Plus, Search, Send, Smile, UsersRound } from "lucide-react"

import { AvatarStack, IconTile, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const rooms = ["Design Sprint Pod", "DSA Night Room", "Biology Crew", "Product Builders"]
const messages = [
  ["Ananya", "I added the Design Thinking worksheet to Vault."],
  ["Rohan", "Can we do a 25-minute recursion drill after dinner?"],
  ["PeerSpark AI", "Suggested reply: I’m in — send the whiteboard link."],
]

export default function ChatPage() {
  return (
    <PeerSparkPage eyebrow="Messages" title="Study conversations with calm iMessage energy." description="Groups, pods, voice notes, AI reply suggestions, shared resources, and live learning context in one polished communication layer." actions={[{ label: "New group", href: "/app/chat?new=true", icon: Plus }]}>
      <div className="grid min-h-[640px] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Surface>
          <div className="mb-5 flex items-center gap-3 rounded-[22px] border border-black/[0.06] bg-[#FCFCFD] px-4 py-3"><Search className="h-4 w-4 text-[#A1A1AA]" /><span className="text-sm font-semibold text-[#A1A1AA]">Search messages…</span></div>
          <SectionTitle eyebrow="Rooms" title="Active groups" />
          <div className="space-y-3">{rooms.map((room, index) => <div key={room} className="flex items-center gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={UsersRound} tone={index === 0 ? "violet" : "green"} /><div className="min-w-0 flex-1"><p className="truncate font-black text-[#111111]">{room}</p><p className="text-sm font-semibold text-[#6E6E73]">{12 + index * 4} active learners</p></div><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" /></div>)}</div>
        </Surface>
        <Surface className="flex flex-col p-0">
          <div className="flex items-center justify-between border-b border-black/[0.06] p-5"><div><h2 className="text-xl font-black tracking-[-0.04em]">Design Sprint Pod</h2><div className="mt-2 flex items-center gap-3"><AvatarStack names={["Ananya", "Rohan", "Priya"]} /><p className="text-sm font-semibold text-[#6E6E73]">18 online · AI notes enabled</p></div></div><div className="flex gap-2"><button className="rounded-full border border-black/[0.06] bg-white p-3"><Phone className="h-4 w-4" /></button><button className="rounded-full bg-[#7C4DFF] p-3 text-white"><Bot className="h-4 w-4" /></button></div></div>
          <div className="flex-1 space-y-4 p-5">{messages.map(([name, body], index) => <div key={body} className={`max-w-[78%] rounded-[28px] p-5 ${index === 2 ? "ml-auto bg-[#7C4DFF] text-white" : "border border-black/[0.06] bg-[#FCFCFD] text-[#111111]"}`}><p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{name}</p><p className="mt-2 font-semibold leading-7">{body}</p></div>)}</div>
          <div className="p-5"><div className="flex items-center gap-3 rounded-[26px] border border-black/[0.06] bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.06)]"><Paperclip className="h-5 w-5 text-[#A1A1AA]" /><Mic className="h-5 w-5 text-[#A1A1AA]" /><span className="flex-1 text-sm font-semibold text-[#A1A1AA]">Message Design Sprint Pod…</span><Smile className="h-5 w-5 text-[#A1A1AA]" /><button className="rounded-[18px] bg-[#7C4DFF] p-3 text-white"><Send className="h-4 w-4" /></button></div></div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
