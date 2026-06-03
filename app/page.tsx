import Link from 'next/link'

const roadmapFeatures = [
  {
    title: 'AI Explanations',
    description: 'Get clear, simple scientific explanations powered by AI.',
  },
  {
    title: 'Save Your Questions',
    description: "Bookmark questions you've asked to revisit anytime.",
  },
  {
    title: 'Search History',
    description: "Browse through everything you've been curious about.",
  },
  {
    title: 'Share with Friends',
    description: 'Send interesting explanations directly to friends.',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <section className="text-center mb-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Satisfy your curiosity, instantly.
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          Type any question — get a clear, simple scientific explanation.
        </p>
        <div className="flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Type your curiosity here..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="button"
            className="bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-lg hover:bg-gray-700"
          >
            Ask
          </button>
        </div>
      </section>

      <section className="mb-20">
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
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-8">Coming soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {roadmapFeatures.map((feature) => (
            <div key={feature.title} className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
