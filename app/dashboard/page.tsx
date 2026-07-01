'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

const TABLES = [
  'core_outputs',
  'research_records',
  'pricing_scenarios',
  'marketing_assets',
  'ab_test_events',
  'chat_sessions',
  'chat_messages',
] as const

type TableName = (typeof TABLES)[number]

type Counts = Record<TableName, number>

type CoreOutput = { id: string; created_at: string; question: string; answer: string }
type ChatSession = { id: string; created_at: string; session_id: string; was_flagged: boolean }
type ResearchRecord = { id: string; created_at: string; query: string; summary: string }

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [counts, setCounts] = useState<Counts | null>(null)
  const [coreOutputs, setCoreOutputs] = useState<CoreOutput[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [researchRecords, setResearchRecords] = useState<ResearchRecord[]>([])
  const [activeTab, setActiveTab] = useState<'core_outputs' | 'chat_sessions' | 'research_records'>('core_outputs')

  useEffect(() => {
    const db = getSupabase()
    if (!db) { setSession(null); return }

    db.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const db = getSupabase()
    if (!db) return

    async function load() {
      if (!db) return
      const countResults = await Promise.all(
        TABLES.map((t) => db.from(t).select('*', { count: 'exact', head: true }))
      )
      const c = {} as Counts
      TABLES.forEach((t, i) => { c[t] = countResults[i].count ?? 0 })
      setCounts(c)

      const [co, cs, rr] = await Promise.all([
        db.from('core_outputs').select('id, created_at, question, answer').order('created_at', { ascending: false }).limit(20),
        db.from('chat_sessions').select('id, created_at, session_id, was_flagged').order('created_at', { ascending: false }).limit(20),
        db.from('research_records').select('id, created_at, query, summary').order('created_at', { ascending: false }).limit(20),
      ])
      setCoreOutputs(co.data ?? [])
      setChatSessions(cs.data ?? [])
      setResearchRecords(rr.data ?? [])
    }

    load()
  }, [session])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const db = getSupabase()
    if (!db) return
    setLoggingIn(true)
    setLoginError('')
    const { error } = await db.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
    setLoggingIn(false)
  }

  async function handleLogout() {
    const db = getSupabase()
    if (!db) return
    await db.auth.signOut()
  }

  if (session === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to access project metrics.</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-xs text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{session.user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>

      {/* Count cards */}
      <section className="mb-12">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Table counts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TABLES.map((t) => (
            <div key={t} className="border border-gray-200 rounded-lg px-5 py-4">
              <p className="text-2xl font-bold text-gray-900">
                {counts ? counts[t].toLocaleString() : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1 break-all">{t.replace(/_/g, '_​')}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detail tables */}
      <section>
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Last 20 records</h2>
        <div className="flex gap-2 mb-4">
          {(['core_outputs', 'chat_sessions', 'research_records'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-md border ${activeTab === tab ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {activeTab === 'core_outputs' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-40">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Question</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-1/3">Answer (excerpt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coreOutputs.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.question}</td>
                    <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs">{row.answer?.slice(0, 120)}{row.answer?.length > 120 ? '…' : ''}</td>
                  </tr>
                ))}
                {coreOutputs.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No records</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'chat_sessions' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-40">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Session ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-24">Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chatSessions.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono text-xs">{row.session_id}</td>
                    <td className="px-4 py-2.5 text-xs">{row.was_flagged ? <span className="text-gray-700 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  </tr>
                ))}
                {chatSessions.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No records</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'research_records' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-40">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Query</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-1/3">Summary (excerpt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {researchRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-gray-700">{row.query}</td>
                    <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs">{row.summary?.slice(0, 120)}{row.summary?.length > 120 ? '…' : ''}</td>
                  </tr>
                ))}
                {researchRecords.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No records</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
