import Link from 'next/link'

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

export default function DemoPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="mb-12">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Walkthrough</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Spark — full product tour</h1>
        <p className="text-gray-500 max-w-xl">
          Eight pages, one product. Each card below links directly to a live feature and explains what it solves in one line.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  )
}
