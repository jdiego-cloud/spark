import type { Metadata } from 'next'
import CompetitorTable from '@/components/CompetitorTable'
import { benchmarks } from '@/data/benchmarks'
import { risks } from '@/data/risks'
import { getSupabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Research — Spark',
  description: 'Competitive research, global benchmarks, and risk analysis for Spark.',
}

// Force dynamic so the Supabase insert (added in a later step) runs on every
// request rather than being baked into the static build.
export const dynamic = 'force-dynamic'

const levelColor: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
}

export default async function ResearchPage() {
  // Log every page visit to Supabase — proves the DB write path works.
  // getSupabase() returns null when env vars are absent (e.g. during build),
  // so this is safely skipped in that case.
  try {
    const db = getSupabase()
    if (db) {
      await db
        .from('research_records')
        .insert({ page_version: 'week-2', notes: 'research page loaded' })
    }
  } catch (err) {
    console.error('[research] Supabase insert failed:', err)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">

      {/* ── Header ── */}
      <section>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Research & Benchmarking</h1>
        <p className="text-gray-500 max-w-2xl">
          This page documents the competitive landscape, global benchmarks, and
          identified risks that inform Spark&apos;s product direction. All data is
          current as of Week 2 of development.
        </p>
      </section>

      {/* ── Competitor table ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Competitor landscape</h2>
        <p className="text-sm text-gray-500 mb-6">
          8 competitors and substitutes across AI tools, media, and reference products.
        </p>
        <CompetitorTable />
      </section>

      {/* ── Global benchmark cards ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Global benchmarks</h2>
        <p className="text-sm text-gray-500 mb-6">
          Similar products from other markets — what they get right and the gap they leave.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benchmarks.map((b) => (
            <div key={b.product} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900">{b.product}</h3>
                <span className="shrink-0 text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5">
                  {b.country}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium text-gray-700">Does well: </span>
                {b.doesWell}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Gap: </span>
                {b.gap}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mexico / Spanish-language section ── */}
      <section className="border border-gray-200 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          The Spanish-language science gap
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Spanish is the second most-spoken native language on earth, yet the
            overwhelming majority of high-quality science communication is produced
            in English. Tools like Kurzgesagt, Radiolab, and most AI explanation
            products are English-first — Spanish speakers are left with translated
            leftovers or institutional portals that assume an academic reader.
          </p>
          <p>
            In Mexico specifically, UNAM and CONACYT produce rigorous content, but
            it stays inside academic circles. General-audience science in Mexican
            Spanish — informal, clear, culturally grounded — is essentially absent
            from on-demand digital products.
          </p>
          <p>
            <span className="font-medium text-gray-900">How Spark handles this: </span>
            Spark detects the language of the user&apos;s question and responds in
            that same language. No toggle, no settings menu. If you type in Spanish,
            you get a Spanish explanation. If you switch mid-session, Spark follows.
            This is a deliberate product decision, not an afterthought.
          </p>
        </div>
      </section>

      {/* ── Risk map ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Risk map</h2>
        <p className="text-sm text-gray-500 mb-6">
          Five risks identified for Spark, rated by likelihood and impact.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {risks.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-5">
              <p className="text-sm font-medium text-gray-900 mb-3">{r.description}</p>
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelColor[r.likelihood]}`}>
                  Likelihood: {r.likelihood}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelColor[r.impact]}`}>
                  Impact: {r.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
