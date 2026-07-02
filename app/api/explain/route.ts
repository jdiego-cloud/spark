import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const SYSTEM_PROMPT = `You are Spark, a science explanation assistant. Your job is to answer any curiosity in plain, simple language that anyone can understand. Avoid jargon.

IMPORTANT: You MUST respond ONLY with a valid JSON object in exactly this format, with no markdown, no code blocks, no extra text before or after:
{"explanation":"...","analogy":"...","confidence_level":"high","confidence_reason":"...","language":"en"}

Rules:
- explanation: plain-language explanation, 3 to 5 sentences maximum
- analogy: a concrete everyday analogy that makes the concept click (1-2 sentences)
- confidence_level: exactly one of "high", "medium", or "low" — high if well-established science, medium if nuanced or context-dependent, low if speculative or actively debated
- confidence_reason: a short phrase (under 15 words) explaining why you chose that confidence level
- language: detect the language of the user's question — "en" for English, "es" for Spanish
- Respond in the same language the user writes in`

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type ResponseLanguage = 'en' | 'es'

export type StructuredAnswer = {
  explanation: string
  analogy: string
  confidence_level: ConfidenceLevel
  confidence_reason: string
  language: ResponseLanguage
}

export function parseStructuredAnswer(raw: string): StructuredAnswer {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    if (
      typeof parsed.explanation === 'string' &&
      typeof parsed.analogy === 'string' &&
      ['high', 'medium', 'low'].includes(parsed.confidence_level) &&
      typeof parsed.confidence_reason === 'string'
    ) {
      return {
        ...parsed,
        language: ['en', 'es'].includes(parsed.language) ? parsed.language : 'en',
      } as StructuredAnswer
    }
  } catch {
    // fall through to fallback
  }
  return {
    explanation: raw,
    analogy: '',
    confidence_level: 'medium',
    confidence_reason: '',
    language: 'en',
  }
}

export async function POST(request: NextRequest) {
  let body: { question?: string } | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const question: string = body?.question?.trim() ?? ''
  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent(question)
    const raw = result.response.text()
    const structured = parseStructuredAnswer(raw)

    return NextResponse.json(structured)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/explain] Gemini error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
