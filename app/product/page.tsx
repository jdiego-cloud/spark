import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Product — Spark',
  description: 'Understand anything, one curiosity at a time. See what Spark offers across Free, Pro, and School plans.',
}

const tiers = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    name: 'Free',
    badge: null,
    target: 'For curious students',
    price: '$0',
    period: 'free forever',
    features: [
      '5 searches per day',
      'Plain-language explanations',
      'Save up to 3 results',
      'Community support',
    ],
    highlight: false,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-500">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    name: 'Pro',
    badge: 'MOST POPULAR',
    target: 'For lifelong learners',
    price: '$9.99',
    period: 'per user / month',
    features: [
      'Everything in Free',
      'Unlimited searches',
      'Deeper explanations',
      'Save unlimited results',
      'Priority response',
    ],
    highlight: true,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500">
        <path d="M22 10v2a10 10 0 0 1-20 0v-2" />
        <path d="M12 22v-4" />
        <path d="M8 22h8" />
        <path d="M3.5 10L12 3l8.5 7" />
      </svg>
    ),
    name: 'School',
    badge: null,
    target: 'For schools & institutions',
    price: '$49.99',
    period: 'per school license / month',
    features: [
      'Everything in Pro',
      'Up to 50 student accounts',
      'Usage dashboard',
      'Dedicated support',
    ],
    highlight: false,
  },
]

const trustPoints = [
  'Plain language',
  'Always free tier',
  'Built on Next.js',
  'No jargon, ever',
]

export default function ProductPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">

      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Understand anything.<br className="hidden sm:block" /> One curiosity at a time.
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Spark turns any question into a clear, plain-language scientific explanation — no jargon, no paywalls for the basics.
        </p>
      </section>

      {/* Tier cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-2xl p-8 border ${
              tier.highlight
                ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                : 'border-gray-200'
            }`}
          >
            {/* Badge */}
            {tier.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                {tier.badge}
              </span>
            )}

            {/* Icon */}
            <div className="mb-5">{tier.icon}</div>

            {/* Name + target */}
            <h2 className={`text-xl font-bold mb-1 ${tier.highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
              {tier.name}
            </h2>
            <p className="text-sm text-gray-400 mb-6">{tier.target}</p>

            {/* Price */}
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
              <p className="text-xs text-gray-400 mt-1">{tier.period}</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Footer identity band */}
      <section className="border border-gray-100 rounded-2xl bg-gray-50 px-8 py-10 text-center">
        <p className="text-gray-700 font-medium text-lg mb-6">
          Built for curious minds. Powered by clear science.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {trustPoints.map((point) => (
            <span
              key={point}
              className="text-sm text-gray-500 border border-gray-200 bg-white rounded-full px-4 py-1.5"
            >
              {point}
            </span>
          ))}
        </div>
      </section>

    </div>
  )
}
