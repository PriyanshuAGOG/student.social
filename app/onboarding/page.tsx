import { ArrowRight, Brain, CheckCircle2, Sparkles, Target, UsersRound } from "lucide-react"
import Link from "next/link"

import { IconTile, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const steps = [
  { title: "Pick your learning worlds", detail: "Design, CS, AI, business, science, writing, and more.", icon: Brain },
  { title: "Set your rhythm", detail: "Choose streak goals, session times, and accountability style.", icon: Target },
  { title: "Meet your pods", detail: "PeerSpark matches you with communities that fit your energy.", icon: UsersRound },
]

export default function OnboardingPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#F7F7FA] px-4 py-8 text-[#111111] sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-[#7C4DFF]/18 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 top-24 h-96 w-96 rounded-full bg-[#7FFFD4]/18 blur-3xl" />
      <section className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-[#7C4DFF] shadow-[0_10px_30px_rgba(0,0,0,0.035)]"><Sparkles className="h-3.5 w-3.5" /> Magical onboarding</div>
          <h1 className="text-balance text-5xl font-black tracking-[-0.075em] sm:text-7xl">Build your social learning OS.</h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#6E6E73]">No forms. Just a guided, floating setup that understands what you want to learn, who you should learn with, and how to keep you moving.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Pill active>AI personality analysis</Pill><Pill>Topic selection</Pill><Pill>Goal design</Pill></div>
          <Link href="/app/feed" className="mt-8 inline-flex h-13 items-center gap-2 rounded-[20px] bg-[#7C4DFF] px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,77,255,0.2)] transition-transform hover:-translate-y-1">Enter PeerSpark <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <Surface className="p-6 md:p-8">
          <SectionTitle eyebrow="Setup flow" title="Three calm steps" />
          <div className="space-y-4">{steps.map((step, index) => <div key={step.title} className="flex gap-4 rounded-[28px] border border-black/[0.06] bg-[#FCFCFD] p-5"><IconTile icon={step.icon} tone={index === 1 ? "amber" : index === 2 ? "green" : "violet"} /><div><div className="flex items-center gap-2"><h2 className="font-black text-[#111111]">{step.title}</h2>{index === 0 ? <CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> : null}</div><p className="mt-1 text-sm font-semibold leading-6 text-[#6E6E73]">{step.detail}</p></div></div>)}</div>
        </Surface>
      </section>
    </main>
  )
}
