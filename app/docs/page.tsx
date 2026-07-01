'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

const SECTIONS = [
  { id: 'agent-map', label: 'Agent Map' },
  { id: 'prompt-library', label: 'Prompt Library' },
  { id: 'build-logs', label: 'Build Logs' },
  { id: 'testing', label: 'Testing Summary' },
  { id: 'roadmap', label: 'Roadmap V2' },
]

const AGENTS = [
  {
    name: 'Gemini 2.5 Flash',
    role: 'Science explanation engine',
    where: '/core, /chat',
    how: 'Called server-side from /api/explain and /api/chat route handlers using the @google/generative-ai SDK. Never exposed to the client.',
    notes: 'Free tier. Responds in the same language the user writes in. Capped at 3–5 sentences per answer.',
  },
  {
    name: 'Claude Code',
    role: 'Implementation agent',
    where: 'Terminal (local + Vercel CI)',
    how: 'Run from the developer\'s terminal via the Claude Code CLI. Reads and writes files, runs builds, and commits code based on prompts in each weekly packet.',
    notes: 'Not part of the deployed product. Used exclusively as a development tool across all 6 weeks.',
  },
  {
    name: 'Guardrail classifier — Phase 1',
    role: 'Intent detection',
    where: '/chat (server-side)',
    how: 'First pass of the two-phase guardrail inside /api/chat. Detects whether the user\'s message targets a sensitive topic (medical, legal, harmful content). Uses keyword matching and Gemini to flag intent.',
    notes: 'Fail-closed: if flagged, the request does not proceed to the explanation model.',
  },
  {
    name: 'Guardrail classifier — Phase 2',
    role: 'Explanation + safe response',
    where: '/chat (server-side)',
    how: 'Triggered only when Phase 1 flags a message. Generates a brief, safe explanation of why the topic is out of scope and suggests how the user can rephrase.',
    notes: 'Prevents raw model errors from leaking to the UI. Was_flagged column written to chat_sessions in Supabase.',
  },
]

const BUILD_LOGS = [
  {
    week: 'Week 0',
    title: 'Scaffolding & placeholders',
    built: 'Next.js 14 App Router project, Tailwind, Vercel deployment, placeholder pages for all routes (/core, /research, /product, /pricing, /marketing, /docs).',
    cuts: '—',
  },
  {
    week: 'Week 1',
    title: 'Core product — science explanation',
    built: '/core page with Gemini 1.5 Flash (now 2.5 Flash) connected via /api/explain. Grayscale design system established.',
    cuts: 'Voice input, image upload, follow-up questions — cut to stay focused on text Q&A.',
  },
  {
    week: 'Week 2',
    title: 'Research & market pages',
    built: '/research with competitive landscape data; /product with feature roadmap and positioning.',
    cuts: 'Live data feeds, external API integrations — cut to avoid runtime dependencies.',
  },
  {
    week: 'Week 3',
    title: 'Pricing & marketing',
    built: '/pricing with tiered model and revenue simulator; /marketing with brand system and A/B test results.',
    cuts: 'Real payment flow (Stripe) — cut; scope limited to static pricing display.',
  },
  {
    week: 'Week 4',
    title: 'Chat assistant & guardrails',
    built: '/chat guided assistant with Gemini-powered responses, two-phase guardrail (intent detection + safe explanation), bilingual keyword matching, chat_sessions table in Supabase with was_flagged column.',
    cuts: 'Persistent conversation history per user, semantic search over prior sessions — cut; sessions stored but not surfaced in UI.',
  },
  {
    week: 'Week 5',
    title: 'Dashboard & auth',
    built: '/dashboard with Supabase Auth login gate (password-only, no email OTP), table summary cards (row counts + recent records). /demo guided walkthrough of all pages.',
    cuts: 'Full RLS policies, user roles, invite-only access — cut; single shared password for demo access.',
  },
  {
    week: 'Week 6',
    title: 'Docs consolidation & impact review',
    built: '/docs rewritten with Agent Map, Prompt Library, Build Logs, Testing Summary, and Roadmap V2. /demo Impact Check section added.',
    cuts: 'Sub-routes for each doc section — kept as single page with anchor nav.',
  },
]

const INTERNAL_TESTS = [
  { test: 'Login with correct password', result: 'Pass', notes: 'Redirects to /dashboard table view' },
  { test: 'Login with wrong password', result: 'Pass', notes: 'Shows error, no redirect' },
  { test: 'Logout from /dashboard', result: 'Pass', notes: 'Session cleared, redirect to /dashboard login' },
  { test: '/core — science question answered', result: 'Pass', notes: 'Gemini returns explanation in <2 s' },
  { test: '/chat — normal question', result: 'Pass', notes: 'Guided assistant responds correctly' },
  { test: '/chat — flagged medical question', result: 'Pass', notes: 'Phase 1 + 2 guardrail fires, was_flagged=true in DB' },
  { test: '/demo — all 8 cards link to live pages', result: 'Pass', notes: 'No 404s' },
]

const ROADMAP = [
  {
    item: 'Full email-based auth (magic link / OTP)',
    reason: 'Supabase email auth requires SMTP configuration and a verified domain. Cut to avoid production email setup in a 6-week prototype.',
    priority: 'High',
  },
  {
    item: 'Row-Level Security (RLS) on all tables',
    reason: 'RLS policies require per-user identity. Deferred because the current auth model uses a shared password with no per-user rows.',
    priority: 'High',
  },
  {
    item: 'User roles (admin / viewer / guest)',
    reason: 'Depends on full auth. Without distinct user identities, roles have no surface to attach to.',
    priority: 'Medium',
  },
  {
    item: 'Persistent chat history per user',
    reason: 'Sessions are stored in Supabase (chat_sessions) but not surfaced. Requires auth + RLS to show only the right user\'s history.',
    priority: 'Medium',
  },
  {
    item: 'Visual redesign / dark mode',
    reason: 'Grayscale system works for prototype validation. A polished visual identity is a post-PMF investment.',
    priority: 'Low',
  },
  {
    item: 'Stripe payment integration',
    reason: 'Pricing page is static. Real payments require Stripe account, webhook handling, and subscription state — out of scope for a prototype.',
    priority: 'Medium',
  },
  {
    item: 'Invite-only access control',
    reason: 'Currently any user with the shared password can access /dashboard. Invite-only requires per-user auth.',
    priority: 'High',
  },
]

const PROMPT_WEEKS = [
  {
    week: 'Week 0',
    title: 'Builder Infrastructure',
    built: 'Homepage, navbar, footer, /docs placeholder, GitHub/Vercel/Supabase setup.',
    type: 'note' as const,
    content: 'Prompt not recovered. Used the standard course macro-prompt pattern: ROLE / CONTEXT / TASK / FEATURES / CONSTRAINTS / OUTPUT FORMAT with 10 sections, adapted to Setup Sprint.',
  },
  {
    week: 'Week 1',
    title: 'Generative Core Agent',
    built: '/core — question form, Gemini 2.5 Flash response, Save to core_outputs, "Recent Saves" dashboard.',
    type: 'note' as const,
    content: 'Prompt not recovered. Professor feedback: explicitly followed ROLE / CONTEXT / TASK / FEATURES / CONSTRAINTS / ACCEPTANCE CRITERIA structure. Iteration log documented 4 real problems: (1) switched from Anthropic to Gemini due to no prepaid credits; (2) iterated on model name; (3) fixed empty JSON response bug; (4) relabelled "Recent Saves" based on feedback.',
  },
  {
    week: 'Week 2',
    title: 'Research + Benchmarking Dashboard',
    built: '/research — filterable competitor table (8 rows), 5 global benchmark cards, Mexico localisation section, risk map, research_records table.',
    type: 'prompt' as const,
    content: `ROLE: You are my disciplined AI-native coding partner building on an existing Next.js 14 + Tailwind + Supabase + Vercel project called Spark.

CONTEXT: Spark is a web app where users type any curiosity and receive a plain-language scientific explanation. The app is already deployed at spark-zeta-steel.vercel.app. Supabase is connected but has no active tables yet. The stack is Next.js 14, Tailwind CSS, GitHub, Vercel, Supabase. There is already an /api/explain route stub with a bilingual system prompt.

TASK: Build the /research page and all associated features described below. Do not invent features outside this scope.

FEATURES:
- Filterable competitor table (8 rows: name, category, pricing, differentiator, weakness)
- 5 global benchmark cards (market size, growth rate, top player, avg retention, avg NPS)
- Mexico localisation section (internet penetration, smartphone usage, target segment size)
- Risk map (risk name, likelihood, impact, mitigation)
- research_records table in Supabase (id, name, category, notes, created_at)`,
  },
  {
    week: 'Week 3',
    title: 'Product Map + Pricing Simulator',
    built: '/product (feature map by tier) and /pricing (interactive revenue simulator with save to pricing_scenarios).',
    type: 'prompt' as const,
    content: `Make two small, connected changes:

1. In app/core/page.tsx: Import useSearchParams from 'next/navigation'. On mount, read the 'q' query parameter (e.g. /core?q=encoded-question). Pre-fill the 'question' state with the decoded value, without auto-submitting.

2. On the homepage: Wire the "Ask" button to navigate to /core?q=<encoded question>

LESSON APPLIED: The production build failed on Vercel because useSearchParams() without a <Suspense> boundary causes a static prerendering error (did not fail in local dev). Fixed by separating CorePageInner wrapped in <Suspense>. From this point on, npm run build locally is required before every commit.`,
  },
  {
    week: 'Week 4',
    title: 'Marketing Engine',
    built: 'Homepage A/B headline test, /marketing with brand system, personas, content bank, and test results. Tables: marketing_assets, ab_test_events.',
    type: 'prompt' as const,
    content: `ROLE: You are my coding partner implementing Week 4 of the Spark project — a Next.js app where users ask curiosity questions and get plain-language explanations.

CONTEXT: Existing stack: Next.js 14 (App Router), Tailwind CSS, Supabase, Vercel. Existing pages: / (homepage), /core, /research, /product, /pricing. Existing Supabase tables: core_outputs, research_records, pricing_scenarios. Anonymous sessions: crypto.randomUUID() + localStorage (no auth yet).

IMPORTANT LESSON FROM LAST WEEK: useSearchParams() in the App Router requires a <Suspense> boundary during static prerendering, or the Vercel build fails even though local dev works fine.

TASK: Build a marketing engine — A/B-tested hero headline on the homepage, and a new /marketing page documenting brand system, personas, content bank, and A/B test results.

FEATURES:
- Hero A/B test with impression/click logging to ab_test_events (variant A vs B, tracked by anonymous session ID)
- marketing_assets table (id, type, title, body, variant, created_at)
- /marketing page with: brand voice guide, 2 personas, 13-piece content bank, live A/B test results pulled from Supabase

NOTE: The seed content generated by the agent reintroduced already-rejected language ("cheat code", "time-poor"). The 13 final content pieces were rewritten by hand to maintain correct brand voice.`,
  },
  {
    week: 'Week 5',
    title: 'Chat Assistant + Guardrail',
    built: '/chat — guided assistant with 3 intake questions, Gemini 2.5 Flash response, two-phase guardrail (classifier + explanation), human checkpoint, thumbs up/down feedback. Tables: chat_sessions, chat_messages.',
    type: 'note' as const,
    content: `Prompt not recovered. Documenting instead the 4 real bugs fixed this week:

(1) Guardrail failed open on classifier errors — fixed to fail closed: if the classifier throws, the request is blocked, not passed through.

(2) Gemini role-order error in follow-up messages — history included an initial turn with role "model" which the API rejects. Fixed by stripping leading model-role turns from the history array.

(3) Flagged sessions never wrote a row to chat_sessions — fixed by adding the was_flagged column and ensuring the DB insert happens before the guardrail response is returned.

(4) Quick-response detection used exact string equality — broke for Spanish users. Fixed with flexible bilingual keyword matching (includes/toLowerCase).`,
  },
  {
    week: 'Week 6',
    title: 'Final Integration (Dashboard, Demo, Docs, Tester Feedback)',
    built: '/dashboard (lightweight Supabase Auth gate + table summaries), /demo (guided walkthrough + Impact Check + testimonials), /docs consolidated, tester feedback system.',
    type: 'prompt' as const,
    content: `Four prompts were used this week, documented in full as part of this week's prompt log:

PROMPT 1 — Dashboard + Auth
ROLE: You are my implementation agent for Spark (Next.js 14 App Router + Tailwind + Supabase, deployed on Vercel).
TASK: Build /dashboard with a Supabase Auth login gate (password-only, no email OTP) and table summary cards showing row counts + recent records for all existing tables (core_outputs, research_records, pricing_scenarios, marketing_assets, ab_test_events, chat_sessions, chat_messages).

PROMPT 2 — Docs Consolidation + Impact Check
ROLE: You are my implementation agent for Spark.
TASK: Rewrite /docs as a single page with tabbed nav: Agent Map, Prompt Library (placeholder), Build Logs, Testing Summary, Roadmap V2. Add an Impact Check section to /demo listing quantified outcomes from each sprint.

PROMPT 3 — Tester Feedback System
ROLE: You are my implementation agent for Spark.
TASK: Add a tester_feedback table (id, name, rating 1–5, comment, created_at). On /docs Testing Summary tab: add a star-rating form that inserts to tester_feedback and a public list of submitted reviews. On /demo: show approved testimonials.

PROMPT 4 — Prompt Library insertion (this prompt)
ROLE: You are my implementation agent for Spark. TASK: Replace the Prompt Library placeholder in /docs with the real Week 0–6 content provided, using expandable cards matching the existing grayscale style. Do not invent prompt text for weeks marked as pending — use the notes provided instead.`,
  },
]

function PromptCard({ entry }: { entry: typeof PROMPT_WEEKS[number] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-xs font-mono font-medium text-gray-400">{entry.week}</span>
            <span className="font-semibold text-gray-900 text-sm">{entry.title}</span>
          </div>
          <p className="text-xs text-gray-500">{entry.built}</p>
        </div>
        <span className="text-gray-400 text-sm mt-0.5 shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          {entry.type === 'note' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Note</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{entry.content}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prompt (extract)</p>
              <pre className="bg-gray-900 text-gray-100 text-xs rounded-md p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {entry.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type TesterFeedback = {
  id: string
  name: string | null
  rating: number
  comment: string
  created_at: string
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-2xl leading-none transition-colors ${
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${star <= value ? 'text-gray-900' : 'text-gray-300'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setError('Please select a rating (1–5 stars).')
      return
    }
    if (!comment.trim()) {
      setError('Comment is required.')
      return
    }
    setError('')
    setStatus('loading')
    const db = getSupabase()
    if (!db) {
      setStatus('error')
      setError('Database unavailable.')
      return
    }
    const { error: dbError } = await db.from('tester_feedback').insert({
      name: name.trim() || null,
      rating,
      comment: comment.trim(),
    })
    if (dbError) {
      setStatus('error')
      setError('Could not save feedback. Please try again.')
      return
    }
    setStatus('success')
    setName('')
    setRating(0)
    setComment('')
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-5 bg-gray-50 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Submit tester feedback</h3>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Name <span className="normal-case font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
          Rating <span className="text-gray-400">*</span>
        </label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
          Comment <span className="text-gray-400">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience testing Spark…"
          rows={3}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none"
        />
      </div>

      {error && <p className="text-xs text-gray-500 italic">{error}</p>}

      {status === 'success' && (
        <p className="text-xs text-gray-900 font-medium">Feedback submitted. Thank you!</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="text-sm px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}

function ExternalFeedbackList({ feedback }: { feedback: TesterFeedback[] | null }) {
  if (feedback === null) {
    return <p className="text-xs text-gray-400 italic">Loading external feedback…</p>
  }
  if (feedback.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        No external feedback yet. Submit the form above to add the first entry.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {feedback.map((f) => (
        <div key={f.id} className="border border-gray-100 rounded-lg p-4 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <StarRating value={f.rating} />
            <span className="text-xs text-gray-400">
              {new Date(f.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{f.comment}</p>
          {f.name && (
            <p className="text-xs text-gray-400">— {f.name}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function DocsPage() {
  const [active, setActive] = useState('agent-map')
  const [feedback, setFeedback] = useState<TesterFeedback[] | null>(null)

  const loadFeedback = useCallback(async () => {
    const db = getSupabase()
    if (!db) { setFeedback([]); return }
    const { data } = await db
      .from('tester_feedback')
      .select('*')
      .order('created_at', { ascending: false })
    setFeedback(data ?? [])
  }, [])

  useEffect(() => {
    if (active === 'testing') loadFeedback()
  }, [active, loadFeedback])

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Reference</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Documentation</h1>
        <p className="text-gray-500 max-w-xl">
          Technical reference for Spark — how it was built, what each agent does, and where it goes next.
        </p>
      </div>

      {/* Section nav */}
      <nav className="flex flex-wrap gap-2 mb-12 border-b border-gray-200 pb-4">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              active === s.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Agent Map */}
      {active === 'agent-map' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Agent Map</h2>
          <p className="text-sm text-gray-500 mb-6">What each AI / agent does and where it runs in the system.</p>
          <div className="space-y-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="font-semibold text-gray-900 text-sm">{a.name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{a.where}</span>
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{a.role}</p>
                <p className="text-sm text-gray-700 mb-2">{a.how}</p>
                <p className="text-xs text-gray-400 italic">{a.notes}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prompt Library */}
      {active === 'prompt-library' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Prompt Library</h2>
          <p className="text-sm text-gray-500 mb-6">
            Claude Code prompts used across the 7-week build — the actual instructions sent to the implementation agent each week. Weeks where the full prompt was not recovered show the available notes and lessons instead.
          </p>
          <div className="space-y-3">
            {PROMPT_WEEKS.map((entry) => (
              <PromptCard key={entry.week} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* Build Logs */}
      {active === 'build-logs' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Build Logs</h2>
          <p className="text-sm text-gray-500 mb-6">Week-by-week summary of what was built and what was cut.</p>
          <div className="space-y-4">
            {BUILD_LOGS.map((log) => (
              <div key={log.week} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-mono font-medium text-gray-400">{log.week}</span>
                  <span className="font-semibold text-gray-900 text-sm">{log.title}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{log.built}</p>
                {log.cuts !== '—' && (
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">Cut: </span>{log.cuts}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testing Summary */}
      {active === 'testing' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Testing Summary</h2>
          <p className="text-sm text-gray-500 mb-6">Internal tests run during Week 5–6 plus external tester results.</p>

          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Internal tests</h3>
          <div className="overflow-x-auto mb-10">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-1/2">Test</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-1/6">Result</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</th>
                </tr>
              </thead>
              <tbody>
                {INTERNAL_TESTS.map((t, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">{t.test}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-medium text-gray-900">{t.result}</span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">External tester feedback</h3>
          <div className="mb-6">
            <ExternalFeedbackList feedback={feedback} />
          </div>

          <FeedbackForm onSubmitted={loadFeedback} />
        </section>
      )}

      {/* Roadmap V2 */}
      {active === 'roadmap' && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Version 2 Roadmap</h2>
          <p className="text-sm text-gray-500 mb-6">Scope cut items deferred from the 6-week prototype — what comes next and why it was postponed.</p>
          <div className="space-y-3">
            {ROADMAP.map((r) => (
              <div key={r.item} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{r.item}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    r.priority === 'High' ? 'border-gray-400 text-gray-600' :
                    r.priority === 'Medium' ? 'border-gray-300 text-gray-500' :
                    'border-gray-200 text-gray-400'
                  }`}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{r.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
