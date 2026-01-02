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

  // Validate API key format
  if (!apiKey.startsWith("sk-or-")) {
    throw new Error("Invalid OPENROUTER_API_KEY format. It should start with 'sk-or-'.")
  }

  const model = options?.model || "meta-llama/llama-3.2-3b-instruct:free"
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
    console.error("OpenRouter API error:", resp.status, text)
    
    // Parse error for more specific messages
    try {
      const errorData = JSON.parse(text)
      if (errorData?.error?.message) {
        throw new Error(`OpenRouter: ${errorData.error.message}`)
      }
    } catch (parseErr) {
      // Not JSON, use raw text
    }
    
    if (resp.status === 401) {
      throw new Error("OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env.local")
    }
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
