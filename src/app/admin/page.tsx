'use client'
// src/app/admin/page.tsx — Premium admin control center with Tailwind CSS
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'
import { AdminSkeleton } from '@/components/SkeletonLoader'

type AdminTab = 'overview' | 'payments' | 'faculties' | 'upload' | 'stats'

interface Payment {
  id: string
  user: { name: string; email: string }
  packageBought: string
  transactionId: string
  screenshotUrl: string | null
  status: string
  createdAt: string
  amount: number
}

interface Faculty {
  id: string
  name: string
  icon: string
  systemType: 'SEMESTER' | 'YEARLY'
  visible?: boolean
}

export default function AdminPage() {
  const [user, setUser] = useState<{ role: string; name: string } | null>(null)
  const [tab, setTab] = useState<AdminTab>('overview')
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({ users: 0, payments: 0, pending: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('tu_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'ADMIN') { router.push('/'); return }
    setUser(u)
    setLoading(false)
  }, [router])

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        setStats({
          users: data.totalUsers || 0,
          payments: data.totalPayments || 0,
          pending: data.pendingPayments || 0,
          revenue: data.totalRevenue || 0,
        })
      }
    } catch { toast.error('Failed to load system stats') }
  }, [])

  useEffect(() => {
    if (user && (tab === 'payments' || tab === 'overview')) loadPayments()
  }, [tab, user, loadPayments])

  async function verifyPayment(id: string, action: 'APPROVED' | 'REJECTED') {
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: id, action }),
    })
    if (res.ok) { toast.success(`Payment ${action.toLowerCase()}!`); loadPayments() }
    else toast.error('Failed to update payment status')
  }

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: '40px 24px', minHeight: 'calc(100vh - 68px)' }}>
        <AdminSkeleton />
      </div>
    )
  }

  const navItems: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'payments',  icon: '💳', label: 'Verify Payments' },
    { id: 'stats',     icon: '📈', label: 'Material Stats' },
    { id: 'faculties', icon: '🏫', label: 'Faculties' },
    { id: 'upload',    icon: '📤', label: 'Upload Materials' },
  ]

  const statCards = [
    { label: 'Registered Students', value: stats.users,    icon: '👥', accent: '#818cf8' },
    { label: 'Total Transactions',  value: stats.payments, icon: '💳', accent: '#22d3ee' },
    { label: 'Pending Verification',value: stats.pending,  icon: '⏳', accent: '#fcd34d' },
    { label: 'Total Revenue (Rs.)', value: stats.revenue,  icon: '💰', accent: '#6ee7b7' },
  ]

  return (
    <div className="container" style={{ padding: '40px 24px', minHeight: 'calc(100vh - 68px)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--clr-text-3)' }}>
          ⚙️ Admin Control Center
        </p>
        <h1 style={{ fontSize: 'clamp(26px,4vw,36px)' }}>
          System <span className="text-gradient">Dashboard</span>
        </h1>
      </motion.div>

      <div className="sidebar-layout">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="sidebar"
        >
          <p className="text-xs font-bold uppercase tracking-widest px-3 pb-3" style={{ color: 'var(--clr-text-3)' }}>
            Admin Menu
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'payments' && stats.pending > 0 && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#f59e0b', color: '#000', minWidth: '22px', textAlign: 'center' }}
                >
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </motion.aside>

        {/* Content */}
        <main>
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px',
                }}
              >
                {statCards.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="glass-card"
                    style={{ padding: '22px', borderLeft: `3px solid ${s.accent}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--clr-text-3)' }}>
                        {s.label}
                      </span>
                      <span className="text-2xl">{s.icon}</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: s.accent, fontFamily: 'var(--font-display)' }}>
                      {s.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pending Alert Banner */}
              {stats.pending > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl"
                  style={{
                    background: 'rgba(245,158,11,0.07)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    marginBottom: '16px',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">⏳</span>
                    <div>
                      <h4 className="font-bold" style={{ color: '#fcd34d', marginBottom: '2px' }}>
                        Action Required
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--clr-text-2)' }}>
                        {stats.pending} payment{stats.pending !== 1 ? 's' : ''} awaiting screenshot verification.
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#f59e0b', color: '#000', fontWeight: 700 }}
                    onClick={() => setTab('payments')}
                  >
                    Verify Payments →
                  </button>
                </motion.div>
              )}

              {/* Database and Visibility Sync Alert */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl"
                style={{
                  background: 'rgba(99,102,241,0.07)',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🎛️</span>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--clr-primary-h)', marginBottom: '2px' }}>
                      Database Visibility Sync
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--clr-text-2)' }}>
                      Set BCA as the only visible faculty on the frontend (and hide other faculties).
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--grad-brand)', color: '#fff', fontWeight: 700, border: 'none' }}
                  onClick={async () => {
                    if (!window.confirm('Run visibility migration? This sets BCA as the only visible faculty.')) return
                    try {
                      const res = await fetch('/api/admin/migrate', { method: 'POST' })
                      const data = await res.json()
                      if (res.ok) {
                        toast.success('Database visibility synchronized successfully! 🎉')
                      } else {
                        toast.error(data.error || 'Synchronization failed')
                      }
                    } catch {
                      toast.error('Network error during sync')
                    }
                  }}
                >
                  ⚡ Sync Faculty Defaults
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── Payments Tab ── */}
          {tab === 'payments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="section-title">💳 Subscription Requests</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Plan</th>
                      <th>Receipt</th>
                      <th>Txn ID / Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--clr-text-3)' }}>
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>{p.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{p.user?.email}</div>
                          </td>
                          <td>
                            <span className={`badge ${p.packageBought === 'ELITE_AI' ? 'badge-elite' : 'badge-semester'}`}>
                              {p.packageBought?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            {p.screenshotUrl ? (
                              <a
                                href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--clr-accent)', borderColor: 'rgba(6,182,212,0.3)' }}
                              >
                                View 🖼️
                              </a>
                            ) : (
                              <span style={{ color: 'var(--clr-text-3)', fontSize: '12px' }}>No image</span>
                            )}
                          </td>
                          <td>
                            <code style={{ display: 'block', fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                              {p.transactionId}
                            </code>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-text-1)' }}>Rs. {p.amount}</span>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NP', { dateStyle: 'medium' }) : '—'}
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'PENDING' ? 'badge-pending' : p.status === 'APPROVED' ? 'badge-success' : 'badge-low'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            {p.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                                  onClick={() => verifyPayment(p.id, 'APPROVED')}
                                >
                                  ✓ Approve
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => verifyPayment(p.id, 'REJECTED')}>
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── Faculties Tab ── */}
          {tab === 'faculties' && <FacultiesTab />}

          {/* ── Stats Tab ── */}
          {tab === 'stats' && <StatsTab />}

          {/* ── Upload Tab ── */}
          {tab === 'upload' && <UploadTab />}
        </main>
      </div>
    </div>
  )
}

/* ── Upload Tab ── */
function UploadTab() {
  const [contentType, setContentType] = useState<'NOTE' | 'PAST_PAPER' | 'CHEATSHEET'>('NOTE')
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [semesters, setSemesters] = useState<{ id: string; name: string; order: number }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string; title: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [projectRestriction, setProjectRestriction] = useState<{
    isRestricted: boolean
    maxProjects: number | null
    projectCount: number
    canUpload: boolean
    existingProjects: { id: string; title: string }[]
  } | null>(null)
  const [checkingRestriction, setCheckingRestriction] = useState(false)

  const [facultyId, setFacultyId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [semesterOrder, setSemesterOrder] = useState(0)
  const [subjectId, setSubjectId] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')
  const [noteType, setNoteType] = useState('PDF_BOOK')
  const [isPremium, setIsPremium] = useState('false')
  const [author, setAuthor] = useState('')
  const [noteFile, setNoteFile] = useState<File | null>(null)
  const [paperYear, setPaperYear] = useState(new Date().getFullYear().toString())
  const [examType, setExamType] = useState('BOARD_EXAM')
  const [paperFile, setPaperFile] = useState<File | null>(null)
  const [sheetTitle, setSheetTitle] = useState('')
  const [sheetContent, setSheetContent] = useState('')

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
  }, [])

  useEffect(() => {
    if (!facultyId) { setSemesters([]); setSemesterId(''); setSemesterOrder(0); return }
    fetch(`/api/admin/semesters?facultyId=${facultyId}`).then(r => r.json()).then(d => setSemesters(d.semesters || []))
  }, [facultyId])

  useEffect(() => {
    if (!semesterId) { setSubjects([]); setSubjectId(''); return }
    const sem = semesters.find(s => s.id === semesterId)
    if (sem) setSemesterOrder(sem.order || 0)
    fetch(`/api/admin/subjects?semesterId=${semesterId}`).then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [semesterId, semesters])

  // Check project restrictions whenever subjectId or noteType changes
  useEffect(() => {
    if (!subjectId || noteType !== 'PROJECT') {
      setProjectRestriction(null)
      return
    }
    setCheckingRestriction(true)
    fetch(`/api/admin/projects/check?subjectId=${subjectId}`)
      .then(r => r.json())
      .then(d => setProjectRestriction(d))
      .catch(() => setProjectRestriction(null))
      .finally(() => setCheckingRestriction(false))
  }, [subjectId, noteType])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId) { toast.error('Please select a subject'); return }

    // Block upload if project restriction is exceeded
    if (noteType === 'PROJECT' && projectRestriction && !projectRestriction.canUpload) {
      toast.error(`⚠️ BCA Sem ${semesterOrder} can only have 1 project per subject. Delete the existing project first.`)
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('contentType', contentType)
    fd.append('subjectId', subjectId)

    if (contentType === 'NOTE') {
      if (!noteFile) { toast.error('Please choose a file'); setUploading(false); return }
      fd.append('title', noteTitle); fd.append('description', noteDescription)
      fd.append('noteType', noteType); fd.append('isPremium', isPremium)
      fd.append('author', author); fd.append('file', noteFile)
    } else if (contentType === 'PAST_PAPER') {
      if (!paperFile) { toast.error('Please choose a file'); setUploading(false); return }
      fd.append('year', paperYear); fd.append('examType', examType); fd.append('file', paperFile)
    } else {
      if (!sheetTitle || !sheetContent) { toast.error('Title and content are required'); setUploading(false); return }
      fd.append('title', sheetTitle); fd.append('content', sheetContent)
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Uploaded successfully! 🎉')
        setNoteTitle(''); setNoteDescription(''); setAuthor('')
        setNoteFile(null); setPaperFile(null); setSheetTitle(''); setSheetContent('')
      } else { toast.error(data.error || 'Upload failed') }
    } catch { toast.error('Upload failed — network error') }
    finally { setUploading(false) }
  }

  const typeOptions = [
    { type: 'NOTE',       icon: '📄', label: 'Study Note' },
    { type: 'PAST_PAPER', icon: '📝', label: 'Past Paper' },
    { type: 'CHEATSHEET', icon: '📋', label: 'Cheatsheet' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="section-title">📤 Upload Course Materials</h3>
      <div className="glass-card" style={{ padding: '36px', maxWidth: '660px' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Content Type Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--clr-text-3)' }}>
              Material Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {typeOptions.map((item) => (
                <button
                  key={item.type} type="button"
                  onClick={() => setContentType(item.type as any)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: contentType === item.type ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${contentType === item.type ? 'transparent' : 'var(--clr-border)'}`,
                    color: contentType === item.type ? '#fff' : 'var(--clr-text-2)',
                    boxShadow: contentType === item.type ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty & Semester selects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Faculty</label>
              <select className="input-field" value={facultyId} onChange={e => setFacultyId(e.target.value)} required style={{ cursor: 'pointer' }}>
                <option value="">— Choose Faculty —</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Semester / Year</label>
              <select className="input-field" value={semesterId} onChange={e => setSemesterId(e.target.value)} required disabled={!facultyId} style={{ cursor: facultyId ? 'pointer' : 'not-allowed' }}>
                <option value="">— Choose Period —</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Subject</label>
            <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!semesterId} style={{ cursor: semesterId ? 'pointer' : 'not-allowed' }}>
              <option value="">— Choose Subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>)}
            </select>
          </div>

          {/* NOTE Fields */}
          {contentType === 'NOTE' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>
                  {noteType === 'PROJECT' ? 'Project Title' : noteType === 'LAB_WORK' ? 'Lab Work Title' : 'Note Title'}
                </label>
                <input
                  className="input-field"
                  placeholder={
                    noteType === 'PROJECT'
                      ? 'e.g. E-Commerce System with Recommendation Engine'
                      : noteType === 'LAB_WORK'
                      ? 'e.g. Computer Graphics Lab Work 1-10'
                      : 'e.g. OOP Full Notes — Chapter 1-8'
                  }
                  required
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>
                  {noteType === 'PROJECT' ? 'Project Description (Abstract & Features)' : 'Description (optional)'}
                </label>
                <textarea
                  className="input-field"
                  placeholder={
                    noteType === 'PROJECT'
                      ? 'Describe what this project does. List major features, technologies used, database system, etc.'
                      : 'What does this document cover?'
                  }
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={noteDescription}
                  onChange={e => setNoteDescription(e.target.value)}
                />
              </div>

              {/* Project Restriction Banner */}
              {noteType === 'PROJECT' && subjectId && (
                <div>
                  {checkingRestriction ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '13px', color: 'var(--clr-text-3)' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px', marginRight: '8px' }} /> Checking project restrictions...
                    </div>
                  ) : projectRestriction ? (
                    <div style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: projectRestriction.canUpload
                        ? 'rgba(16, 185, 129, 0.07)'
                        : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${
                        projectRestriction.canUpload
                          ? 'rgba(16,185,129,0.3)'
                          : 'rgba(239,68,68,0.3)'
                      }`,
                    }}>
                      {projectRestriction.isRestricted ? (
                        <>
                          <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '13px', color: projectRestriction.canUpload ? '#6ee7b7' : '#fca5a5' }}>
                            {projectRestriction.canUpload
                              ? `✅ BCA Sem ${semesterOrder}: Slot available (0/1 project uploaded)`
                              : `❌ BCA Sem ${semesterOrder}: Project limit reached (1/1)`
                            }
                          </p>
                          {!projectRestriction.canUpload && projectRestriction.existingProjects.length > 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                              Existing: <strong style={{ color: 'var(--clr-text-2)' }}>{projectRestriction.existingProjects[0].title}</strong>
                            </p>
                          )}
                          <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
                            BCA 4th, 5th & 7th semester allows only 1 project per subject.
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#6ee7b7' }}>
                          ✅ No project limit for this semester. ({projectRestriction.projectCount} project(s) already uploaded)
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Format</label>
                  <select className="input-field" value={noteType} onChange={e => setNoteType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="PDF_BOOK">📚 PDF Book</option>
                    <option value="HANDWRITTEN">✍️ Handwritten</option>
                    <option value="SLIDES_PPT">🖥️ Slides/PPTX</option>
                    <option value="SHORT_NOTES">📝 Short Notes</option>
                    <option value="PROJECT_WORK">📁 Project Work</option>
                    <option value="PROJECT">💻 Project</option>
                    <option value="GUIDE">📘 Guide</option>
                    <option value="LAB_WORK">🧪 Lab Work</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Access Tier</label>
                  <select className="input-field" value={isPremium} onChange={e => setIsPremium(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="false">🔓 Free for All</option>
                    <option value="true">💎 Premium Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Author / Credit (optional)</label>
                <input className="input-field" placeholder="e.g. Er. Ramesh Shrestha" value={author} onChange={e => setAuthor(e.target.value)} />
              </div>
              <FileDropZone label="Document (PDF, DOCX, PPTX, Images)" accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png" file={noteFile} onFile={setNoteFile} hint="Max 10 MB" required />
            </motion.div>
          )}

          {/* PAST_PAPER Fields */}
          {contentType === 'PAST_PAPER' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Exam Year</label>
                  <input className="input-field" type="number" required value={paperYear} onChange={e => setPaperYear(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Exam Category</label>
                  <select className="input-field" value={examType} onChange={e => setExamType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="BOARD_EXAM">🎓 Board Exam</option>
                    <option value="INTERNAL_EXAM">🏫 Internal Exam</option>
                    <option value="BACK_PAPER">🔄 Back Paper</option>
                  </select>
                </div>
              </div>
              <FileDropZone label="Question Paper (PDF / Images)" accept=".pdf,.jpg,.jpeg,.png" file={paperFile} onFile={setPaperFile} hint="Max 10 MB" required />
            </motion.div>
          )}

          {/* CHEATSHEET Fields */}
          {contentType === 'CHEATSHEET' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Cheatsheet Title</label>
                <input className="input-field" placeholder="e.g. .NET Quick Revision Cheatsheet" required value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Markdown Content</label>
                <textarea
                  className="input-field"
                  placeholder={'# Cheatsheet Title\n- Key concept\n- **Important term**\n\n## Section\n- Point 1'}
                  required
                  style={{ minHeight: '220px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
                  value={sheetContent}
                  onChange={e => setSheetContent(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '4px', padding: '14px' }} disabled={uploading}>
            {uploading ? <><span className="spinner" /> Uploading to Cloudinary...</> : '📤 Upload & Publish Material'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

/* ── File Drop Zone ── */
function FileDropZone({ label, accept, file, onFile, hint, required }: {
  label: string; accept: string; file: File | null; onFile: (f: File | null) => void; hint: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>{label}</label>
      <div
        style={{
          border: `2px dashed ${file ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
          borderRadius: '12px', padding: '28px',
          textAlign: 'center', background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
          position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <input
          type="file" accept={accept} required={required}
          onChange={e => onFile(e.target.files?.[0] || null)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{file ? '✅' : '📂'}</div>
        <p className="text-sm font-semibold" style={{ color: file ? 'var(--clr-primary-h)' : 'var(--clr-text-2)' }}>
          {file ? file.name : 'Click to Browse File'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--clr-text-3)' }}>{hint}</p>
      </div>
    </div>
  )
}

/* ── Faculties Tab ── */
function FacultiesTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
  }, [])

  async function toggleVisibility(facultyId: string, currentVisible: boolean) {
    try {
      const res = await fetch('/api/admin/faculties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId, visible: !currentVisible }),
      })
      if (res.ok) {
        toast.success('Faculty visibility updated! 🎉')
        setFaculties(prev => prev.map(f => f.id === facultyId ? { ...f, visible: !currentVisible } : f))
      } else {
        toast.error('Failed to update visibility')
      }
    } catch {
      toast.error('Network error updating visibility')
    }
  }

  const filtered = faculties.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>🏫 Course Catalogue</h3>
          <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
            Tick ✓ to show on frontend. Untick to hide. Students only see checked faculties.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search faculties..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '220px', padding: '8px 14px', borderRadius: '8px' }}
          />
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--clr-primary-h)', whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={async () => {
              if (!window.confirm('This will make BCA the ONLY visible faculty and hide all others. Continue?')) return
              try {
                const res = await fetch('/api/admin/faculties/set-defaults', { method: 'POST' })
                const data = await res.json()
                if (res.ok) {
                  toast.success('Done! BCA is now the only visible faculty.')
                  fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
                } else {
                  toast.error(data.error || 'Failed to reset defaults')
                }
              } catch {
                toast.error('Network error')
              }
            }}
          >
            🔄 Reset: BCA Only
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Faculty Name</th>
              <th>Code</th>
              <th>System</th>
              <th style={{ textAlign: 'center' }}>Visible on Frontend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--clr-text-3)' }}>
                  {faculties.length === 0 ? 'No faculties configured.' : 'No matching faculties found.'}
                </td>
              </tr>
            ) : (
              filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontSize: '22px' }}>{f.icon}</td>
                  <td style={{ fontWeight: 600, color: 'var(--clr-text-1)' }}>{f.name}</td>
                  <td>
                    <code style={{ background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: '4px', color: 'var(--clr-primary-h)', fontSize: '12px' }}>
                      {f.id.toUpperCase()}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${f.systemType === 'SEMESTER' ? 'badge-semester' : 'badge-free'}`}>
                      {f.systemType}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!f.visible}
                      onChange={() => toggleVisibility(f.id, !!f.visible)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--clr-primary)',
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

/* ── Stats Tab ── */
function StatsTab() {
  const [statsData, setStatsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        setStatsData(d.stats || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load material stats')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-3)' }}>
        <span className="spinner" /> Loading statistics...
      </div>
    )
  }

  const filtered = statsData.filter(fac =>
    fac.name.toLowerCase().includes(search.toLowerCase()) ||
    fac.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>📈 Course Material Statistics</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Detailed breakdown of uploaded resource counts by faculty and semester/year.
          </p>
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search stats by faculty..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px', padding: '8px 14px', borderRadius: '8px' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-3)' }}>
          {statsData.length === 0 ? 'No data available.' : 'No matching statistics found.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {filtered.map((fac) => (
            <div key={fac.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{fac.icon || '🏫'}</span>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--clr-text-1)' }}>
                    {fac.name} ({fac.id.toUpperCase()})
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                    System Type: {fac.systemType}
                  </p>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Notes</th>
                      <th>Lab Work</th>
                      <th>Project Work</th>
                      <th>Projects</th>
                      <th>Guides</th>
                      <th>Past Papers</th>
                      <th>Cheatsheets</th>
                      <th>Total Resources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fac.semesters.map((sem: any) => (
                      <tr key={sem.id}>
                        <td style={{ fontWeight: 600, color: 'var(--clr-primary-h)' }}>
                          {fac.systemType === 'YEARLY' ? `${sem.order} Year` : `Semester ${sem.order}`}
                        </td>
                        <td>{sem.notesCount}</td>
                        <td>{sem.labWorkCount || 0}</td>
                        <td>{sem.projectWorkCount}</td>
                        <td>{sem.projectCount}</td>
                        <td>{sem.guideCount}</td>
                        <td>{sem.pastPapersCount}</td>
                        <td>{sem.cheatsheetsCount}</td>
                        <td style={{ fontWeight: 700, color: 'var(--clr-accent)' }}>{sem.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
