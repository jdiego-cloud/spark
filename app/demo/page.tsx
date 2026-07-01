import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

const PAGES = [
  {
    href: '/',
    label: 'Home',
    category: 'Landing',
    description: 'A/B-tested hero that routes visitors to the right tool in one click.',
  },
  {
    href: '/core',
    label: 'Core',
    category: 'Product',
    description: 'Ask any question and get a plain-language, science-backed explanation instantly.',
  },
  {
    href: '/research',
    label: 'Research',
    category: 'Insights',
    description: 'Competitive landscape, global benchmarks, and market risk analysis.',
  },
  {
    href: '/product',
    label: 'Product',
    category: 'Strategy',
    description: 'Feature roadmap and product positioning built from user research.',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    category: 'Revenue',
    description: 'Subscription tiers, feature matrix, and a live revenue simulator.',
  },
  {
    href: '/marketing',
    label: 'Marketing',
    category: 'Growth',
    description: 'Brand system, audience personas, content bank, and A/B test results.',
  },
  {
    href: '/chat',
    label: 'Chat',
    category: 'Engagement',
    description: 'Guided assistant that helps users explore Spark features conversationally.',
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    category: 'Admin',
    description: 'Password-protected metrics view: row counts and recent records for every table.',
  },
]

type TesterFeedback = {
  id: string
  name: string | null
  rating: number
  comment: string
  created_at: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-base leading-none tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-gray-900' : 'text-gray-300'}>
          {s <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

async function getTestimonials(): Promise<TesterFeedback[]> {
  const db = getSupabase()
  if (!db) return []
  const { data } = await db
    .from('tester_feedback')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function DemoPage() {
  const testimonials = await getTestimonials()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="mb-12">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Walkthrough</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Spark — full product tour</h1>
        <p className="text-gray-500 max-w-xl">
          Eight pages, one product. Each card below links directly to a live feature and explains what it solves in one line.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="flex flex-col border border-gray-200 rounded-lg px-6 py-5 hover:bg-gray-50 group"
          >
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{page.category}</span>
            <span className="font-semibold text-gray-900 group-hover:underline mb-1">{page.label} →</span>
            <span className="text-sm text-gray-500">{page.description}</span>
          </Link>
        ))}
      </div>

      {/* Tester Testimonials */}
      <section className="border-t border-gray-200 pt-10 mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tester Feedback</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">What external testers said</h2>
        {testimonials.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No external feedback yet. Testers can submit their ratings in{' '}
            <Link href="/docs" className="underline hover:text-gray-700">
              docs → Testing Summary
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Stars rating={t.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{t.comment}</p>
                {t.name && <p className="text-xs text-gray-400">— {t.name}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-gray-200 pt-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Impact Check</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Value generated · Risks considered</h2>
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm text-gray-700">
            Spark makes science accessible to anyone in seconds — no textbook, no search engine rabbit hole. The core value is reducing the friction between a genuine question and a plain-language answer.
          </p>
          <p className="text-sm text-gray-700">
            The two-phase guardrail in <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/chat</span> prevents the model from simulating medical diagnoses, legal advice, or harmful content — topics where a confident but wrong AI answer carries real-world risk. Flagged sessions are logged with <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">was_flagged = true</span> so patterns can be reviewed.
          </p>
          <p className="text-sm text-gray-700">
            No user data is stored beyond anonymised session rows. There is no persistent profile, no tracking, and no data sold or shared. The dashboard is password-gated and not indexed.
          </p>
          <p className="text-sm text-gray-700">
            Known limitation: the model can still produce a confident but incorrect explanation on niche topics. The disclaimer in <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/core</span> asks users to verify claims that matter — this is a prototype, not a peer-reviewed source.
          </p>
          <p className="text-sm text-gray-500 text-xs pt-1">
            Full audit trail in <Link href="/docs" className="underline hover:text-gray-700">docs → Testing Summary</Link> and <Link href="/docs" className="underline hover:text-gray-700">Agent Map</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
