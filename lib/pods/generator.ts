import type { PodDifficulty, PodTask, RoadmapItem } from "./types"

function slugPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "learning"
}

export function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] || ""
}

export function generateStarterRoadmap(input: {
  podId: string
  topic: string
  durationDays?: number
  difficulty?: PodDifficulty | string
  goal?: string
  createdBy?: string
}) {
  const durationDays = Math.max(7, Math.min(60, Number(input.durationDays || 30)))
  const weeks = Math.max(1, Math.ceil(durationDays / 7))
  const now = new Date().toISOString()
  const topic = input.topic.trim() || "the topic"
  const base = slugPart(topic)

  const roadmap: RoadmapItem[] = []
  const tasks: PodTask[] = []

  for (let week = 1; week <= weeks; week += 1) {
    const phaseId = `${base}-phase-${week}`
    roadmap.push({
      $id: phaseId,
      podId: input.podId,
      title: week === 1 ? `Week ${week}: Build the foundation` : week === weeks ? `Week ${week}: Ship and review` : `Week ${week}: Practice with depth`,
      description: week === 1
        ? `Understand the core ideas behind ${topic} and set up a repeatable study workflow.`
        : week === weeks
          ? `Turn your ${topic} practice into a final proof of work and peer review.`
          : `Apply ${topic} through guided practice, discussion, and focused feedback.`,
      type: "phase",
      week,
      day: 1,
      order: week * 100,
      status: week === 1 ? "available" : "locked",
      estimatedMinutes: 120,
      difficulty: week === 1 ? "easy" : week === weeks ? "hard" : "medium",
      points: 0,
      resourceIds: [],
      taskIds: [],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    const lessonId = `${base}-lesson-${week}`
    const taskId = `${base}-task-${week}`
    roadmap.push({
      $id: lessonId,
      podId: input.podId,
      parentId: phaseId,
      phaseId,
      title: week === 1 ? `Map the fundamentals of ${topic}` : `Apply ${topic}: week ${week} studio`,
      description: `Work through the week ${week} learning block, collect questions, and connect the ideas to a concrete outcome.`,
      type: "lesson",
      week,
      day: 1,
      order: week * 100 + 10,
      status: week === 1 ? "available" : "locked",
      estimatedMinutes: 45,
      difficulty: week === 1 ? "easy" : "medium",
      points: 10,
      resourceIds: [],
      taskIds: [taskId],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    })
    roadmap.push({
      $id: `${base}-reflection-${week}`,
      podId: input.podId,
      parentId: phaseId,
      phaseId,
      title: `Reflect and unblock`,
      description: `Post one check-in: what moved, what is unclear, and where you need help.`,
      type: "reflection",
      week,
      day: 5,
      order: week * 100 + 30,
      status: week === 1 ? "available" : "locked",
      estimatedMinutes: 15,
      difficulty: "easy",
      points: 5,
      resourceIds: [],
      taskIds: [],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    })

    tasks.push({
      $id: taskId,
      podId: input.podId,
      roadmapItemId: lessonId,
      title: week === weeks ? `Submit final ${topic} proof of work` : `Complete week ${week} ${topic} deliverable`,
      description: week === weeks
        ? `Share a link, file, or write-up that demonstrates your final learning outcome.`
        : `Create a short artifact that proves you understood this week's ${topic} focus.`,
      type: week === weeks ? "submit" : "build",
      priority: week === 1 ? "high" : "medium",
      status: week === 1 ? "today" : "backlog",
      assignedTo: [],
      assignedRole: "member",
      createdBy: input.createdBy,
      dueAt: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000).toISOString(),
      points: week === weeks ? 50 : 20,
      difficulty: week === 1 ? "easy" : week === weeks ? "hard" : "medium",
      submissionType: week === weeks ? "link" : "text",
      relatedResourceIds: [],
      required: true,
      allowLateSubmission: true,
      order: week,
      createdAt: now,
      updatedAt: now,
    })
  }

  return { roadmap, tasks, notice: "Generated using starter template. Add AI key for smarter generation." }
}
