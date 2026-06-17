'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

type Scenario = {
  id: string
  created_at: string
  scenario_name: string
  pro_users: number
  school_licenses: number
  monthly_revenue: number
  annual_revenue: number
}

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/ month',
    features: ['5 searches per day', 'Plain-language explanations', 'Save up to 3 results', 'Community support'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: 'per user / month',
    features: ['Everything in Free', 'Unlimited searches', 'Deeper explanations', 'Priority response'],
    highlight: true,
  },
  {
    name: 'School',
    price: '$49.99',
    period: 'per school license / month',
    features: ['Everything in Pro', 'Up to 50 student accounts', 'Usage dashboard', 'Dedicated support'],
    highlight: false,
  },
]

const assumptions = [
  { metric: 'Pro price', value: '$9.99 / user / month', notes: 'Each active Pro user pays individually' },
  { metric: 'School price', value: '$49.99 / license / month', notes: 'Flat fee per school, any student count' },
  { metric: 'Free users', value: '$0', notes: 'Do not generate revenue' },
  { metric: 'Churn', value: 'Not modeled', notes: 'Steady state assumed' },
  { metric: 'Currency', value: 'USD', notes: 'All figures in US dollars' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function getOrCreateSessionId(): string {
  const key = 'spark_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export default function PricingPage() {
  const [proUsers, setProUsers] = useState(100)
  const [schoolLicenses, setSchoolLicenses] = useState(5)
  const [scenarioName, setScenarioName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const mrr = proUsers * 9.99 + schoolLicenses * 49.99
  const arr = mrr * 12

  const fetchScenarios = useCallback(async () => {
    const db = getSupabase()
    if (!db) return
    const sessionId = getOrCreateSessionId()
    const { data } = await db
      .from('pricing_scenarios')
      .select('id, created_at, scenario_name, pro_users, school_licenses, monthly_revenue, annual_revenue')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (data) setScenarios(data)
  }, [])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  async function handleSave() {
    if (!scenarioName.trim()) return
    const db = getSupabase()
    if (!db) {
      setSaveMsg({ ok: false, text: 'Supabase is not configured.' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    const sessionId = getOrCreateSessionId()
    const { error } = await db.from('pricing_scenarios').insert({
      session_id: sessionId,
      scenario_name: scenarioName.trim(),
      pro_users: proUsers,
      school_licenses: schoolLicenses,
      monthly_revenue: parseFloat(mrr.toFixed(2)),
      annual_revenue: parseFloat(arr.toFixed(2)),
    })
    setSaving(false)
    if (error) {
      setSaveMsg({ ok: false, text: error.message })
    } else {
      setSaveMsg({ ok: true, text: 'Scenario saved.' })
      setScenarioName('')
      await fetchScenarios()
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing</h1>
        <p className="text-gray-500 max-w-xl">
          Simple, transparent plans for students, lifelong learners, and schools.
        </p>
      </section>

      {/* Tier cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-7 flex flex-col ${
              tier.highlight ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-gray-200'
            }`}
          >
            <h2 className={`text-lg font-bold mb-1 ${tier.highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
              {tier.name}
            </h2>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
              <p className="text-xs text-gray-400 mt-0.5">{tier.period}</p>
            </div>
            <ul className="space-y-2 flex-1">
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

      {/* Revenue Simulator */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Simulator</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">

          {/* LEFT — inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pro users
              </label>
              <input
                type="number"
                min={0}
                value={proUsers}
                onChange={(e) => setProUsers(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of School licenses
              </label>
              <input
                type="number"
                min={0}
                value={schoolLicenses}
                onChange={(e) => setSchoolLicenses(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Preset buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setProUsers(50); setSchoolLicenses(2) }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-gray-400 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">Conservative</p>
                <p className="text-xs text-gray-400">Lower adoption</p>
              </button>
              <button
                type="button"
                onClick={() => { setProUsers(500); setSchoolLicenses(20) }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-left hover:border-gray-400 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">Optimistic</p>
                <p className="text-xs text-gray-400">Higher adoption</p>
              </button>
            </div>
          </div>

          {/* RIGHT — output */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                Monthly Recurring Revenue (MRR)
              </p>
              <p className="text-4xl font-extrabold text-indigo-700">{fmt(mrr)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                Annual Recurring Revenue (ARR)
              </p>
              <p className="text-4xl font-extrabold text-indigo-700">{fmt(arr)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Assumptions table */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assumptions</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-1/4">Metric</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700 w-1/4">Value</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map((row, i) => (
                <tr key={row.metric} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-5 py-3 font-medium text-gray-900">{row.metric}</td>
                  <td className="px-5 py-3 text-gray-600">{row.value}</td>
                  <td className="px-5 py-3 text-gray-500">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Save scenario */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Scenario</h2>
        <div className="flex gap-3 max-w-lg">
          <input
            type="text"
            placeholder="Scenario name (required)"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !saving && handleSave()}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !scenarioName.trim()}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {saveMsg && (
          <p className={`mt-2 text-sm font-medium ${saveMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
            {saveMsg.text}
          </p>
        )}
      </section>

      {/* Saved scenarios */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Saved Scenarios</h2>
          <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1">
            + New Scenario ↑
          </span>
        </div>

        {scenarios.length === 0 ? (
          <p className="text-sm text-gray-400">No scenarios saved yet. Fill in the simulator above and save one.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">MRR</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">ARR</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Saved</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.scenario_name}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(s.monthly_revenue)}</td>
                    <td className="px-5 py-3 text-gray-700">{fmt(s.annual_revenue)}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}
