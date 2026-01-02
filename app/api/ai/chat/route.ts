import { NextResponse } from "next/server"
import { runAIChat, ChatMessage } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = (body?.messages || []) as ChatMessage[]
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 })
    }

    const systemPrompt = body?.system as string | undefined
    const userMessages = systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }, ...messages]
      : messages

    const reply = await runAIChat(userMessages, {
      model: body?.model,
      maxTokens: body?.maxTokens,
    })

    return NextResponse.json({ message: reply })
  } catch (err: any) {
    console.error("/api/ai/chat error", err)
    return NextResponse.json({ error: err?.message || "AI request failed" }, { status: 500 })
  }
}
