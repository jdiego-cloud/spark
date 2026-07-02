'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

type ResponseLanguage = 'en' | 'es'

type StructuredAnswer = {
  explanation: string
  analogy?: string
  confidence_level?: string
  confidence_reason?: string
  language?: ResponseLanguage
}

const LABELS = {
  en: { analogy: "Here's an analogy", confidence: 'Confidence level', high: 'High', medium: 'Medium', low: 'Low' },
  es: { analogy: 'Piénsalo así', confidence: 'Qué tan seguro estoy', high: 'Alta', medium: 'Media', low: 'Baja' },
} as const

function getLang(lang: string | null | undefined): ResponseLanguage {
  return lang === 'es' ? 'es' : 'en'
}

function getConfidenceLabel(level: string, lang: ResponseLanguage): string {
  const l = level.toLowerCase()
  const labels = LABELS[lang]
  if (l === 'high' || l === 'alta') return labels.high
  if (l === 'medium' || l === 'media') return labels.medium
  if (l === 'low' || l === 'baja') return labels.low
  return level
}

type Message = {
  id: string
  role: 'bot' | 'user'
  content: string
  structured?: StructuredAnswer
  isMainExplanation?: boolean
}

const INTAKE_QUESTIONS = [
  "What's something you've been curious about lately?",
  'What part of it is confusing or unclear?',
  'Quick answer or the full explanation?',
]

function ThumbsUp({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function ThumbsDown({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  )
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: 'bg-gray-700',
  medium: 'bg-gray-400',
  low: 'bg-gray-300',
  Alta: 'bg-gray-700',
  Media: 'bg-gray-400',
  Baja: 'bg-gray-300',
}

function StructuredBotBubble({ data }: { data: StructuredAnswer }) {
  const lang = getLang(data.language)
  const labels = LABELS[lang]
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-900">
      <p>{data.explanation}</p>
      {data.analogy && (
        <div className="border-l-2 border-gray-300 pl-3 text-gray-600 italic text-xs leading-relaxed">
          <span className="not-italic font-semibold text-gray-400 uppercase text-[10px] tracking-wide block mb-0.5">{labels.analogy}</span>
          {data.analogy}
        </div>
      )}
      {data.confidence_level && (
        <div className="flex items-center gap-1.5 pt-1">
          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${CONFIDENCE_DOT[data.confidence_level] ?? 'bg-gray-300'}`} />
          <span className="text-[11px] text-gray-400">
            <span className="font-semibold text-gray-500">{labels.confidence}: {getConfidenceLabel(data.confidence_level, lang)}</span>
            {data.confidence_reason ? ` — ${data.confidence_reason}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [intakeStep, setIntakeStep] = useState(0)
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([])
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [mainExplMsgId, setMainExplMsgId] = useState<string | null>(null)
  const geminiHistory = useRef<{ role: 'user' | 'bot'; content: string }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const KEY = 'spark_chat_session'
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    setSessionId(id)

    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'bot',
        content: INTAKE_QUESTIONS[0],
      },
    ])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    const full: Message = { id: crypto.randomUUID(), ...msg }
    setMessages((prev) => [...prev, full])
    return full
  }, [])

  const saveUserMessage = useCallback(
    async (content: string, isFlagged = false) => {
      const db = getSupabase()
      if (!db || !sessionId) return
      await db.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content,
        is_flagged: isFlagged,
      })
    },
    [sessionId],
  )

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)

    addMessage({ role: 'user', content: text })
    await saveUserMessage(text)

    if (intakeStep < 3) {
      const newAnswers = [...intakeAnswers, text]
      setIntakeAnswers(newAnswers)
      const nextStep = intakeStep + 1

      if (nextStep < 3) {
        addMessage({ role: 'bot', content: INTAKE_QUESTIONS[nextStep] })
        setIntakeStep(nextStep)
        setLoading(false)
      } else {
        setIntakeStep(3)
        const [topic, confusion, depth] = newAnswers
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'intake', sessionId, topic, confusion, depth }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Something went wrong')

          const explanation = data.explanation ?? data.answer ?? ''
          const structured: StructuredAnswer | undefined = data.explanation
            ? { explanation: data.explanation, analogy: data.analogy, confidence_level: data.confidence_level, confidence_reason: data.confidence_reason, language: data.language ?? 'en' }
            : undefined

          const botMsg = addMessage({
            role: 'bot',
            content: explanation,
            structured,
            isMainExplanation: !data.flagged,
          })
          if (!data.flagged) {
            setMainExplMsgId(botMsg.id)
            geminiHistory.current = [{ role: 'bot', content: explanation }]
          }
        } catch (err) {
          addMessage({
            role: 'bot',
            content: err instanceof Error ? err.message : 'Something went wrong.',
          })
        } finally {
          setLoading(false)
        }
      }
    } else {
      geminiHistory.current = [...geminiHistory.current, { role: 'user', content: text }]
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'followup', sessionId, history: geminiHistory.current, userMessage: text }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Something went wrong')

        const explanation = data.explanation ?? data.answer ?? ''
        const structured: StructuredAnswer | undefined = data.explanation
          ? { explanation: data.explanation, analogy: data.analogy, confidence_level: data.confidence_level, confidence_reason: data.confidence_reason }
          : undefined

        addMessage({ role: 'bot', content: explanation, structured })
        if (!data.flagged) {
          geminiHistory.current = [...geminiHistory.current, { role: 'bot', content: explanation }]
        }
      } catch (err) {
        addMessage({
          role: 'bot',
          content: err instanceof Error ? err.message : 'Something went wrong.',
        })
      } finally {
        setLoading(false)
      }
    }

    inputRef.current?.focus()
  }, [input, loading, intakeStep, intakeAnswers, sessionId, addMessage, saveUserMessage])

  const handleRating = useCallback(
    async (value: 'up' | 'down') => {
      const newRating = rating === value ? null : value
      setRating(newRating)
      const db = getSupabase()
      if (!db || !sessionId) return
      await db.from('chat_sessions').update({ rating: newRating }).eq('session_id', sessionId)
    },
    [rating, sessionId],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto px-4">
      <div className="py-4 border-b border-gray-100 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Spark Chat</h1>
        <p className="text-xs text-gray-400">Ask anything you&apos;re curious about</p>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              {msg.role === 'user' ? (
                <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : msg.structured ? (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4">
                  <StructuredBotBubble data={msg.structured} />
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
                  {msg.content}
                </div>
              )}

              {msg.isMainExplanation && msg.id === mainExplMsgId && (
                <div className="flex gap-2 mt-2 pl-1">
                  <button
                    type="button"
                    onClick={() => handleRating('up')}
                    className={`p-1 rounded transition-colors ${
                      rating === 'up' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp filled={rating === 'up'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRating('down')}
                    className={`p-1 rounded transition-colors ${
                      rating === 'down' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown filled={rating === 'down'} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-gray-100 py-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your answer…"
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
