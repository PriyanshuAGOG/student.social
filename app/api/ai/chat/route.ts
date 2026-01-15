import { NextResponse } from "next/server"
import { runAIChat, ChatMessage } from "@/lib/ai"

const REQUEST_TIMEOUT = 45000; // 45 seconds

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const messages = (body?.messages || []) as ChatMessage[]
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" }, 
        { status: 400 }
      )
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: "Each message must have 'role' and 'content'" }, 
          { status: 400 }
        )
      }
    }

    // Limit message history to last 10 messages to avoid context bloat
    const recentMessages = messages.slice(-10)

    const systemPrompt = body?.system as string | undefined
    const userMessages = systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }, ...recentMessages]
      : recentMessages

    // Add timeout wrapper
    const responsePromise = runAIChat(userMessages, {
      model: body?.model,
      maxTokens: body?.maxTokens || 2048,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("AI response timeout - please try again"))
      }, REQUEST_TIMEOUT)
    })

    const reply = await Promise.race([responsePromise, timeoutPromise])

    const elapsed = Date.now() - startTime
    
    return NextResponse.json({ 
      message: reply,
      metadata: {
        processingTime: elapsed,
        model: body?.model || "default",
      }
    })
  } catch (err: any) {
    const elapsed = Date.now() - startTime
    
    console.error(`/api/ai/chat error (${elapsed}ms):`, err?.message)

    // Provide user-friendly error messages
    let errorMessage = "I'm having trouble responding right now. Please try again."
    let statusCode = 500

    if (err?.message?.includes("timeout")) {
      errorMessage = "The AI service is taking too long to respond. Please try a shorter message."
      statusCode = 504
    } else if (err?.message?.includes("429")) {
      errorMessage = "Too many requests. Please wait a moment before trying again."
      statusCode = 429
    } else if (err?.message?.includes("401")) {
      errorMessage = "AI service configuration issue. Please contact support."
      statusCode = 500
    } else if (err?.message?.includes("rate")) {
      errorMessage = "The AI service is busy. Please wait a moment and try again."
      statusCode = 503
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? err?.message : undefined
      }, 
      { status: statusCode }
    )
  }
}

