// ALTER TABLE chat_sessions ADD COLUMN was_flagged boolean NOT NULL DEFAULT false;
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSupabase } from '@/lib/supabase'
import { parseStructuredAnswer } from '@/app/api/explain/route'

const SYSTEM_PROMPT = `You are Spark, a curiosity assistant. Explain things clearly in plain language anyone can understand. Avoid jargon.

IMPORTANT: You MUST respond ONLY with a valid JSON object in exactly this format, with no markdown, no code blocks, no extra text before or after:
{"explanation":"...","analogy":"...","confidence_level":"high","confidence_reason":"...","language":"en"}

Rules:
- explanation: clear focused explanation, 4 to 7 sentences
- analogy: a concrete everyday analogy that makes the concept click (1-2 sentences)
- confidence_level: exactly one of "high", "medium", or "low" — high if well-established science, medium if nuanced or context-dependent, low if speculative or actively debated
- confidence_reason: a short phrase (under 15 words) explaining why you chose that confidence level
- language: detect the language of the user's question — "en" for English, "es" for Spanish
- Respond in the same language the user writes in`

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

const QUICK_KEYWORDS = ['quick', 'short', 'brief', 'fast', 'rápido', 'rapido', 'corta', 'corto', 'breve', 'resumida', 'resumido']
function isQuickAnswer(depth: string): boolean {
  const lower = depth.toLowerCase()
  return QUICK_KEYWORDS.some(kw => lower.includes(kw))
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
        await db.from('chat_sessions').insert({
          session_id: sessionId,
          intake_topic: topic,
          intake_confusion: confusion,
          intake_depth: depth,
          was_flagged: true,
        })
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: refusal,
          is_flagged: !classifierErrored,
        })
      }

      return NextResponse.json({ answer: refusal, flagged: !classifierErrored })
    }

    const prompt = `A curious person wants to understand: "${topic}". The part that's confusing or unclear to them is: "${confusion}". They want: ${isQuickAnswer(depth) ? 'a brief, quick answer' : 'a full, thorough explanation'}. Please explain this clearly.`

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      })
      const result = await model.generateContent(prompt)
      const raw = result.response.text()
      const structured = parseStructuredAnswer(raw)

      if (db) {
        await db.from('chat_sessions').insert({
          session_id: sessionId,
          intake_topic: topic,
          intake_confusion: confusion,
          intake_depth: depth,
          was_flagged: false,
        })
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: structured.explanation,
          is_flagged: false,
          analogy: structured.analogy || null,
          confidence_level: structured.confidence_level,
          confidence_reason: structured.confidence_reason,
          response_language: structured.language,
        })
      }

      return NextResponse.json({ ...structured, flagged: false })
    } catch (err) {
      const fallback = 'Something went wrong generating that explanation. Please try again in a moment.'
      console.error('[/api/chat] Gemini intake error:', err)
      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: fallback,
          is_flagged: false,
        })
      }
      return NextResponse.json({ answer: fallback, flagged: false })
    }
  }

  if (type === 'followup') {
    const { history, userMessage } = body ?? {}
    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
    }

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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

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
      const raw = result.response.text()
      const structured = parseStructuredAnswer(raw)

      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: structured.explanation,
          is_flagged: false,
          analogy: structured.analogy || null,
          confidence_level: structured.confidence_level,
          confidence_reason: structured.confidence_reason,
          response_language: structured.language,
        })
      }

      return NextResponse.json({ ...structured, flagged: false })
    } catch (err) {
      const fallback = 'Something went wrong generating that explanation. Please try again in a moment.'
      console.error('[/api/chat] Gemini followup error:', err)
      if (db) {
        await db.from('chat_messages').insert({
          session_id: sessionId,
          role: 'bot',
          content: fallback,
          is_flagged: false,
        })
      }
      return NextResponse.json({ answer: fallback, flagged: false })
    }
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
