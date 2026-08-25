"use client"

import { useDeferredValue, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText, Search, Users, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SearchKind = "all" | "people" | "posts" | "pods"

interface SearchResults {
  people: any[]
  posts: any[]
  pods: any[]
}

const EMPTY_RESULTS: SearchResults = { people: [], posts: [], pods: [] }

function profileHref(person: any) {
  const key = String(person.username || person.userId || person.$id || person.name || "student").replace(/^@/, "").replace(/\s+/g, "_")
  return `/app/profile/${encodeURIComponent(key)}`
}

export default function AppSearchPage() {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim())
  const [kind, setKind] = useState<SearchKind>("all")
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (deferredQuery.length < 2) {
      setResults(EMPTY_RESULTS)
      setLoading(false)
      setError("")
      return
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const encoded = encodeURIComponent(deferredQuery.replace(/^#/, ""))
        const [postsResponse, podsResponse, peopleResponse] = await Promise.all([
          fetch(`/api/posts?search=${encoded}&limit=50`, { signal: controller.signal }),
          fetch(`/api/pods2?search=${encoded}`, { signal: controller.signal }),
          fetch("/api/profiles/list?limit=100", { signal: controller.signal }),
        ])
        const [postsPayload, podsPayload, peoplePayload] = await Promise.all([
          postsResponse.ok ? postsResponse.json() : Promise.resolve({}),
          podsResponse.ok ? podsResponse.json() : Promise.resolve({}),
          peopleResponse.ok ? peopleResponse.json() : Promise.resolve({}),
        ])
        const needle = deferredQuery.replace(/^@|^#/, "").toLowerCase()
        const people = (peoplePayload.profiles || []).filter((person: any) => {
          const searchable = [person.name, person.username, person.bio, ...(person.interests || []), ...(person.currentFocusAreas || []), ...(person.learningGoals || [])].filter(Boolean).join(" ").toLowerCase()
          return searchable.includes(needle) || needle.split(/\s+/).every((part) => searchable.includes(part))
        })
        setResults({ people: people.slice(0, 30), posts: (postsPayload.posts || postsPayload.documents || []).slice(0, 40), pods: (podsPayload.data?.pods || podsPayload.pods || []).slice(0, 30) })
      } catch (searchError: any) {
        if (searchError?.name !== "AbortError") setError("Search is taking a break. Please try again.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 260)
    return () => { window.clearTimeout(timeout); controller.abort() }
  }, [deferredQuery])

  const total = results.people.length + results.posts.length + results.pods.length
  const counts = { all: total, people: results.people.length, posts: results.posts.length, pods: results.pods.length }

  return (
    <main className="student-search-page">
      <header className="student-search-head"><Link href="/app/feed" aria-label="Back to feed"><ArrowLeft /></Link><div><span>Explore Student.social</span><h1>Find the right person, post, or pod.</h1></div></header>
      <div className="student-search-field"><Search aria-hidden="true" /><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name, @username, #tag, skill, or phrase…" aria-label="Search Student.social" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X /></button> : <kbd>⌘ K</kbd>}</div>
      <div className="student-search-tabs" role="tablist" aria-label="Search result type">{(["all", "people", "posts", "pods"] as SearchKind[]).map((item) => <button key={item} type="button" role="tab" aria-selected={kind === item} onClick={() => setKind(item)} className={kind === item ? "is-active" : ""}><span>{item}</span>{deferredQuery.length >= 2 ? <small>{counts[item]}</small> : null}</button>)}</div>
      <section className="student-search-results" aria-live="polite">
        {deferredQuery.length < 2 ? <div className="student-search-welcome"><span><Search /></span><h2>Search your learning network</h2><p>Try a student’s name or username, a phrase from a post, a hashtag, or the skill you want to learn next.</p><div><em>@ramesh</em><em>#systemdesign</em><em>Python beginners</em></div></div> : null}
        {loading ? <div className="student-search-state"><i /><p>Searching people, posts, and pods…</p></div> : null}
        {!loading && error ? <div className="student-search-state"><p>{error}</p></div> : null}
        {!loading && !error && deferredQuery.length >= 2 && total === 0 ? <div className="student-search-welcome"><span><Search /></span><h2>No matches yet</h2><p>Try fewer words, remove the @ or #, or search for a broader learning topic.</p></div> : null}
        {!loading && !error && (kind === "all" || kind === "people") && results.people.length ? <div className="student-result-group"><div className="student-result-title"><span>People</span><small>{results.people.length} matches</small></div><div className="student-people-grid">{results.people.map((person) => { const name = person.name || person.username || "Student"; const initials = name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase(); return <Link key={person.$id || person.userId} href={profileHref(person)} className="student-person-result"><Avatar><AvatarImage src={person.avatar || person.profilePictureUrl || "/placeholder.svg"} alt={name} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div><strong>{name}</strong><small>{person.username ? `@${String(person.username).replace(/^@/, "")}` : "Student"}</small><p>{person.bio || person.currentFocusAreas?.[0] || person.learningGoals?.[0] || "Learning on Student.social"}</p></div><span>{person.isOnline ? "Online" : `${person.studyStreak || 0} day streak`}</span></Link> })}</div></div> : null}
        {!loading && !error && (kind === "all" || kind === "posts") && results.posts.length ? <div className="student-result-group"><div className="student-result-title"><span>Posts</span><small>{results.posts.length} matches</small></div><div className="student-post-results">{results.posts.map((post) => <Link key={post.$id || post.id} href={`/app/feed?post=${encodeURIComponent(post.$id || post.id)}`}><span><FileText /></span><div><strong>{post.authorName || "Student"}</strong><p>{post.content}</p><small>{(post.tags || []).slice(0, 4).map((tag: string) => `#${tag}`).join("  ") || "Community post"}</small></div></Link>)}</div></div> : null}
        {!loading && !error && (kind === "all" || kind === "pods") && results.pods.length ? <div className="student-result-group"><div className="student-result-title"><span>Pods</span><small>{results.pods.length} matches</small></div><div className="student-pod-results">{results.pods.map((pod) => <Link key={pod.$id || pod.id} href={`/app/pods/${encodeURIComponent(pod.$id || pod.id)}/preview`}><span><Users /></span><div><strong>{pod.name || "Study pod"}</strong><p>{pod.shortOutcome || pod.description || "A focused learning circle."}</p><small>{pod.category || "General"} · {pod.difficulty || "Beginner"} · {pod.memberCount || 0} members</small></div></Link>)}</div></div> : null}
      </section>
    </main>
  )
}
