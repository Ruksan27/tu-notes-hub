'use client'
// src/app/dashboard/page.tsx — Premium student dashboard with Tailwind CSS
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'
import { DashboardSkeleton } from '@/components/SkeletonLoader'

type Tab = 'overview' | 'compare' | 'payment'

interface User {
  id: string; name: string; email: string
  packageType: string; role: string
  facultyId: string | null; semesterOrder: number | null
}
interface Faculty { id: string; name: string; icon: string; systemType: 'SEMESTER' | 'YEARLY' }
interface Note {
  id: string; title: string; description: string | null
  cloudinaryUrl: string; fileSize: string | null
  noteType: string; isPremium: boolean; author: string | null; downloadCount: number
}
interface PastPaper { id: string; year: number; examType: string; cloudinaryUrl: string }
interface Cheatsheet { id: string; title: string; content: string }
interface Subject {
  id: string; code: string; title: string
  notes: Note[]; pastPapers: PastPaper[]; cheatsheets: Cheatsheet[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [semesterName, setSemesterName] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    fetch('/api/student/dashboard', { signal: controller.signal })
      .then(async (res) => {
        clearTimeout(timeout)
        if (res.status === 401) { router.push('/login'); return null }
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 404) { router.push('/login'); return null }
          throw new Error(data.error || 'Failed to load dashboard')
        }
        return data
      })
      .then((data) => {
        if (!data) return
        setUser(data.user)
        setFaculty(data.faculty || null)
        setSemesterName(data.semesterName || '')
        setSubjects(data.subjects || [])
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection.')
        } else {
          setError(err.message || 'Failed to load dashboard')
          toast.error(err.message || 'Failed to load dashboard')
        }
        setLoading(false)
      })

    return () => { clearTimeout(timeout); controller.abort() }
  }, [router])

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 24px', minHeight: 'calc(100vh - 68px)' }}>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex-center flex-col" style={{ minHeight: '80vh', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px' }}>Something went wrong</h2>
        <p style={{ color: 'var(--clr-text-2)', maxWidth: '400px' }}>{error || 'Session expired. Please log in again.'}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>↻ Retry</button>
          <button className="btn btn-primary" onClick={() => router.push('/login')}>Go to Login</button>
        </div>
      </div>
    )
  }

  const isPremium = user.packageType !== 'FREE'
  const isElite = user.packageType === 'ELITE_AI'
  const totalNotes = subjects.reduce((a, s) => a + s.notes.length, 0)
  const totalPapers = subjects.reduce((a, s) => a + s.pastPapers.length, 0)
  const totalSheets = subjects.reduce((a, s) => a + s.cheatsheets.length, 0)

  const pkgConfig: Record<string, { label: string; cls: string; gradient: string }> = {
    FREE: { label: '🆓 Free Tier', cls: 'badge-free', gradient: 'rgba(100,116,139,0.2)' },
    SEMESTER_PASS: { label: '⚡ Semester Pass', cls: 'badge-semester', gradient: 'rgba(6,182,212,0.15)' },
    ELITE_AI: { label: '🤖 Elite AI Pass', cls: 'badge-elite', gradient: 'rgba(99,102,241,0.2)' },
  }
  const pkg = pkgConfig[user.packageType] ?? pkgConfig.FREE

  const navItems = [
    { id: 'overview', icon: '📚', label: 'My Subjects' },
    { id: 'compare', icon: '🤖', label: 'AI Exam Predictor' },
    { id: 'payment', icon: '💎', label: 'Upgrade Plan' },
  ]

  return (
    <div className="container" style={{ padding: '40px 24px 80px', minHeight: 'calc(100vh - 68px)' }}>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-start justify-between flex-wrap gap-4 mb-10"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--clr-text-3)' }}>
            Welcome back 👋
          </p>
          <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', marginBottom: '6px' }}>
            {user.name.split(' ')[0]}&apos;s{' '}
            <span className="text-gradient">Learning Portal</span>
          </h1>
          {faculty ? (
            <p style={{ color: 'var(--clr-text-2)', fontSize: '15px' }}>
              {faculty.icon} <strong>{faculty.name}</strong>{' '}
              •{' '}
              <span style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>{semesterName}</span>
            </p>
          ) : (
            <p style={{ color: 'var(--clr-warning)', fontSize: '14px' }}>
              ⚠️ No faculty/semester selected — go to{' '}
              <Link href="/settings" style={{ color: 'var(--clr-primary-h)', textDecoration: 'underline' }}>Settings</Link>
            </p>
          )}
        </div>
        <span
          className="badge"
          style={{ background: pkg.gradient, padding: '8px 18px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px' }}
        >
          {pkg.label}
        </span>
      </motion.div>

      <div className="sidebar-layout">
        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="sidebar"
        >
          <p className="text-xs font-bold uppercase tracking-widest px-3 pb-3" style={{ color: 'var(--clr-text-3)' }}>
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id as Tab)}
            >
              <span className="text-lg">{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ height: '1px', background: 'var(--clr-border)', margin: '12px 0' }} />
          <Link href="/faculties" className="sidebar-item">
            <span className="text-lg">🏫</span> Browse Faculties
          </Link>
          {!faculty && (
            <Link href="/settings" className="sidebar-item" style={{ color: 'var(--clr-warning)' }}>
              <span className="text-lg">⚙️</span> Setup Profile
            </Link>
          )}
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="sidebar-item" style={{ color: 'var(--clr-primary-h)' }}>
              <span className="text-lg">⚙️</span> Admin Panel
            </Link>
          )}
        </motion.aside>

        {/* ── Main Content ── */}
        <main>
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
              {/* Stats */}
              <div className="stat-grid" style={{ marginBottom: '28px' }}>
                {[
                  { label: 'Notes Available', value: totalNotes, icon: '📄', color: 'var(--clr-primary-h)' },
                  { label: 'Past Papers', value: totalPapers, icon: '📝', color: 'var(--clr-accent-h)' },
                  { label: 'AI Cheatsheets', value: totalSheets, icon: '📋', color: '#c084fc' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="stat-card glass-card"
                    style={{ borderLeft: `3px solid ${s.color}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--clr-text-3)' }}>{s.label}</span>
                      <span className="text-2xl">{s.icon}</span>
                    </div>
                    <div className="stat-value" style={{ fontSize: '36px', color: s.color }}>{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Upgrade Banner */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.06))',
                    padding: '24px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '20px', marginBottom: '28px',
                    boxShadow: '0 0 30px rgba(99,102,241,0.12)',
                    borderColor: 'rgba(99,102,241,0.3)',
                  }}
                >
                  <div>
                    <h3 className="text-lg font-bold mb-1">🚀 Unlock Premium Access</h3>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', maxWidth: '520px' }}>
                      Get ad-free downloads, AI Exam Predictor, printable cheatsheets and priority access to all resources.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setTab('payment')}>
                    💎 Upgrade Now
                  </button>
                </motion.div>
              )}

              {/* Subjects */}
              <div>
                <h3 className="section-title">📚 Course Materials</h3>
                {subjects.length === 0 ? (
                  <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px' }}>📭</div>
                    <h3 className="text-xl font-semibold mb-2">No materials yet</h3>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '8px' }}>
                      {faculty
                        ? `No study materials uploaded for ${semesterName} yet. Check back soon!`
                        : 'Select your faculty and semester in Settings to see your materials.'}
                    </p>
                    {!faculty && (
                      <Link href="/settings" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                        ⚙️ Setup Profile
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {subjects.map((sub, idx) => {
                      const total = sub.notes.length + sub.pastPapers.length + sub.cheatsheets.length
                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="glass-card"
                          style={{ padding: 0, overflow: 'hidden' }}
                        >
                          {/* Subject header */}
                          <div
                            className="flex items-center justify-between flex-wrap gap-3 px-6 py-4"
                            style={{
                              borderBottom: '1px solid var(--clr-border)',
                              background: 'rgba(255,255,255,0.015)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs font-bold px-3 py-1 rounded-md"
                                style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--clr-accent-h)' }}
                              >
                                {sub.code}
                              </span>
                              <span className="font-bold text-base" style={{ color: 'var(--clr-text-1)' }}>
                                {sub.title}
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--clr-text-3)' }}>
                              {total} resource{total !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {total === 0 ? (
                            <p className="px-6 py-4 text-sm" style={{ color: 'var(--clr-text-3)' }}>
                              No files uploaded for this subject yet.
                            </p>
                          ) : (
                            <div className="p-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              {/* Notes */}
                              {sub.notes.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--clr-text-3)' }}>
                                    📄 Study Notes
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                    {sub.notes.map((note) => (
                                      <Link key={note.id} href={`/download/${note.id}`} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                          whileHover={{ scale: 1.02, y: -2 }}
                                          className="rounded-xl p-4 cursor-pointer transition-all"
                                          style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                          }}
                                        >
                                          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--clr-text-1)', lineHeight: 1.4 }}>
                                            {note.title}
                                          </p>
                                          <div className="flex items-center justify-between">
                                            <span className="badge badge-free" style={{ fontSize: '10px' }}>
                                              {note.noteType.replace(/_/g, ' ')}
                                            </span>
                                            {note.isPremium && (
                                              <span className="text-xs font-semibold" style={{ color: 'var(--clr-accent-h)' }}>💎 Premium</span>
                                            )}
                                          </div>
                                        </motion.div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Past Papers */}
                              {sub.pastPapers.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--clr-text-3)' }}>
                                    📝 Question Papers
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                    {sub.pastPapers.map((paper) => (
                                      <Link key={paper.id} href={`/download/${paper.id}`} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                          whileHover={{ scale: 1.02, y: -2 }}
                                          className="rounded-xl p-4 cursor-pointer"
                                          style={{
                                            background: 'rgba(6,182,212,0.04)',
                                            border: '1px solid rgba(6,182,212,0.15)',
                                          }}
                                        >
                                          <p className="font-semibold text-sm" style={{ color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                                            📅 {paper.year} — {paper.examType.replace(/_/g, ' ')}
                                          </p>
                                          <span className="text-xs font-medium" style={{ color: 'var(--clr-accent-h)' }}>
                                            Download Paper →
                                          </span>
                                        </motion.div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cheatsheets */}
                              {sub.cheatsheets.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--clr-text-3)' }}>
                                    📋 AI Cheatsheets
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                    {sub.cheatsheets.map((sheet) => (
                                      <motion.div
                                        key={sheet.id}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        className="rounded-xl p-4"
                                        style={{
                                          background: 'rgba(99,102,241,0.06)',
                                          border: '1px solid rgba(99,102,241,0.2)',
                                          cursor: isElite ? 'pointer' : 'default',
                                          position: 'relative',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {!isElite && (
                                          <div
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{ background: 'rgba(8,10,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 2 }}
                                          >
                                            <span className="text-xs font-bold" style={{ color: '#a5b4fc' }}>🔒 Elite Only</span>
                                          </div>
                                        )}
                                        <p className="font-semibold text-sm mb-2" style={{ color: 'var(--clr-text-1)' }}>
                                          {sheet.title}
                                        </p>
                                        <span className="badge badge-elite" style={{ fontSize: '9px' }}>Elite AI</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── AI Compare Tab ── */}
          {tab === 'compare' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="section-title">🤖 AI Exam Predictor</h3>
              {!isPremium ? (
                <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
                  <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
                  <h2 className="text-2xl font-bold mb-3">Premium Feature</h2>
                  <p style={{ color: 'var(--clr-text-2)', marginBottom: '28px', maxWidth: '420px', margin: '0 auto 28px' }}>
                    AI Exam Prediction requires a <strong>Semester Pass</strong> or <strong>Elite AI Pass</strong> to run automated comparisons of past papers.
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={() => setTab('payment')}>
                    💎 View Premium Plans
                  </button>
                </div>
              ) : (
                <AICompareTool subjects={subjects} isElite={isElite} />
              )}
            </motion.div>
          )}

          {/* ── Payment Tab ── */}
          {tab === 'payment' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PaymentTab currentPlan={user.packageType} />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

/* ── AI Compare Tool ── */
function AICompareTool({ subjects, isElite }: { subjects: Subject[]; isElite: boolean }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId)

  useEffect(() => { setSelectedPaperIds([]); setReport(null) }, [selectedSubjectId])

  async function runAIAnalysis() {
    if (selectedPaperIds.length < 2) { toast.error('Select at least 2 papers'); return }
    setLoading(true); setReport(null)
    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubjectId, paperIds: selectedPaperIds }),
      })
      const data = await res.json()
      if (res.ok) { setReport(data.report); toast.success('AI Report Generated! 🎉') }
      else toast.error(data.error || 'Failed to generate report')
    } catch { toast.error('AI request failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 className="font-bold text-xl mb-2">Predict Exam Pattern</h3>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '24px' }}>
          Choose a subject and at least 2 past papers to generate an AI prediction report.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--clr-text-2)' }}>Select Subject</label>
          <select className="input-field" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="">— Choose a subject —</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>)}
          </select>
        </div>

        {currentSubject && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: '24px' }}>
            <label className="text-sm font-semibold block mb-3" style={{ color: 'var(--clr-text-2)' }}>
              Select Papers to Compare (min. 2)
            </label>
            {currentSubject.pastPapers.length === 0 ? (
              <p className="text-sm px-4 py-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--clr-warning)', border: '1px solid rgba(245,158,11,0.2)' }}>
                ⚠️ No past papers uploaded for this subject yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {currentSubject.pastPapers.map((paper) => {
                  const checked = selectedPaperIds.includes(paper.id)
                  return (
                    <button key={paper.id} type="button"
                      onClick={() => setSelectedPaperIds(p => p.includes(paper.id) ? p.filter(id => id !== paper.id) : [...p, paper.id])}
                      style={{
                        padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
                        border: `2px solid ${checked ? 'var(--clr-primary)' : 'rgba(255,255,255,0.1)'}`,
                        background: checked ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: checked ? '#fff' : 'var(--clr-text-2)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: checked ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                      }}
                    >
                      📅 {paper.year}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        <button className="btn btn-primary btn-lg" onClick={runAIAnalysis}
          disabled={loading || selectedPaperIds.length < 2}
          style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
        >
          {loading ? <><span className="spinner" /> Analyzing with AI...</> : `🤖 Run AI Analysis (${selectedPaperIds.length} selected)`}
        </button>
      </div>

      {report && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '40px' }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <h3 className="text-2xl font-bold">📊 {report.subject} — AI Report</h3>
            {isElite && <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
            {report.topicAnalysis?.map((topic: any, idx: number) => {
              const level = topic.classification.toLowerCase()
              return (
                <motion.div key={topic.topic} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '12px' }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className="font-bold text-base">{topic.topic}</span>
                    <span className={`badge badge-${level}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                      {topic.probability}% — {topic.classification}
                    </span>
                  </div>
                  <div className="prob-bar-track mb-4">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${topic.probability}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={`prob-bar-fill ${level}`}
                    />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
                    <strong>Reasoning:</strong> {topic.reasoning}
                  </p>
                  {topic.cheatsheetPoints?.length > 0 && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--clr-primary-h)' }}>💡 Quick Study Points:</p>
                      <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {topic.cheatsheetPoints.map((pt: string, i: number) => (
                          <li key={i} style={{ fontSize: '13px', color: 'var(--clr-text-1)' }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
          {report.topPredictions?.length > 0 && (
            <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '28px' }}>
              <h4 className="text-lg font-bold mb-5">🔮 Predicted Questions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {report.topPredictions.map((pred: any, idx: number) => (
                  <motion.div key={idx} whileHover={{ scale: 1.01 }}
                    style={{ padding: '18px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px' }}
                  >
                    <p className="font-semibold text-sm mb-2" style={{ color: 'var(--clr-text-1)' }}>{pred.predictedQuestion}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--clr-text-3)' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>
                        Chance: <strong style={{ color: '#fff' }}>{pred.probability}%</strong>
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>
                        Weight: <strong style={{ color: '#fff' }}>{pred.marks} Marks</strong>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ── Payment Tab ── */
function PaymentTab({ currentPlan }: { currentPlan: string }) {
  const [showQR, setShowQR] = useState<string | null>(null)
  const [txnId, setTxnId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const plans = [
    {
      id: 'SEMESTER_PASS', name: 'Semester Pass', price: 'Rs. 99', period: '/semester',
      desc: 'Full access for one semester', color: 'var(--clr-accent)',
      features: ['All notes & PPTX files', 'Past papers download', '1-click downloads', 'Valid 6 months'],
    },
    {
      id: 'ELITE_AI', name: 'Elite AI Pass', price: 'Rs. 199', period: '/year',
      desc: 'AI predictions & unlimited tools', color: 'var(--clr-primary)',
      features: ['Everything in Semester Pass', 'Unlimited AI Exam Predictor', 'Detailed topic analysis', 'Printable reports & cheatsheets', 'Valid 1 year'],
    },
  ]

  async function handleSubmit() {
    if (!txnId.trim() || !showQR) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType: showQR, transactionId: txnId }),
      })
      if (res.ok) setDone(true)
      else toast.error('Submission failed. Try again.')
    } catch { toast.error('Network error. Try again.') }
    finally { setSubmitting(false) }
  }

  if (done) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card" style={{ padding: '64px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
        <h2 className="text-3xl font-bold mb-3">Verification Pending</h2>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
          Your payment has been recorded. Our admins will verify and activate your premium status within 1–2 hours.
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <h3 className="section-title">💎 Choose Your Plan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {plans.map((plan, idx) => (
          <motion.div key={plan.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="glass-card"
            style={{
              padding: '32px', position: 'relative', overflow: 'hidden',
              border: currentPlan === plan.id ? `2px solid ${plan.color}` : '1px solid var(--clr-border)',
              boxShadow: currentPlan === plan.id ? `0 0 24px ${plan.color}30` : 'none',
            }}
          >
            {currentPlan === plan.id && (
              <span style={{
                position: 'absolute', top: '14px', right: '14px',
                background: plan.color, color: '#fff', padding: '3px 12px',
                borderRadius: '999px', fontSize: '11px', fontWeight: 700,
              }}>ACTIVE</span>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>{plan.desc}</p>
            <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span style={{ fontSize: '40px', fontWeight: 800, color: plan.color }}>{plan.price}</span>
              <span style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'var(--clr-text-1)' }}>
                  <span style={{ color: 'var(--clr-success)', fontSize: '16px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            {currentPlan !== plan.id && (
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowQR(plan.id)}
              >
                Pay & Upgrade
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {showQR && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card" style={{ padding: '36px', maxWidth: '480px', margin: '0 auto' }}
        >
          <h3 className="text-2xl font-bold text-center mb-6">📱 Scan to Pay</h3>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px', minHeight: '200px',
          }}>
            <p style={{ color: '#000', fontWeight: 700, textAlign: 'center', fontSize: '15px' }}>
              [QR Payment — Transfer Rs. {showQR === 'ELITE_AI' ? '199' : '99'}]
            </p>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>
              Transaction Reference ID
            </label>
            <input className="input-field" placeholder="e.g. REF-8374928"
              value={txnId} onChange={(e) => setTxnId(e.target.value)} style={{ padding: '14px', fontSize: '15px' }}
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleSubmit} disabled={submitting || !txnId.trim()}
          >
            {submitting ? <><span className="spinner" /> Processing...</> : '✅ I Have Paid — Submit'}
          </button>
        </motion.div>
      )}
    </div>
  )
}
