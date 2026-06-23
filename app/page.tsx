'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

const VARIANTS = {
  A: {
    headline: 'Satisfy your curiosity, instantly.',
    subheadline: 'Type any question — get a clear, plain-language explanation backed by science.',
  },
  B: {
    headline: 'Understand anything in seconds.',
    subheadline: 'Ask any question and get a simple, jargon-free explanation — no textbook required.',
  },
} as const

type Variant = keyof typeof VARIANTS

const VALUE_PROPS = [
  {
    title: 'Plain-language answers',
    description: 'No jargon, no textbooks. Every explanation is written so anyone can understand it.',
  },
  {
    title: 'Science-backed',
    description: 'Answers are grounded in established science and research, not guesswork.',
  },
  {
    title: 'Instant, on demand',
    description: 'No waiting, no searching. Ask anything and get your answer in seconds.',
  },
]

function getOrCreateSession(): { sessionId: string; variant: Variant } {
  const existingId = localStorage.getItem('spark_session_id')
  const existingVariant = localStorage.getItem('spark_ab_variant') as Variant | null

  if (existingId && (existingVariant === 'A' || existingVariant === 'B')) {
    return { sessionId: existingId, variant: existingVariant }
  }

  const sessionId = existingId ?? crypto.randomUUID()
  const lastChar = sessionId.replace(/-/g, '').slice(-1)
  const variant: Variant = parseInt(lastChar, 16) % 2 === 1 ? 'B' : 'A'

  localStorage.setItem('spark_session_id', sessionId)
  localStorage.setItem('spark_ab_variant', variant)

  return { sessionId, variant }
}

async function logEvent(sessionId: string, variant: Variant, eventType: 'impression' | 'click') {
  const db = getSupabase()
  if (!db) return
  await db.from('ab_test_events').insert({ session_id: sessionId, variant, event_type: eventType })
}

export default function HomePage() {
  const router = useRouter()
  const sessionRef = useRef<{ sessionId: string; variant: Variant } | null>(null)
  const impressionLoggedRef = useRef(false)
  const [variant, setVariant] = useState<Variant>('A')

  useEffect(() => {
    const session = getOrCreateSession()
    sessionRef.current = session
    setVariant(session.variant)

    if (!impressionLoggedRef.current) {
      impressionLoggedRef.current = true
      logEvent(session.sessionId, session.variant, 'impression')
    }
  }, [])

  function handleAsk() {
    if (sessionRef.current) {
      logEvent(sessionRef.current.sessionId, sessionRef.current.variant, 'click')
    }
    router.push('/core')
  }

  const copy = VARIANTS[variant]

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="text-center mb-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{copy.headline}</h1>
        <p className="text-lg text-gray-500 mb-8">{copy.subheadline}</p>
        <button
          type="button"
          onClick={handleAsk}
          className="bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          Ask a question
        </button>
      </section>

      {/* Value props */}
      <section className="mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{prop.title}</h3>
              <p className="text-sm text-gray-500">{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation cards */}
      <section className="flex flex-col gap-4">
        <Link
          href="/research"
          className="flex items-center justify-between border border-gray-200 rounded-lg px-6 py-5 hover:bg-gray-50 group"
        >
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Product research
            </p>
            <p className="font-semibold text-gray-900">See the Research →</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Competitive landscape, global benchmarks, and risk analysis
            </p>
          </div>
        </Link>
        <Link
          href="/pricing"
          className="flex items-center justify-between border border-gray-200 rounded-lg px-6 py-5 hover:bg-gray-50 group"
        >
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Product &amp; pricing
            </p>
            <p className="font-semibold text-gray-900">See Pricing →</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Tiers, features, and a live revenue simulator
            </p>
          </div>
        </Link>
        <Link
          href="/marketing"
          className="flex items-center justify-between border border-gray-200 rounded-lg px-6 py-5 hover:bg-gray-50 group"
        >
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Marketing
            </p>
            <p className="font-semibold text-gray-900">Brand &amp; Content →</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Brand system, personas, content bank, and A/B test results
            </p>
          </div>
        </Link>
      </section>
    </div>
  )
}
