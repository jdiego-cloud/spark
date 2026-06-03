'use client'

import { useState } from 'react'
import { competitors } from '@/data/competitors'

export default function CompetitorTable() {
  const [query, setQuery] = useState('')

  const filtered = competitors.filter((c) => {
    const q = query.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Filter by name or category..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 mb-6"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">Name</th>
              <th className="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">Category</th>
              <th className="py-3 pr-4 font-semibold text-gray-900">Strengths</th>
              <th className="py-3 pr-4 font-semibold text-gray-900">Weaknesses</th>
              <th className="py-3 font-semibold text-gray-900 whitespace-nowrap">Spanish support</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  No results for &ldquo;{query}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{c.category}</td>
                  <td className="py-3 pr-4 text-gray-600">{c.strengths}</td>
                  <td className="py-3 pr-4 text-gray-600">{c.weaknesses}</td>
                  <td className="py-3">
                    {c.spanishSupport ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
