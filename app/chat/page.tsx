'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

type Message = {
  id: string
  role: 'bot' | 'user'
  content: string
  isMainExplanation?: boolean
}

const INTAKE_QUESTIONS = [
  "What's something you've been curious about lately?",
  'What part of it is confusing or unclear?',
  'Quick answer or the full explanation?',
]

// Inline ThumbsUp/Down SVG icons — no external deps needed
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

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [intakeStep, setIntakeStep] = useState(0) // 0: waiting for Q1 answer, 1: Q2, 2: Q3, 3: done
  const [intakeAnswers, setIntakeAnswers] = useState<string[]>([])
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [mainExplMsgId, setMainExplMsgId] = useState<string | null>(null)
  // history for Gemini context: only bot explanation messages + user followups
  const geminiHistory = useRef<{ role: 'user' | 'bot'; content: string }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize session
  useEffect(() => {
    const KEY = 'spark_chat_session'
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    setSessionId(id)

    // Show first intake question
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'bot',
        content: INTAKE_QUESTIONS[0],
      },
    ])
  }, [])

  // Scroll to bottom on new messages
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

    // Add user bubble
    addMessage({ role: 'user', content: text })
    await saveUserMessage(text)

    if (intakeStep < 3) {
      // Still in intake flow
      const newAnswers = [...intakeAnswers, text]
      setIntakeAnswers(newAnswers)
      const nextStep = intakeStep + 1

      if (nextStep < 3) {
        // Show next intake question
        addMessage({ role: 'bot', content: INTAKE_QUESTIONS[nextStep] })
        setIntakeStep(nextStep)
        setLoading(false)
      } else {
        // All 3 answers collected — call intake API
        setIntakeStep(3)
        const [topic, confusion, depth] = newAnswers
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'intake',
              sessionId,
              topic,
              confusion,
              depth,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
          const botMsg = addMessage({
            role: 'bot',
            content: data.answer,
            isMainExplanation: !data.flagged,
          })
          if (!data.flagged) {
            setMainExplMsgId(botMsg.id)
            // Seed Gemini history with the explanation
            geminiHistory.current = [{ role: 'bot', content: data.answer }]
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
      // Follow-up turn
      geminiHistory.current = [...geminiHistory.current, { role: 'user', content: text }]
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'followup',
            sessionId,
            history: geminiHistory.current,
            userMessage: text,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
        addMessage({ role: 'bot', content: data.answer })
        if (!data.flagged) {
          geminiHistory.current = [
            ...geminiHistory.current,
            { role: 'bot', content: data.answer },
          ]
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
      await db
        .from('chat_sessions')
        .update({ rating: newRating })
        .eq('session_id', sessionId)
    },
    [rating, sessionId],
  )

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="py-4 border-b border-gray-100 shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Spark Chat</h1>
        <p className="text-xs text-gray-400">Ask anything you&apos;re curious about</p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div
                className={
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed'
                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed'
                }
              >
                {msg.content}
              </div>

              {/* Thumbs — only on the main explanation message */}
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

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
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
