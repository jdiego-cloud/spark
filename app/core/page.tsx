'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

type SavedOutput = {
  id: string
  created_at: string
  question: string
  answer: string
}

function CorePageInner() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState(() => searchParams.get('q') ?? '')
  const [answer, setAnswer] = useState('')
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
      .select('id, created_at, question, answer')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setRecentOutputs(data)
  }, [])

  useEffect(() => {
    fetchRecent()
  }, [fetchRecent])

  async function handleAsk() {
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')
    setSaved(false)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setAnswer(data.answer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const db = getSupabase()
    if (!db) {
      setError('Supabase is not configured')
      return
    }
    setSaving(true)
    const { error: dbError } = await db
      .from('core_outputs')
      .insert({ question, answer })
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
      {answer && (
        <section className="mb-12 border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Question</p>
          <p className="text-sm font-semibold text-gray-900 mb-4">{question}</p>

          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
          <p className="text-sm text-gray-700 leading-relaxed mb-6">{answer}</p>

          {saved ? (
            <p className="text-sm text-green-600 font-medium">Saved successfully.</p>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </section>
      )}

      {/* Dashboard preview */}
      {recentOutputs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Recent saves
          </h2>
          <div className="flex flex-col gap-4">
            {recentOutputs.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-gray-900 mb-1">{item.question}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
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
