import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const SYSTEM_PROMPT =
  'You are Spark, a science explanation assistant. Your job is to answer any curiosity in plain, simple language that anyone can understand. Avoid jargon. Keep answers concise — 3 to 5 sentences maximum. Respond in the same language the user writes in.'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const question: string = body?.question?.trim() ?? ''

  if (!question) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  })

  const result = await model.generateContent(question)
  const answer = result.response.text()

  return NextResponse.json({ answer })
}
