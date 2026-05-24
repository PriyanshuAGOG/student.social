import { Bookmark, Brain, Flame, Heart, MessageCircle, MoreHorizontal, PenLine, Share2, Sparkles, Trophy, UsersRound, Zap } from "lucide-react"

import { AvatarStack, IconTile, Metric, PeerSparkPage, Pill, SectionTitle, Surface } from "@/components/peerspark/primitives"

const topics = ["For You", "Following", "AI Summaries", "Design", "Data Structures", "Study Rooms"]

const posts = [
  {
    author: "Ananya Sharma",
    role: "UI/UX Designer · Level 18",
    time: "2h",
    body: "Just finished a focused Design Thinking sprint. The 5-step framework finally clicked after remixing it into flashcards and teaching it to my pod.",
    tag: "Design Thinking 101",
    metric: "46 min deep work",
    reactions: "128",
    comments: "24",
    icon: Brain,
  },
  {
    author: "Rohan Mehta",
    role: "Computer Science · Pod Captain",
    time: "5h",
    body: "Anyone up for a late-night Data Structures room? We are doing trees, heaps, and whiteboard drills with AI hints turned on.",
    tag: "Live study invite",
    metric: "12 learners queued",
    reactions: "86",
    comments: "18",
    icon: UsersRound,
  },
  {
    author: "Ishita Verma",
    role: "Biology · 14 day streak",
    time: "8h",
    body: "Uploaded my neurobiology notes into Vault and PeerSpark generated a clean quiz set. Sharing the summary because it saved me two hours.",
    tag: "AI Summary",
    metric: "32 cards created",
    reactions: "214",
    comments: "41",
    icon: Sparkles,
  },
]

export default function FeedPage() {
  return (
    <PeerSparkPage
      eyebrow="Social learning feed"
      title="Learn out loud with people who keep you moving."
      description="A calm, intelligent stream of study updates, resources, live rooms, AI summaries, and streak moments from your learning graph."
      actions={[{ label: "Create post", href: "/app/feed?compose=true", icon: PenLine }, { label: "Ask AI", href: "/app/ai", icon: Sparkles }]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Current streak" value="14" detail="days" tone="amber" />
        <Metric label="Focus XP" value="8.4k" detail="+18%" />
        <Metric label="Studying now" value="126" detail="live" tone="green" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {topics.map((topic, index) => <Pill key={topic} active={index === 0}>{topic}</Pill>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {posts.map((post, index) => (
            <Surface key={post.author} className="group p-6 md:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE8FF] text-lg font-black text-[#7C4DFF] shadow-[0_14px_32px_rgba(124,77,255,0.12)]">{post.author[0]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-black tracking-[-0.03em] text-[#111111]">{post.author}</h2>
                      <p className="text-sm font-semibold text-[#6E6E73]">{post.role} · {post.time}</p>
                    </div>
                    <button className="rounded-full p-2 text-[#A1A1AA] transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]" aria-label="More actions"><MoreHorizontal className="h-5 w-5" /></button>
                  </div>

                  <p className="mt-5 text-pretty text-lg font-semibold leading-8 text-[#111111]">{post.body}</p>

                  <div className="mt-5 rounded-[26px] border border-black/[0.06] bg-[#FCFCFD] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <div className="flex items-center gap-4">
                      <IconTile icon={post.icon} tone={index === 1 ? "green" : "violet"} />
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7C4DFF]">{post.tag}</p>
                        <p className="mt-1 text-sm font-bold text-[#6E6E73]">{post.metric}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4 text-sm font-extrabold text-[#6E6E73]">
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]"><Heart className="h-4 w-4" />{post.reactions}</button>
                      <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]"><MessageCircle className="h-4 w-4" />{post.comments}</button>
                      <button className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]"><Share2 className="h-4 w-4" />Remix</button>
                    </div>
                    <button className="rounded-full p-2 transition-colors hover:bg-[#F6F1FF] hover:text-[#7C4DFF]" aria-label="Save post"><Bookmark className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>

        <aside className="space-y-6">
          <Surface>
            <SectionTitle eyebrow="AI curator" title="Recommended next" />
            <div className="space-y-3">
              {["Summarize today’s saved PDFs", "Join Algorithms room at 8 PM", "Turn Ananya’s post into flashcards"].map((item) => (
                <div key={item} className="rounded-[22px] border border-black/[0.06] bg-[#FCFCFD] p-4 text-sm font-bold text-[#111111]">{item}</div>
              ))}
            </div>
          </Surface>
          <Surface>
            <SectionTitle eyebrow="Live rooms" title="Studying now" action="View all" />
            <AvatarStack names={["Ananya", "Rohan", "Ishita", "Priya", "Karan"]} />
            <div className="mt-5 space-y-3">
              <Pill active><Flame className="mr-1.5 h-3.5 w-3.5" /> Design Sprint</Pill>
              <Pill><Zap className="mr-1.5 h-3.5 w-3.5" /> DSA Whiteboard</Pill>
              <Pill><Trophy className="mr-1.5 h-3.5 w-3.5" /> Biology Quiz</Pill>
            </div>
          </Surface>
        </aside>
      </div>
    </PeerSparkPage>
  )
}
