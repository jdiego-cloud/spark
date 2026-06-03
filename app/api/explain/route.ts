import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/explain
 *
 * Accepts { question: string } and returns a plain-language scientific
 * explanation from an AI model.
 *
 * ── BILINGUAL BEHAVIOUR ────────────────────────────────────────────────────
 * The system prompt instructs the model to respond in the same language the
 * user writes in.  No UI toggle or language setting is needed — if the user
 * types in Spanish they get a Spanish explanation; if they type in English
 * they get an English explanation.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * STATUS: stub — model call is not yet wired up.
 * Replace the TODO block below with your chosen SDK (OpenAI, Anthropic, etc.)
 * The system prompt and request shape are already production-ready.
 */

export const SYSTEM_PROMPT = `You are Spark, a science communicator who explains \
complex topics in clear, plain language for curious non-experts.

Rules:
- Keep explanations concise: 3–5 short paragraphs.
- Avoid jargon; if a technical term is unavoidable, define it immediately.
- Use a friendly, encouraging tone.
- Respond in the same language the user writes in. If the user writes in \
Spanish, respond entirely in Spanish. If they write in English, respond in \
English. Follow this rule for any language.
- Do not invent facts. If you are uncertain, say so.`

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const question: string = body?.question?.trim() ?? ''

  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  // TODO: replace this block with the real model call, e.g.:
  //
  // import OpenAI from 'openai'
  // const openai = new OpenAI()
  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-4o-mini',
  //   messages: [
  //     { role: 'system', content: SYSTEM_PROMPT },
  //     { role: 'user',   content: question },
  //   ],
  // })
  // const answer = completion.choices[0].message.content
  // return NextResponse.json({ answer })

  return NextResponse.json(
    {
      error: 'AI model not yet connected. See app/api/explain/route.ts for instructions.',
    },
    { status: 501 },
  )
}
