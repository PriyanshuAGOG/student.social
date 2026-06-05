import { NextResponse } from "next/server"
import { getEnv } from "./env"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

// Fallback models to try if the primary model is rate-limited
const FALLBACK_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "qwen/qwen-2-7b-instruct:free",
]

export async function runAIChat(messages: ChatMessage[], options?: { model?: string; maxTokens?: number }) {
  const env = getEnv()
  const openRouterKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ""
  const openAIKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ""

  if (openRouterKey) {
    if (!openRouterKey.startsWith("sk-or-")) {
      throw new Error("Invalid OPENROUTER_API_KEY format. It should start with 'sk-or-'.")
    }

    const modelsToTry = options?.model
      ? [options.model, ...FALLBACK_MODELS.filter((model) => model !== options.model)]
      : FALLBACK_MODELS

    let lastError: Error | null = null

    for (const model of modelsToTry) {
      try {
        return await tryAIRequest({ apiKey: openRouterKey, endpoint: OPENROUTER_ENDPOINT, model, messages, maxTokens: options?.maxTokens, provider: "openrouter" })
      } catch (error: unknown) {
        const aiError = error instanceof Error ? error : new Error(String(error))
        lastError = aiError
        if (aiError.message.includes("429") || aiError.message.includes("rate-limited")) {
          console.warn(`Model ${model} rate-limited, trying next...`)
          continue
        }
        throw aiError
      }
    }

    throw lastError || new Error("All AI models are currently unavailable. Please try again later.")
  }

  if (openAIKey) {
    return await tryAIRequest({
      apiKey: openAIKey,
      endpoint: OPENAI_ENDPOINT,
      model: options?.model || "gpt-4o-mini",
      messages,
      maxTokens: options?.maxTokens,
      provider: "openai",
    })
  }

  return buildOfflineStudyResponse(messages)
}

function buildOfflineStudyResponse(messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "your question"
  return [
    "I’m running in offline study mode because the AI provider is not configured yet.",
    "",
    `Here is a practical way to approach: ${lastUserMessage.slice(0, 240)}`,
    "",
    "1. Identify the key concept or deliverable in the prompt.",
    "2. Break it into 2–3 smaller subquestions.",
    "3. Write what you already know, then mark the exact gap you need to research.",
    "4. If this is code, create a minimal reproducible example and inspect inputs, outputs, and edge cases.",
    "",
    "Configure OPENAI_API_KEY or OPENROUTER_API_KEY to enable full AI responses.",
  ].join("\n")
}

async function tryAIRequest(options: { apiKey: string; endpoint: string; model: string; messages: ChatMessage[]; maxTokens?: number; provider: "openrouter" | "openai" }): Promise<string> {
  const { apiKey, endpoint, model, messages, maxTokens, provider } = options
  const body = {
    model,
    messages,
    max_tokens: maxTokens || 4096, // Increased from 400 to allow longer responses
    temperature: 0.3,
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(provider === "openrouter" ? {
        "HTTP-Referer": getEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "PeerSpark",
      } : {}),
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
      if (errorData?.error?.code === 429) {
        throw new Error(`429: Rate limited for model ${model}`)
      }
    } catch {
      // Not JSON, use raw text
    }
    
    if (resp.status === 401) {
      throw new Error(provider === "openrouter"
        ? "OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env.local"
        : "OpenAI API key is invalid or expired. Please check your OPENAI_API_KEY in .env.local")
    }
    if (resp.status === 429) {
      throw new Error(`429: Rate limited for model ${model}`)
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

// Export callLLM as an alias for backwards compatibility
export const callLLM = runAIChat
