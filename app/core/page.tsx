'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import type { StructuredAnswer, ResponseLanguage } from '@/app/api/explain/route'

type SavedOutput = {
  id: string
  created_at: string
  question: string
  answer: string
  analogy: string | null
  confidence_level: string | null
  confidence_reason: string | null
  response_language: string | null
}

const LABELS = {
  en: { simple: 'In plain terms', analogy: "Here's an analogy", confidence: 'Confidence level', high: 'High', medium: 'Medium', low: 'Low' },
  es: { simple: 'En simple', analogy: 'Piénsalo así', confidence: 'Qué tan seguro estoy', high: 'Alta', medium: 'Media', low: 'Baja' },
} as const

function getLang(lang: string | null | undefined): ResponseLanguage {
  return lang === 'es' ? 'es' : 'en'
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: 'bg-gray-800',
  medium: 'bg-gray-400',
  low: 'bg-gray-300',
  // legacy Spanish values
  Alta: 'bg-gray-800',
  Media: 'bg-gray-400',
  Baja: 'bg-gray-300',
}

function ConfidenceDot({ level }: { level: string }) {
  const color = CONFIDENCE_DOT[level] ?? 'bg-gray-300'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5 shrink-0 mt-0.5`} />
}

function getConfidenceLabel(level: string, lang: ResponseLanguage): string {
  const l = level.toLowerCase()
  const labels = LABELS[lang]
  if (l === 'high' || l === 'alta') return labels.high
  if (l === 'medium' || l === 'media') return labels.medium
  if (l === 'low' || l === 'baja') return labels.low
  return level
}

function StructuredBlock({ data }: { data: StructuredAnswer }) {
  const labels = LABELS[data.language ?? 'en']
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{labels.simple}</p>
        <p className="text-sm text-gray-800 leading-relaxed">{data.explanation}</p>
      </div>
      {data.analogy && (
        <div className="border-l-2 border-gray-200 pl-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{labels.analogy}</p>
          <p className="text-sm text-gray-600 leading-relaxed italic">{data.analogy}</p>
        </div>
      )}
      {data.confidence_level && (
        <div className="flex items-start gap-1 pt-1">
          <ConfidenceDot level={data.confidence_level} />
          <div>
            <span className="text-xs font-semibold text-gray-500">{labels.confidence}: </span>
            <span className="text-xs font-bold text-gray-700">{getConfidenceLabel(data.confidence_level, data.language ?? 'en')}</span>
            {data.confidence_reason && (
              <span className="text-xs text-gray-400"> — {data.confidence_reason}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CorePageInner() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState(() => searchParams.get('q') ?? '')
  const [structured, setStructured] = useState<StructuredAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recentOutputs, setRecentOutputs] = useState<SavedOutput[]>([])

  const fetchRecent = useCallback(async () => {
    const db = getSupabase()
    if (!db) return
    const { data } = await db
      .from('core_outputs')
      .select('id, created_at, question, answer, analogy, confidence_level, confidence_reason, response_language')
      .order('created_at', { ascending: false })
      .limit(6)
    if (data) setRecentOutputs(data)
  }, [])

  useEffect(() => {
    fetchRecent()
  }, [fetchRecent])

  async function handleAsk() {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setStructured(null)
    setSaved(false)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setStructured({
        explanation: data.explanation ?? data.answer ?? '',
        analogy: data.analogy ?? '',
        confidence_level: data.confidence_level ?? 'medium',
        confidence_reason: data.confidence_reason ?? '',
        language: data.language ?? 'en',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const db = getSupabase()
    if (!db || !structured) {
      setError('Supabase is not configured')
      return
    }
    setSaving(true)
    const { error: dbError } = await db.from('core_outputs').insert({
      question,
      answer: structured.explanation,
      analogy: structured.analogy || null,
      confidence_level: structured.confidence_level,
      confidence_reason: structured.confidence_reason,
      response_language: structured.language,
    })
    setSaving(false)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setSaved(true)
    await fetchRecent()
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Spark Core</h1>
        <p className="text-gray-500 text-sm">
          The generative engine behind Spark. Type any curiosity and get a plain-language scientific explanation powered by Google Gemini.
        </p>
      </header>

      {/* Intake form */}
      <section className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleAsk()}
            placeholder="What are you curious about?"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="button"
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {/* Output card */}
      {structured && (
        <section className="mb-12 border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Question</p>
          <p className="text-sm font-semibold text-gray-900 mb-5">{question}</p>

          <StructuredBlock data={structured} />

          <div className="mt-6">
            {saved ? (
              <p className="text-sm text-green-600 font-medium">Saved to your library.</p>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save to my library'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Spark Library */}
      {recentOutputs.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Your Spark Library</h2>
            <span className="text-xs text-gray-400">{recentOutputs.length} saved</span>
          </div>
          <div className="grid gap-4">
            {recentOutputs.map((item) => {
              const lang = getLang(item.response_language)
              return (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-xl p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.question}</p>
                    <time className="text-xs text-gray-300 shrink-0 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                  </div>

                  {item.analogy ? (
                    <p className="text-xs text-gray-500 italic leading-relaxed border-l-2 border-gray-100 pl-3 mb-3">
                      {item.analogy}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{item.answer}</p>
                  )}

                  {item.confidence_level && (
                    <div className="flex items-center">
                      <ConfidenceDot level={item.confidence_level} />
                      <span className="text-xs text-gray-400">
                        {getConfidenceLabel(item.confidence_level, lang)}
                        {item.confidence_reason ? ` — ${item.confidence_reason}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default function CorePage() {
  return (
    <Suspense>
      <CorePageInner />
    </Suspense>
  )
}
