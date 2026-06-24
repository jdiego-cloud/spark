import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabase } from '@/lib/supabase'

const SYSTEM_PROMPT =
  'You are Spark, a curiosity assistant. Explain things clearly in plain language anyone can understand. Avoid jargon. Keep answers focused and concise — 4 to 7 sentences. Respond in the same language the user writes in.'

const GUARD_PROMPT =
  'You are a content safety classifier. Respond with exactly one word: SAFE or UNSAFE. Classify as UNSAFE only if the message explicitly requests instructions for creating weapons, explosives, dangerous chemicals, instructions for violence, or self-harm methods. Classify everything else — including off-topic, silly, or unrelated questions — as SAFE. Message to classify:'

type ChatMessage = { role: 'user' | 'bot'; content: string }

type RequestBody = {
  type: 'intake' | 'followup'
  sessionId: string
  // intake fields
  topic?: string
  confusion?: string
  depth?: string
  // followup fields
  history?: ChatMessage[]
  userMessage?: string
}

async function classifySafety(genAI: GoogleGenerativeAI, text: string): Promise<boolean> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(`${GUARD_PROMPT} "${text}"`)
  const verdict = result.response.text().trim().toUpperCase()
  return verdict.startsWith('SAFE')
}

export async function POST(request: NextRequest) {
  let body: RequestBody | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, sessionId } = body ?? {}
  if (!type || !sessionId) {
    return NextResponse.json({ error: 'type and sessionId are required' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const db = getSupabase()

  if (type === 'intake') {
    const { topic, confusion, depth } = body ?? {}
    if (!topic || !confusion || !depth) {
      return NextResponse.json({ error: 'topic, confusion, and depth are required' }, { status: 400 })
    }

    // Check each intake answer for safety
    const allText = `${topic} ${confusion} ${depth}`
    let isSafe = true
    let classifierErrored = false
    try {
      isSafe = await classifySafety(genAI, allText)
    } catch (err) {
      console.error('[/api/chat] guardrail error:', err)
      isSafe = false
      classifierErrored = true
    }

    if (!isSafe) {
      const refusal = classifierErrored
        ? "Something went wrong checking that message. Mind trying again?"
        : "I can't help with that. I'm built for science curiosity, though — want to ask about something else?"

      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: refusal,
          is_flagged: !classifierErrored,
        })
      }

      return NextResponse.json({ answer: refusal, flagged: !classifierErrored })
    }

    // Build the explanation prompt
    const prompt = `A curious person wants to understand: "${topic}". The part that's confusing or unclear to them is: "${confusion}". They want: ${depth === 'Quick answer' ? 'a brief, quick answer' : 'a full, thorough explanation'}. Please explain this clearly.`

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      })
      const result = await model.generateContent(prompt)
      const answer = result.response.text()

      // Persist chat_sessions row
      if (db) {
        await db.from('chat_sessions').insert({
          session_id: sessionId,
          intake_topic: topic,
          intake_confusion: confusion,
          intake_depth: depth,
        })
        // Save bot message
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: answer,
          is_flagged: false,
        })
      }

      return NextResponse.json({ answer, flagged: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[/api/chat] Gemini intake error:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (type === 'followup') {
    const { history, userMessage } = body ?? {}
    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
    }

    // Guardrail on user message
    let isSafe = true
    let classifierErrored = false
    try {
      isSafe = await classifySafety(genAI, userMessage)
    } catch (err) {
      console.error('[/api/chat] guardrail error:', err)
      isSafe = false
      classifierErrored = true
    }

    if (!isSafe) {
      const refusal = classifierErrored
        ? "Something went wrong checking that message. Mind trying again?"
        : "I can't help with that. I'm built for science curiosity, though — want to ask about something else?"

      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: refusal,
          is_flagged: !classifierErrored,
        })
      }

      return NextResponse.json({ answer: refusal, flagged: !classifierErrored })
    }

    // Build conversation history for Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    // Convert history to Gemini format; drop leading model turns because
    // startChat() requires the first entry to have role 'user'.
    const geminiHistory = (history ?? [])
      .filter((m) => m.role === 'user' || m.role === 'bot')
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }],
      }))
    while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
      geminiHistory.shift()
    }

    try {
      const chat = model.startChat({ history: geminiHistory })
      const result = await chat.sendMessage(userMessage)
      const answer = result.response.text()

      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: answer,
          is_flagged: false,
        })
      }

      return NextResponse.json({ answer, flagged: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[/api/chat] Gemini followup error:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
