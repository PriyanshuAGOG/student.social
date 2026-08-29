export type AudioTranscriptResult = {
  transcript: string
  status: 'ready' | 'unavailable' | 'failed'
}

function safeAudioName(input: string): string {
  return (input || `voice-${Date.now()}.webm`).replace(/[\r\n\\/]/g, '-').slice(0, 180)
}

export async function transcribeAudioFile(file: File): Promise<AudioTranscriptResult> {
  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!apiKey) return { transcript: '', status: 'unavailable' }

  try {
    const form = new FormData()
    form.append('file', file, safeAudioName(file.name))
    form.append('model', 'whisper-1')
    form.append('response_format', 'json')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(45_000),
    })
    if (!response.ok) return { transcript: '', status: 'failed' }

    const payload = await response.json().catch(() => null)
    const transcript = String(payload?.text || '').trim().slice(0, 3000)
    return transcript
      ? { transcript, status: 'ready' }
      : { transcript: '', status: 'failed' }
  } catch (error) {
    console.warn('[audio-transcription] Transcription unavailable:', error instanceof Error ? error.message : error)
    return { transcript: '', status: 'failed' }
  }
}
