import { NextResponse } from "next/server"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

// Fallback models to try if the primary model is rate-limited
const FALLBACK_MODELS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "qwen/qwen-2-7b-instruct:free",
]

export async function runAIChat(messages: ChatMessage[], options?: { model?: string; maxTokens?: number }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY. Add it to .env.local.")
  }

  // Validate API key format
  if (!apiKey.startsWith("sk-or-")) {
    throw new Error("Invalid OPENROUTER_API_KEY format. It should start with 'sk-or-'.")
  }

  // Try models in order, with fallbacks for rate limits
  const modelsToTry = options?.model 
    ? [options.model, ...FALLBACK_MODELS.filter(m => m !== options.model)]
    : FALLBACK_MODELS
  
  let lastError: Error | null = null
  
  for (const model of modelsToTry) {
    try {
      const result = await tryAIRequest(apiKey, messages, model, options?.maxTokens)
      return result
    } catch (error: any) {
      lastError = error
      // If rate limited (429), try next model
      if (error?.message?.includes("429") || error?.message?.includes("rate-limited")) {
        console.warn(`Model ${model} rate-limited, trying next...`)
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }
  
  // All models failed
  throw lastError || new Error("All AI models are currently unavailable. Please try again later.")
}

async function tryAIRequest(apiKey: string, messages: ChatMessage[], model: string, maxTokens?: number): Promise<string> {
  const body = {
    model,
    messages,
    max_tokens: maxTokens || 400,
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
      if (errorData?.error?.code === 429) {
        throw new Error(`429: Rate limited for model ${model}`)
      }
    } catch (parseErr) {
      // Not JSON, use raw text
    }
    
    if (resp.status === 401) {
      throw new Error("OpenRouter API key is invalid or expired. Please check your OPENROUTER_API_KEY in .env.local")
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
  return message as string
}

export function buildResponse(message: string) {
  return NextResponse.json({ message })
}
