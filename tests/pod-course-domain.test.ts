import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's built-in type-stripping runner requires the explicit extension.
import { allCourseChapters, buildCourseManifest, courseSettingsSchema, emptyLearnerProgress, getUnlockedChapterIds, parseCourseManifest } from "../lib/courses/pod-course.ts"

const settings = courseSettingsSchema.parse({
  moduleTarget: 8,
  estimatedHours: 60,
  targetWeeks: 10,
  passingScore: 80,
})

test("a 60-hour source becomes an ordered 8-module mastery track", () => {
  const manifest = buildCourseManifest({
    title: "Java programming",
    sourceType: "video",
    sourceItems: [{
      id: "source-1",
      videoId: "abcdefghijk",
      title: "Complete Java",
      url: "https://youtube.com/watch?v=abcdefghijk",
      durationSeconds: 60 * 60 * 60,
      position: 0,
    }],
    settings,
  })

  assert.equal(manifest.manifestVersion, 2)
  assert.equal(manifest.modules.length, 8)
  assert.equal(manifest.totalMinutes, 3600)
  const chapters = allCourseChapters(manifest)
  assert.equal(chapters.length, 60)
  assert.deepEqual(chapters.map((chapter) => chapter.order), Array.from({ length: 60 }, (_, index) => index + 1))
  assert.ok(chapters.every((chapter) => chapter.endSeconds > chapter.startSeconds))
  assert.equal(chapters.at(-1)?.endSeconds, 60 * 60 * 60)
})

test("playlist videos remain in source order and are grouped into modules", () => {
  const sourceItems = Array.from({ length: 24 }, (_, index) => ({
    id: `source-${index + 1}`,
    videoId: `video${String(index).padStart(6, "0")}`,
    title: `Java topic ${index + 1}`,
    url: `https://youtube.com/watch?v=video${String(index).padStart(6, "0")}`,
    durationSeconds: 45 * 60,
    position: index,
  }))
  const manifest = buildCourseManifest({ title: "Java playlist", sourceType: "playlist", sourceItems, settings })
  const chapters = allCourseChapters(manifest)

  assert.equal(manifest.modules.length, 8)
  assert.equal(chapters.length, 24)
  assert.equal(chapters[0].title, "Java topic 1")
  assert.equal(chapters.at(-1)?.title, "Java topic 24")
  assert.ok(manifest.modules.every((module) => module.chapters.length === 3))
})

test("mastery gates unlock exactly one next lesson", () => {
  const manifest = buildCourseManifest({
    title: "Java programming",
    sourceType: "video",
    sourceItems: [{ id: "source-1", videoId: "abcdefghijk", title: "Java", url: "https://youtube.com/watch?v=abcdefghijk", durationSeconds: 3600, position: 0 }],
    settings: { ...settings, estimatedHours: 1, moduleTarget: 3 },
  })
  const chapters = allCourseChapters(manifest)
  const progress = emptyLearnerProgress()
  assert.deepEqual([...getUnlockedChapterIds(manifest, progress)], [chapters[0].id])

  progress.completedChapterIds.push(chapters[0].id)
  assert.deepEqual([...getUnlockedChapterIds(manifest, progress)], [chapters[0].id, chapters[1].id])
})

test("legacy Pod courses are upgraded without losing lessons", () => {
  const manifest = parseCourseManifest(JSON.stringify([
    { chapterNumber: 1, title: "Introduction", description: "Start here", estimatedMinutes: 20 },
    { chapterNumber: 2, title: "Practice", description: "Apply it", estimatedMinutes: 30 },
  ]), "Legacy course")

  assert.equal(manifest.manifestVersion, 2)
  assert.equal(allCourseChapters(manifest).length, 2)
  assert.equal(manifest.totalMinutes, 50)
})
