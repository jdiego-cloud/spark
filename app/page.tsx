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
        <p className="text-lg text-gray-500">
          Type any question — get a clear, simple scientific explanation.
        </p>
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
