import { Bot, Brain, FileQuestion, GraduationCap, ListChecks, MessageSquareText, Sparkles, WandSparkles } from "lucide-react"

import { IconTile, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const tools = [
  { label: "AI Tutor", detail: "Understand anything step-by-step", icon: GraduationCap },
  { label: "Roadmap Builder", detail: "Turn goals into weekly sprints", icon: ListChecks },
  { label: "Flashcard Creator", detail: "Generate spaced repetition decks", icon: Brain },
  { label: "Quiz Generator", detail: "Practice with adaptive questions", icon: FileQuestion },
  { label: "Summarizer", detail: "Compress PDFs, notes, and videos", icon: WandSparkles },
  { label: "Study Optimizer", detail: "Find the highest leverage next move", icon: Sparkles },
]

export default function AIPage() {
  return (
    <PeerSparkPage eyebrow="AI workspace" title="A Raycast-fast command center for your learning brain." description="Tutor, planner, summarizer, quiz builder, flashcard generator, and accountability strategist in one floating workspace." actions={[{ label: "New AI session", href: "/app/ai?new=true", icon: Bot }]}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="min-h-[560px] p-0">
          <div className="border-b border-black/[0.06] p-5"><div className="flex items-center gap-3"><IconTile icon={Bot} /><div><h2 className="text-xl font-black tracking-[-0.04em]">PeerSpark AI</h2><p className="text-sm font-semibold text-[#6E6E73]">Streaming tutor · Context aware</p></div></div></div>
          <div className="space-y-5 p-5">
            <div className="max-w-[78%] rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5 shadow-[0_10px_34px_rgba(0,0,0,0.035)]"><p className="font-semibold leading-7 text-[#111111]">Build me a 7-day plan to master recursion and dynamic programming before my pod challenge.</p></div>
            <div className="ml-auto max-w-[86%] rounded-[28px] bg-[#7C4DFF] p-5 text-white shadow-[0_18px_44px_rgba(124,77,255,0.18)]"><p className="font-semibold leading-7">Absolutely. I’ll sequence concept clarity, whiteboard reps, flashcards, and two live pod sessions so you progress without overload.</p></div>
            <div className="grid gap-3 md:grid-cols-3"><Pill active>Explain recursion</Pill><Pill>Generate quiz</Pill><Pill>Schedule sprint</Pill></div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-[26px] border border-black/[0.06] bg-white/90 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl"><div className="flex items-center gap-3"><MessageSquareText className="h-5 w-5 text-[#A1A1AA]" /><span className="flex-1 text-sm font-semibold text-[#A1A1AA]">Ask for a plan, quiz, summary, or study strategy…</span><button className="rounded-[18px] bg-[#7C4DFF] px-4 py-2 text-sm font-black text-white">Send</button></div></div>
        </Surface>
        <Surface>
          <SectionTitle eyebrow="Tools" title="Launch pad" />
          <div className="space-y-3">{tools.map((tool, index) => <div key={tool.label} className="flex items-center gap-3 rounded-[24px] border border-black/[0.06] bg-[#FCFCFD] p-4"><IconTile icon={tool.icon} tone={index % 3 === 0 ? "violet" : index % 3 === 1 ? "green" : "amber"} /><div><p className="font-black text-[#111111]">{tool.label}</p><p className="text-sm font-semibold text-[#6E6E73]">{tool.detail}</p></div></div>)}</div>
        </Surface>
      </div>
    </PeerSparkPage>
  )
}
