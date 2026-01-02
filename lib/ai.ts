import { NextResponse } from "next/server"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

export async function runAIChat(messages: ChatMessage[], options?: { model?: string; maxTokens?: number }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Add it to .env.local.")
  }

  const model = options?.model || "openai/gpt-4o-mini"
  const body = {
    model,
    messages,
    max_tokens: options?.maxTokens || 400,
    temperature: 0.3,
  }

  const resp = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "PeerSpark",
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => "")
    throw new Error(text || `OpenRouter request failed with ${resp.status}`)
  }

  const data = await resp.json()
  const message = data?.choices?.[0]?.message?.content?.trim()
  if (!message) {
    throw new Error("No AI message returned from OpenRouter")
  }
  return message as string
}

export function buildResponse(message: string) {
  return NextResponse.json({ message })
}
