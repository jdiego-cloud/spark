'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

type AssetType = 'social_post' | 'video_script' | 'calendar_entry' | 'persona' | 'brand_note'

type MarketingAsset = {
  id: string
  type: AssetType
  content: string
  platform: string | null
  day_number: number | null
  created_at: string
}

type ABEvent = {
  variant: string
  event_type: string
}

type ABCounts = {
  A: { impressions: number; clicks: number }
  B: { impressions: number; clicks: number }
}

function normalizeNewlines(text: string) {
  return text.replace(/\\n/g, '\n')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (e.g. HTTP without focus)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs font-medium text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function MarketingPage() {
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [abCounts, setABCounts] = useState<ABCounts>({
    A: { impressions: 0, clicks: 0 },
    B: { impressions: 0, clicks: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const db = getSupabase()
      if (!db) {
        setLoading(false)
        return
      }

      const [assetsRes, eventsRes] = await Promise.all([
        db.from('marketing_assets').select('*').order('day_number', { ascending: true }),
        db.from('ab_test_events').select('variant, event_type'),
      ])

      if (assetsRes.data) setAssets(assetsRes.data)

      if (eventsRes.data) {
        const counts: ABCounts = { A: { impressions: 0, clicks: 0 }, B: { impressions: 0, clicks: 0 } }
        for (const row of eventsRes.data as ABEvent[]) {
          const v = row.variant as 'A' | 'B'
          if (v !== 'A' && v !== 'B') continue
          if (row.event_type === 'impression') counts[v].impressions++
          else if (row.event_type === 'click') counts[v].clicks++
        }
        setABCounts(counts)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const byType = (type: AssetType) => assets.filter((a) => a.type === type)

  const brandNotes = byType('brand_note')
  const personas = byType('persona')
  const socialPosts = byType('social_post')
  const videoScripts = byType('video_script')
  const calendarEntries = byType('calendar_entry').sort(
    (a, b) => (a.day_number ?? 0) - (b.day_number ?? 0),
  )

  function ctr(impressions: number, clicks: number) {
    if (impressions === 0) return '—'
    return ((clicks / impressions) * 100).toFixed(1) + '%'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
        <p className="text-gray-500 text-sm">
          Brand system, personas, content bank, and A/B test results.
        </p>
      </header>

      {/* Brand voice */}
      {brandNotes.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Brand voice</h2>
          <div className="space-y-4">
            {brandNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {normalizeNewlines(note.content)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Personas */}
      {personas.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Target personas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {personas.map((persona) => (
              <div key={persona.id} className="border border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {normalizeNewlines(persona.content)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Social posts */}
      {socialPosts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Social posts</h2>
          <div className="space-y-4">
            {socialPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  {post.platform && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      {post.platform}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {normalizeNewlines(post.content)}
                  </p>
                </div>
                <CopyButton text={post.content} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video scripts */}
      {videoScripts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Video scripts</h2>
          <div className="space-y-4">
            {videoScripts.map((script) => (
              <div key={script.id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  {script.platform && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      {script.platform}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {normalizeNewlines(script.content)}
                  </p>
                </div>
                <CopyButton text={script.content} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 14-day calendar */}
      {calendarEntries.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">14-day content calendar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {calendarEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Day {entry.day_number}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {normalizeNewlines(entry.content)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* A/B test results */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">A/B test results</h2>
        <p className="text-sm text-gray-500 mb-6">Hero headline experiment — homepage impressions and CTA clicks.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(['A', 'B'] as const).map((v) => (
            <div key={v} className="border border-gray-200 rounded-lg p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Variant {v}
              </p>
              <dl className="space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Impressions</dt>
                  <dd className="font-semibold text-gray-900">{abCounts[v].impressions}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">Clicks</dt>
                  <dd className="font-semibold text-gray-900">{abCounts[v].clicks}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">CTR</dt>
                  <dd className="font-semibold text-gray-900">
                    {ctr(abCounts[v].impressions, abCounts[v].clicks)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
