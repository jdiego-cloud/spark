export default function DocsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Documentation</h1>
      <p className="text-gray-500 text-sm mb-12">Technical reference for how Spark works.</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Model</h2>
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Google Gemini 1.5 Flash</span> (free tier)
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Accessed via the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">@google/generative-ai</code> SDK.
            The model is called server-side from the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/api/explain</code> route.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">System Prompt</h2>
        <div className="border border-gray-200 rounded-lg p-5">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
            {`You are Spark, a science explanation assistant. Your job is to answer any curiosity in plain, simple language that anyone can understand. Avoid jargon. Keep answers concise — 3 to 5 sentences maximum. Respond in the same language the user writes in.`}
          </pre>
        </div>
      </section>
    </div>
  )
}
