import { NextResponse } from "next/server"
import { runAIChat, ChatMessage } from "@/lib/ai"
import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, parseJsonBody, requireVerifiedUser } from '@/lib/api-security'
import { buildAuthorizedAIContext } from '@/lib/server/ai-context'

const REQUEST_TIMEOUT = 45000; // 45 seconds

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    enforceSameOrigin(req)
    enforceRateLimit(req, { key: 'ai:chat', max: 20, windowMs: 60_000 })
    const auth = await requireVerifiedUser(req)
    const body = await parseJsonBody(req, z.object({
      messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().trim().min(1).max(12_000) })).min(1).max(20),
      system: z.string().max(8_000).optional(),
      model: z.string().max(120).optional(),
      maxTokens: z.number().int().min(64).max(4096).optional(),
      context: z.object({ resources: z.boolean().optional(), calendar: z.boolean().optional() }).optional(),
    }), 256 * 1024)
    const messages = body.messages as ChatMessage[]

    // Limit message history to last 10 messages to avoid context bloat
    const recentMessages = messages.slice(-10)

    const authorizedContext = await buildAuthorizedAIContext(auth.userId, body.context || {})
    const safetyPrompt = `You are Student.social AI. You may use the authorized context below to help this signed-in student. Never claim to have opened file contents unless those contents were explicitly attached. Never send a message, create or change a calendar event, share a resource, join a Pod, or perform any other side effect without first presenting the exact proposed action and receiving the student's explicit confirmation. A confirmation must be specific to that one action.\n\n${authorizedContext}`
    const systemPrompt = body?.system as string | undefined
    const userMessages = [
      { role: "system" as const, content: `${safetyPrompt}${systemPrompt ? `\n\nAdditional assistant guidance:\n${systemPrompt}` : ''}` },
      ...recentMessages,
    ]

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
  } catch (err: unknown) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    const elapsed = Date.now() - startTime
    const error = err instanceof Error ? err : new Error(String(err))

    console.error(`/api/ai/chat error (${elapsed}ms):`, error.message)

    // Provide user-friendly error messages
    let errorMessage = "I'm having trouble responding right now. Please try again."
    let statusCode = 500

    if (error.message.includes("timeout")) {
      errorMessage = "The AI service is taking too long to respond. Please try a shorter message."
      statusCode = 504
    } else if (error.message.includes("429")) {
      errorMessage = "Too many requests. Please wait a moment before trying again."
      statusCode = 429
    } else if (error.message.includes("401")) {
      errorMessage = "AI service configuration issue. Please contact support."
      statusCode = 500
    } else if (error.message.includes("rate")) {
      errorMessage = "The AI service is busy. Please wait a moment and try again."
      statusCode = 503
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      }, 
      { status: statusCode }
    )
  }
}

