import { BookOpen, Bookmark, FileText, Layers3, Library, PlayCircle, Plus, Sparkles, WandSparkles } from "lucide-react"

import { IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const filters = ["All", "Notes", "PDFs", "Books", "Flashcards", "AI summaries", "Videos", "Playlists"]
const resources = [
  { title: "The Complete UI/UX Design Guide", type: "Course · 42 lessons", size: "lg", icon: Layers3, tone: "violet" as const },
  { title: "System Design Basics", type: "Article · 15 min read", size: "sm", icon: FileText, tone: "green" as const },
  { title: "Python Crash Course", type: "Book · 32 lessons", size: "sm", icon: BookOpen, tone: "amber" as const },
  { title: "The Psychology of Habits", type: "Book · James Clear", size: "md", icon: Library, tone: "rose" as const },
  { title: "Neurobiology Flashcards", type: "Flashcards · 128 cards", size: "sm", icon: Sparkles, tone: "violet" as const },
  { title: "Calculus Visual Playlist", type: "Video · 8 episodes", size: "md", icon: PlayCircle, tone: "green" as const },
]

export default function VaultPage() {
  return (
    <PeerSparkPage
      eyebrow="Resource vault"
      title="A beautiful library for everything your brain wants to keep."
      description="Save notes, PDFs, flashcards, videos, playlists, and AI summaries into a calm editorial collection that feels more like Cosmos than a file cabinet."
      actions={[{ label: "Add resource", href: "/app/vault?add=true", icon: Plus }, { label: "AI summarize", href: "/app/ai?summarizer=true", icon: WandSparkles }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Saved resources" value="248" detail="+12" />
        <Metric label="AI summaries" value="37" detail="fresh" tone="green" />
        <Metric label="Flashcards" value="1.2k" detail="ready" tone="amber" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((filter, index) => <Pill key={filter} active={index === 0}>{filter}</Pill>)}
      </div>

      <Surface className="min-h-[260px] bg-[radial-gradient(circle_at_76%_22%,rgba(255,255,255,0.26),transparent_18rem),linear-gradient(135deg,#7C4DFF_0%,#9C6BFF_54%,#D85CFF_100%)] p-7 text-white">
        <div className="max-w-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/75">Featured resource</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.06em]">The Complete UI/UX Design Guide</h2>
          <p className="mt-3 max-w-md text-base font-semibold leading-7 text-white/82">A curated path through visual hierarchy, interaction patterns, design systems, and critique rituals.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/18 px-3 py-1.5 text-sm font-extrabold backdrop-blur-xl">42 lessons</span>
            <span className="rounded-full bg-white/18 px-3 py-1.5 text-sm font-extrabold backdrop-blur-xl">Intermediate</span>
            <span className="rounded-full bg-white/18 px-3 py-1.5 text-sm font-extrabold backdrop-blur-xl">AI cards ready</span>
          </div>
        </div>
        <div className="pointer-events-none absolute right-8 top-8 hidden h-44 w-44 rounded-[42px] bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl md:block" />
      </Surface>

      <div>
        <SectionTitle eyebrow="Masonry vault" title="Recommended for you" action="Sort by recent" />
        <div className="grid auto-rows-[180px] gap-5 md:grid-cols-3">
          {resources.map((resource, index) => (
            <Surface key={resource.title} className={resource.size === "lg" ? "md:col-span-2 md:row-span-2" : resource.size === "md" ? "md:row-span-2" : ""}>
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={resource.icon} tone={resource.tone} />
                  <button className="rounded-full p-2 text-[#A1A1AA] transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]" aria-label="Save resource"><Bookmark className="h-4 w-4" /></button>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A1A1AA]">{resource.type}</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.045em] text-[#111111]">{resource.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>{index % 2 ? "Quick preview" : "AI summarize"}</Pill>
                    <Pill>Save count {128 + index * 32}</Pill>
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </PeerSparkPage>
  )
}
