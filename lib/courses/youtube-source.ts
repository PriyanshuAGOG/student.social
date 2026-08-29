import type { YouTubeSourceItem } from "./pod-course"

type YouTubeSource = {
  sourceType: "video" | "playlist"
  sourceTitle: string
  playlistId?: string
  videoId?: string
  items: YouTubeSourceItem[]
  metadataMode: "youtube_api" | "public_preview" | "estimated"
}

function parseDuration(value?: string): number {
  if (!value) return 0
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
}

function parseYouTubeUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "")
  if (!["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(hostname)) {
    throw new Error("Use a youtube.com or youtu.be course link")
  }
  const playlistId = url.searchParams.get("list") || undefined
  let videoId = url.searchParams.get("v") || undefined
  if (!videoId && hostname === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0]
  if (!videoId && ["embed", "shorts", "live"].some((part) => url.pathname.includes(`/${part}/`))) {
    videoId = url.pathname.split("/").filter(Boolean)[1]
  }
  if (!playlistId && !videoId) throw new Error("The YouTube link does not contain a video or playlist")
  return { playlistId, videoId }
}

async function fetchJson(url: string, timeoutMs = 8_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" })
    if (!response.ok) throw new Error(`YouTube metadata request failed (${response.status})`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function resolvePlaylistWithApi(playlistId: string, apiKey: string): Promise<{ title: string; items: YouTubeSourceItem[] }> {
  const collected: Array<{ videoId: string; title: string; position: number; channelTitle?: string }> = []
  let pageToken = ""
  let playlistTitle = "YouTube playlist"

  const playlistInfo = await fetchJson(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`)
  playlistTitle = playlistInfo?.items?.[0]?.snippet?.title || playlistTitle

  do {
    const page = await fetchJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`)
    for (const item of page?.items || []) {
      const videoId = item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId
      if (!videoId || item?.snippet?.title === "Deleted video" || item?.snippet?.title === "Private video") continue
      collected.push({
        videoId,
        title: item?.snippet?.title || `Video ${collected.length + 1}`,
        position: Number(item?.snippet?.position ?? collected.length),
        channelTitle: item?.snippet?.videoOwnerChannelTitle || item?.snippet?.channelTitle,
      })
    }
    pageToken = page?.nextPageToken || ""
  } while (pageToken && collected.length < 200)

  const durations = new Map<string, number>()
  for (let index = 0; index < collected.length; index += 50) {
    const ids = collected.slice(index, index + 50).map((item) => item.videoId).join(",")
    const response = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(ids)}&key=${encodeURIComponent(apiKey)}`)
    for (const item of response?.items || []) durations.set(item.id, parseDuration(item?.contentDetails?.duration))
  }

  return {
    title: playlistTitle,
    items: collected.sort((a, b) => a.position - b.position).map((item, index) => ({
      id: `source-${index + 1}`,
      videoId: item.videoId,
      title: item.title,
      url: `https://www.youtube.com/watch?v=${item.videoId}&list=${playlistId}`,
      durationSeconds: durations.get(item.videoId) || 0,
      position: index,
      channelTitle: item.channelTitle,
    })),
  }
}

async function resolveVideoPreview(videoId: string, rawUrl: string, estimatedHours: number): Promise<{ title: string; item: YouTubeSourceItem }> {
  let title = "YouTube course"
  let channelTitle: string | undefined
  try {
    const preview = await fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`, 5_000)
    title = preview?.title || title
    channelTitle = preview?.author_name
  } catch {
    // The course can still be structured when YouTube preview metadata is unavailable.
  }
  return {
    title,
    item: {
      id: "source-1",
      videoId,
      title,
      url: rawUrl,
      durationSeconds: Math.round(estimatedHours * 3600),
      position: 0,
      channelTitle,
    },
  }
}

export async function resolveYouTubeSource(rawUrl: string, estimatedHours: number): Promise<YouTubeSource> {
  const { playlistId, videoId } = parseYouTubeUrl(rawUrl)
  const apiKey = process.env.YOUTUBE_API_KEY || ""

  if (playlistId && apiKey) {
    const playlist = await resolvePlaylistWithApi(playlistId, apiKey)
    if (playlist.items.length) {
      return {
        sourceType: "playlist",
        sourceTitle: playlist.title,
        playlistId,
        videoId: playlist.items[0].videoId,
        items: playlist.items,
        metadataMode: "youtube_api",
      }
    }
  }

  if (videoId) {
    const preview = await resolveVideoPreview(videoId, rawUrl, estimatedHours)
    return {
      sourceType: playlistId ? "playlist" : "video",
      sourceTitle: preview.title,
      playlistId,
      videoId,
      items: [preview.item],
      metadataMode: playlistId ? "estimated" : "public_preview",
    }
  }

  // A playlist-only URL needs the official API to enumerate its videos reliably.
  throw new Error("This playlist link needs YOUTUBE_API_KEY configured, or include a video from the playlist in the URL")
}
