'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'
import { AdminSkeleton } from '@/components/SkeletonLoader'
import AdminProjectsTab from '@/components/admin/AdminProjectsTab'
import AdminSellersTab from '@/components/admin/AdminSellersTab'

type AdminTab = 'overview' | 'payments' | 'faculties' | 'upload' | 'stats' | 'users' | 'materials' | 'projects' | 'sellers' | 'settings'

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
  const [user, setUser] = useState<{ role: string; name: string; email: string; packageType: string } | null>(null)
  const [tab, setTab] = useState<AdminTab>('overview')
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({ users: 0, payments: 0, pending: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [projectsExpanded, setProjectsExpanded] = useState(false)
  const [projectSubTab, setProjectSubTab] = useState<'ITEMS' | 'ORDERS'>('ITEMS')
  const [dropOpen, setDropOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('tu_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'ADMIN') { router.push('/'); return }
    setUser(u)
    setLoading(false)
  }, [router])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('tu_user')
    toast.success('See you soon! 👋')
    window.location.href = '/'
  }


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
      <div className="container" style={{ padding: '48px 32px', minHeight: 'calc(100vh - 72px)' }}>
        <AdminSkeleton />
      </div>
    )
  }

  const navItems: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'users',     icon: '👥', label: 'Users & Plans' },
    { id: 'payments',  icon: '💳', label: 'Verify Payments' },
    { id: 'sellers',   icon: '🛍️', label: 'Seller Applications' },
    { id: 'stats',     icon: '📈', label: 'Material Stats' },
    { id: 'materials', icon: '🛠️', label: 'Manage Materials' },
    { id: 'faculties', icon: '🏫', label: 'Faculties' },
    { id: 'upload',    icon: '📤', label: 'Upload Materials' },
    { id: 'settings',  icon: '⚙️', label: 'Site Settings' },
  ]

  const statCards = [
    { label: 'Registered Students', value: stats.users,    icon: '👥', accent: '#818cf8' },
    { label: 'Total Transactions',  value: stats.payments, icon: '💳', accent: '#22d3ee' },
    { label: 'Pending Verification',value: stats.pending,  icon: '⏳', accent: '#fcd34d' },
    { label: 'Total Revenue (Rs.)', value: stats.revenue,  icon: '💰', accent: '#6ee7b7' },
  ]

  return (
    <div className="admin-page-container">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`admin-sidebar-overlay ${sidebarOpen ? 'mobile-open' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* ── Left Sidebar Nav ── */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className={`admin-sidebar-nav ${sidebarOpen ? 'mobile-open' : ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          {/* Logo / Header */}
          <div className="admin-brand-header">
            <div className="nav-logo-icon">📚</div>
            <div>
              <span className="font-bold text-sm uppercase tracking-wider block" style={{ color: 'var(--clr-text-3)', fontSize: '10px' }}>SYSTEM CONTROL</span>
              <span className="font-extrabold text-lg block" style={{ color: 'var(--clr-text-1)', marginTop: '-2px' }}>TU Notes Hub</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="admin-nav-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item${tab === item.id ? ' active' : ''}`}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
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

            {/* Projects Dropdown Menu */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                className={`sidebar-item${tab === 'projects' ? ' active' : ''}`}
                onClick={() => { setTab('projects'); setProjectsExpanded(!projectsExpanded); }}
              >
                <span className="text-lg">💻</span>
                <span>Projects Market</span>
                <span style={{ marginLeft: 'auto', transform: projectsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  ▼
                </span>
              </button>
              
              {/* Dropdown Items */}
              <motion.div 
                initial={false}
                animate={{ height: projectsExpanded ? 'auto' : 0, opacity: projectsExpanded ? 1 : 0 }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px', marginTop: '4px' }}
              >
                <button
                  className="sidebar-item"
                  style={{ fontSize: '13px', padding: '8px 12px', background: tab === 'projects' && projectSubTab === 'ITEMS' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onClick={() => { setTab('projects'); setProjectSubTab('ITEMS'); }}
                >
                  <span className="text-sm">📦</span> Manage Projects
                </button>
                <button
                  className="sidebar-item"
                  style={{ fontSize: '13px', padding: '8px 12px', background: tab === 'projects' && projectSubTab === 'ORDERS' ? 'rgba(99,102,241,0.1)' : 'transparent' }}
                  onClick={() => { setTab('projects'); setProjectSubTab('ORDERS'); }}
                >
                  <span className="text-sm">🛒</span> Orders & Inquiries
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer Parameters Panel (Sleek reference style widget) */}
        <div className="admin-sidebar-footer">
          <div className="admin-param-widget">
            <div className="admin-param-label">Database Connection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--clr-success)', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--clr-success)', display: 'inline-block' }}></span>
              TiDB Serverless
            </div>
          </div>
          <div className="admin-param-widget">
            <div className="admin-param-label">CPU Usage</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--clr-text-2)', marginBottom: '4px' }}>
              <span>Load Average</span>
              <span>24%</span>
            </div>
            <div className="admin-param-bar-bg">
              <div className="admin-param-bar-fill" style={{ width: '24%' }}></div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Right Content Panel ── */}
      <div className="admin-content-wrapper">
        {/* Top Navbar */}
        <header className="admin-top-bar">
          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>

          {/* Left search input */}
          <div className="admin-search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search system logs, notes, users..." className="admin-search-input" />
          </div>

          {/* Right profile area */}
          <div className="admin-user-menu" ref={dropRef}>
            <button className="admin-user-trigger" onClick={() => setDropOpen(!dropOpen)}>
              <div className="nav-avatar" style={{ width: '36px', height: '36px', fontSize: '15px' }}>{user.name[0].toUpperCase()}</div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span className="text-sm font-semibold block" style={{ color: 'var(--clr-text-1)', lineHeight: 1.2 }}>{user.name}</span>
                <span className="text-xs block" style={{ color: 'var(--clr-text-3)', fontSize: '10.5px' }}>Administrator</span>
              </div>
              <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px', color: 'var(--clr-text-3)' }}>▼</span>
            </button>

            {dropOpen && (
              <div className="nav-dropdown" style={{ top: 'calc(100% + 6px)', right: 0 }}>
                <div className="nav-drop-header">
                  <p style={{ fontWeight: 600, color: 'var(--clr-text-1)', fontSize: '14px' }}>{user.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{user.email || 'admin@tunoteshub.com'}</p>
                </div>
                <div className="nav-drop-divider" />
                <button onClick={() => { setTab('overview'); setDropOpen(false) }} className="nav-drop-item">
                  <span>📊</span> Overview
                </button>
                <button onClick={() => router.push('/')} className="nav-drop-item">
                  <span>🏠</span> Go to Portal Home
                </button>
                <button onClick={() => router.push('/dashboard')} className="nav-drop-item">
                  <span>🎓</span> Student Dashboard
                </button>
                <div className="nav-drop-divider" />
                <button className="nav-drop-item nav-drop-danger" onClick={handleLogout}>
                  <span>🚪</span> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Tab Scroll Area */}
        <div className="admin-scrollable-content">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-primary-h)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '4px' }}>
              ADMIN CONTROL CENTER
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--clr-text-1)' }}>
              {navItems.find(item => item.id === tab)?.label || (tab === 'projects' ? 'Projects Market' : '')}
            </h2>
          </motion.div>

          {/* Tab Screen Render */}
          <main>
            {/* ── Overview Tab ── */}
            {tab === 'projects' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminProjectsTab externalSubTab={projectSubTab} />
              </motion.div>
            )}

            {tab === 'sellers' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminSellersTab />
              </motion.div>
            )}

            {tab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <SiteSettingsTab />
              </motion.div>
            )}

            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Stat Cards */}
                <div className="admin-stat-grid">
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
                      className="btn btn-primary btn-sm"
                      onClick={() => setTab('payments')}
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000', fontWeight: 700 }}
                    >
                      Verify Now ↗
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Verify Payments Tab ── */}
            {tab === 'payments' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="section-title">💳 Verify Student Transactions</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student Details</th>
                        <th>Amount</th>
                        <th>Plan Bought</th>
                        <th>Transaction ID</th>
                        <th>Screenshot Proof</th>
                        <th>Status / Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-text-3)' }}>
                            No payment transactions recorded.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontSize: '13px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.user?.name || 'Deleted User'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>{p.user?.email || '—'}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--clr-text-1)' }}>Rs. {p.amount}</td>
                            <td>
                              <span className={`badge ${p.packageBought === 'ELITE_AI' ? 'badge-elite' : 'badge-semester'}`}>
                                {p.packageBought.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                {p.transactionId}
                              </code>
                            </td>
                            <td>
                              {p.screenshotUrl ? (
                                <a
                                  href={p.screenshotUrl}
                                  target="_blank" rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  🖼️ View Screenshot
                                </a>
                              ) : (
                                <span style={{ color: 'var(--clr-text-3)', fontSize: '12px' }}>No file</span>
                              )}
                            </td>
                            <td>
                              {p.status !== 'PENDING' ? (
                                <span className={`badge ${p.status === 'APPROVED' ? 'badge-strong' : 'badge-low'}`}>
                                  {p.status}
                                </span>
                              ) : (
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

            {/* ── Users Tab ── */}
            {tab === 'users' && <UsersTab />}

            {/* ── Manage Materials Tab ── */}
            {tab === 'materials' && <ManageMaterialsTab />}

            {/* ── Upload Tab ── */}
            {tab === 'upload' && <UploadTab />}
          </main>
        </div>
      </div>
    </div>
  )
}

/* ── Manage Materials Tab ── */
function ManageMaterialsTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [semesters, setSemesters] = useState<{ id: string; name: string; order: number }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string; title: string }[]>([])
  const [facultyId, setFacultyId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState<any[]>([])
  const [pastPapers, setPastPapers] = useState<any[]>([])
  const [cheatsheets, setCheatsheets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [editType, setEditType] = useState('')
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
  }, [])

  useEffect(() => {
    if (!facultyId) { setSemesters([]); setSemesterId(''); return }
    fetch(`/api/admin/semesters?facultyId=${facultyId}`).then(r => r.json()).then(d => setSemesters(d.semesters || []))
  }, [facultyId])

  useEffect(() => {
    if (!semesterId) { setSubjects([]); setSubjectId(''); return }
    fetch(`/api/admin/subjects?semesterId=${semesterId}`).then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [semesterId])

  async function loadMaterials() {
    if (!subjectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/materials?subjectId=${subjectId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
        setPastPapers(data.pastPapers || [])
        setCheatsheets(data.cheatsheets || [])
      } else {
        toast.error('Failed to load materials')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (subjectId) loadMaterials()
    else { setNotes([]); setPastPapers([]); setCheatsheets([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  function openEdit(item: any, type: string) {
    setEditItem(item)
    setEditType(type)
    if (type === 'note') {
      setEditForm({ title: item.title, description: item.description || '', noteType: item.noteType, isPremium: item.isPremium, author: item.author || '' })
    } else if (type === 'pastpaper') {
      setEditForm({ year: item.year, examType: item.examType })
    } else {
      setEditForm({ title: item.title, content: item.content })
    }
  }

  async function handleSave() {
    if (!editItem) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, type: editType, ...editForm }),
      })
      if (res.ok) {
        toast.success('Updated successfully! 🎉')
        setEditItem(null)
        loadMaterials()
      } else {
        toast.error('Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, type: string, name: string) {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete "${name}"?\n\nThis will also remove the file from Cloudinary. This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/materials?id=${id}&type=${type}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Deleted successfully!')
        loadMaterials()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const totalItems = notes.length + pastPapers.length + cheatsheets.length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="section-title">🛠️ Manage Materials</h3>
      <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '20px' }}>
        Select a Faculty → Semester → Subject to view, edit, or delete uploaded documents.
      </p>

      {/* Filter Dropdowns */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Faculty</label>
            <select className="input-field" value={facultyId} onChange={e => { setFacultyId(e.target.value); setSemesterId(''); setSubjectId('') }} style={{ cursor: 'pointer' }}>
              <option value="">— Choose Faculty —</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Semester / Year</label>
            <select className="input-field" value={semesterId} onChange={e => { setSemesterId(e.target.value); setSubjectId('') }} disabled={!facultyId} style={{ cursor: facultyId ? 'pointer' : 'not-allowed' }}>
              <option value="">— Choose Period —</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Subject</label>
            <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!semesterId} style={{ cursor: semesterId ? 'pointer' : 'not-allowed' }}>
              <option value="">— Choose Subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {!subjectId ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '15px' }}>Select a subject above to manage its materials.</p>
        </div>
      ) : loading ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
          <p style={{ color: 'var(--clr-text-3)', marginTop: '12px' }}>Loading materials...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '15px' }}>No materials uploaded for this subject yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Notes Section */}
          {notes.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📄 Notes ({notes.length})
              </h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Access</th>
                      <th>Downloads</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map(n => (
                      <tr key={n.id}>
                        <td>
                          <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          {n.author && <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>by {n.author}</div>}
                        </td>
                        <td><span className="badge badge-semester" style={{ fontSize: '11px' }}>{n.noteType?.replace('_', ' ')}</span></td>
                        <td><span className={`badge ${n.isPremium ? 'badge-elite' : 'badge-success'}`}>{n.isPremium ? '💎 Premium' : '🔓 Free'}</span></td>
                        <td style={{ fontWeight: 600 }}>{n.downloadCount || 0}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(n.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(n, 'note')}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.id, 'note', n.title)}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past Papers Section */}
          {pastPapers.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📝 Past Papers ({pastPapers.length})
              </h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Exam Type</th>
                      <th>File</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastPapers.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, fontSize: '16px' }}>{p.year}</td>
                        <td><span className="badge badge-pending">{p.examType?.replace('_', ' ')}</span></td>
                        <td>
                          <a href={p.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>
                            View File ↗
                          </a>
                        </td>
                        <td style={{ fontSize: '12px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(p, 'pastpaper')}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, 'pastpaper', `${p.year} ${p.examType}`)}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cheatsheets Section */}
          {cheatsheets.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📋 Cheatsheets ({cheatsheets.length})
              </h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Content Preview</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cheatsheets.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td style={{ fontSize: '12px', color: 'var(--clr-text-3)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content?.substring(0, 80)}...</td>
                        <td style={{ fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(c, 'cheatsheet')}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id, 'cheatsheet', c.title)}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setEditItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '32px', maxWidth: '520px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
              ✏️ Edit {editType === 'note' ? 'Note' : editType === 'pastpaper' ? 'Past Paper' : 'Cheatsheet'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editType === 'note' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Title</label>
                    <input className="input-field" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Description</label>
                    <textarea className="input-field" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ minHeight: '80px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Format</label>
                      <select className="input-field" value={editForm.noteType || ''} onChange={e => setEditForm({ ...editForm, noteType: e.target.value })} style={{ cursor: 'pointer' }}>
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
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Access</label>
                      <select className="input-field" value={editForm.isPremium ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, isPremium: e.target.value === 'true' })} style={{ cursor: 'pointer' }}>
                        <option value="false">🔓 Free</option>
                        <option value="true">💎 Premium</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Author</label>
                    <input className="input-field" value={editForm.author || ''} onChange={e => setEditForm({ ...editForm, author: e.target.value })} />
                  </div>
                </>
              )}

              {editType === 'pastpaper' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Year</label>
                    <input className="input-field" type="number" value={editForm.year || ''} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Exam Type</label>
                    <select className="input-field" value={editForm.examType || ''} onChange={e => setEditForm({ ...editForm, examType: e.target.value })} style={{ cursor: 'pointer' }}>
                      <option value="BOARD_EXAM">🎓 Board Exam</option>
                      <option value="INTERNAL_EXAM">🏫 Internal Exam</option>
                      <option value="BACK_PAPER">🔄 Back Paper</option>
                    </select>
                  </div>
                </div>
              )}

              {editType === 'cheatsheet' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Title</label>
                    <input className="input-field" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Content (Markdown)</label>
                    <textarea className="input-field" value={editForm.content || ''} onChange={e => setEditForm({ ...editForm, content: e.target.value })} style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-2)' }} onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', border: 'none', fontWeight: 700 }} onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

/* ── Users Tab ── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function updateUserPlan(userId: string, packageType: string, months: number) {
    const label = packageType === 'FREE' ? 'Free' : packageType === 'SEMESTER_PASS' ? 'Semester Pass' : 'Elite AI'
    if (!window.confirm(`Are you sure you want to set this user's plan to "${label}"?`)) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, packageType, months }),
      })
      if (res.ok) {
        toast.success('User plan updated successfully! 🎉')
        fetchUsers()
      } else {
        toast.error('Failed to update user plan')
      }
    } catch {
      toast.error('Network error')
    }
  }

  async function handleUpdateDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'User details updated! ✅')
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to update user details')
      }
    } catch {
      toast.error('Failed to save details')
    } finally {
      setUpdating(false)
    }
  }

  function startEdit(u: any) {
    setEditingUser(u)
    setEditName(u.name || '')
    setEditEmail(u.email || '')
    setEditRole(u.role || 'STUDENT')
  }

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>👥 Users & Plans</h3>
          <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
            Manage registered students, grant premium access manually, and view active subscriptions.
          </p>
        </div>
        <div>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: '260px', padding: '8px 14px', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Role</th>
              <th>Current Plan</th>
              <th>Subscription Expires</th>
              <th>Actions (Grant Access & Edit)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" /> Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--clr-text-3)' }}>No users found.</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name || 'Unknown'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{u.email}</div>
                    <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', marginTop: '2px' }}>
                      Joined: {new Date(u.createdAt).toLocaleDateString()}
                      {u.isEmailVerified ? ' ✅' : ' ⚠️ unverified'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-elite' : 'badge-low'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.packageType === 'ELITE_AI' ? 'badge-elite' : u.packageType === 'SEMESTER_PASS' ? 'badge-success' : 'badge-low'}`}>
                      {u.packageType === 'ELITE_AI' ? '💎 Elite AI' : u.packageType === 'SEMESTER_PASS' ? '🎓 Sem Pass' : '🆓 Free'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--clr-text-2)' }}>
                    {u.subscriptionExpiresAt
                      ? new Date(u.subscriptionExpiresAt).toLocaleDateString('en-NP', { dateStyle: 'medium' })
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="btn btn-sm btn-outline" style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={() => startEdit(u)}>
                        ✏️ Edit Details
                      </button>
                      <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => updateUserPlan(u.id, 'SEMESTER_PASS', 6)}>
                        + Sem Pass (6m)
                      </button>
                      <button className="btn btn-sm" style={{ background: 'rgba(217,70,239,0.12)', color: '#e879f9', border: '1px solid rgba(217,70,239,0.3)' }} onClick={() => updateUserPlan(u.id, 'ELITE_AI', 12)}>
                        + Elite (1yr)
                      </button>
                      {u.packageType !== 'FREE' && (
                        <button className="btn btn-sm btn-danger" onClick={() => updateUserPlan(u.id, 'FREE', 0)}>
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Details Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>✏️ Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                <input type="text" required className="input-field" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                <input type="email" required className="input-field" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>System Role</label>
                <select className="input-field" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={updating}>
                  {updating ? 'Saving...' : '💾 Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}


/* ── Upload Tab ── */
function UploadTab() {
  const [contentType, setContentType] = useState<'NOTE' | 'PAST_PAPER' | 'CHEATSHEET' | 'SOLUTION_BOOK'>('NOTE')
  const [sourceType, setSourceType] = useState<'FILE' | 'DRIVE'>('FILE')
  const [driveLink, setDriveLink] = useState('')
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

  // Helper: extract Google Drive file ID from share link
  function parseDriveLink(link: string): string | null {
    const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }
  function normalizeDriveUrl(link: string): string {
    const fileId = parseDriveLink(link)
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : link
  }

  useEffect(() => {
    if (!semesterId) { setSubjects([]); setSubjectId(''); return }
    const sem = semesters.find(s => s.id === semesterId)
    if (sem) setSemesterOrder(sem.order || 0)
    if (contentType !== 'SOLUTION_BOOK')
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

    // ── SOLUTION BOOK path ──
    if (contentType === 'SOLUTION_BOOK') {
      if (!semesterId) { toast.error('Please select faculty and semester'); return }
      if (!noteTitle) { toast.error('Please enter a title'); return }
      setUploading(true)
      let cloudinaryUrl = ''
      let fileSize = ''
      if (sourceType === 'DRIVE') {
        if (!driveLink) { toast.error('Please enter a Google Drive link'); setUploading(false); return }
        const fileId = parseDriveLink(driveLink)
        if (!fileId) { toast.error('Invalid Drive link — use the share link from Google Drive'); setUploading(false); return }
        cloudinaryUrl = normalizeDriveUrl(driveLink)
        fileSize = 'Drive'
      } else {
        if (!noteFile) { toast.error('Please choose a file'); setUploading(false); return }
        if (noteFile.size > 100 * 1024 * 1024) { toast.error('Max 100MB'); setUploading(false); return }
        toast.loading('Uploading...', { toastId: 'upload-progress' })
        try {
          const sigRes = await fetch('/api/upload/signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'tu-notes-hub/solution-books' }) })
          if (!sigRes.ok) { toast.dismiss('upload-progress'); toast.error('Signature error'); setUploading(false); return }
          const { timestamp, signature, cloudName, apiKey, folder: sf } = await sigRes.json()
          
          const ext = noteFile.name.split('.').pop()?.toLowerCase() || ''
          const rt = ['jpg','jpeg','png','webp'].includes(ext) ? 'image' : 'raw'
          
          // Chunked upload implementation
          const chunkSize = 6 * 1024 * 1024 // Cloudinary requires chunks > 5MB
          const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36)
          let finalUrl = ''
          
          for (let start = 0; start < noteFile.size; start += chunkSize) {
            const end = Math.min(start + chunkSize, noteFile.size)
            const chunk = noteFile.slice(start, end)
            
            const cf = new FormData()
            cf.append('file', chunk)
            cf.append('api_key', apiKey)
            cf.append('timestamp', String(timestamp))
            cf.append('signature', signature)
            cf.append('folder', sf)
            
            const cr = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${rt}/upload`, {
              method: 'POST',
              headers: {
                'X-Unique-Upload-Id': uniqueUploadId,
                'Content-Range': `bytes ${start}-${end - 1}/${noteFile.size}`
              },
              body: cf
            })
            
            const cd = await cr.json()
            if (!cr.ok) { toast.dismiss('upload-progress'); toast.error(cd.error?.message || 'Upload failed'); setUploading(false); return }
            if (cd.secure_url) finalUrl = cd.secure_url
          }
          
          if (!finalUrl) throw new Error('Failed to get secure URL')
          cloudinaryUrl = finalUrl; fileSize = `${(noteFile.size / 1024 / 1024).toFixed(2)} MB`
        } catch (err: any) { toast.dismiss('upload-progress'); toast.error(err.message || 'Upload error'); setUploading(false); return }
      }
      toast.dismiss('upload-progress')
      toast.loading('Saving...', { toastId: 'upload-progress' })
      const saveRes = await fetch('/api/upload/solution-book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ semesterId, title: noteTitle, description: noteDescription, cloudinaryUrl, fileSize, isPremium, author }) })
      const sd = await saveRes.json()
      toast.dismiss('upload-progress')
      if (saveRes.ok) { toast.success('Solution book published! 🎉'); setNoteTitle(''); setNoteDescription(''); setAuthor(''); setNoteFile(null); setDriveLink('') }
      else { toast.error(sd.error || 'Failed to save') }
      setUploading(false); return
    }

    if (!subjectId) { toast.error('Please select a subject'); return }

    // Block upload if project restriction is exceeded
    if (noteType === 'PROJECT' && projectRestriction && !projectRestriction.canUpload) {
      toast.error(`⚠️ BCA Sem ${semesterOrder} can only have 1 project per subject. Delete the existing project first.`)
      return
    }

    // For cheatsheets, no file upload needed — use old path
    if (contentType === 'CHEATSHEET') {
      if (!sheetTitle || !sheetContent) { toast.error('Title and content are required'); return }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('contentType', 'CHEATSHEET')
        fd.append('subjectId', subjectId)
        fd.append('title', sheetTitle)
        fd.append('content', sheetContent)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok) {
          toast.success(data.message || 'Cheatsheet created! 🎉')
          setSheetTitle(''); setSheetContent('')
        } else { toast.error(data.error || 'Failed to create cheatsheet') }
      } catch { toast.error('Network error') }
      finally { setUploading(false) }
      return
    }

    // ── Google Drive link path ──
    if (sourceType === 'DRIVE') {
      if (!driveLink) { toast.error('Please enter a Google Drive link'); return }
      const fileId = parseDriveLink(driveLink)
      if (!fileId) { toast.error('Invalid Drive link — use the share link from Google Drive'); return }
      setUploading(true)
      toast.loading('Saving Drive link...', { toastId: 'upload-progress' })
      const payload: any = { contentType, subjectId, cloudinaryUrl: normalizeDriveUrl(driveLink), fileSize: 'Drive Link' }
      if (contentType === 'NOTE') {
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title required'); setUploading(false); return }
        payload.title = noteTitle; payload.description = noteDescription; payload.noteType = noteType; payload.isPremium = isPremium; payload.author = author
      } else {
        if (!paperYear) { toast.dismiss('upload-progress'); toast.error('Year required'); setUploading(false); return }
        payload.year = paperYear; payload.examType = examType
      }
      try {
        const sr = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const sd = await sr.json()
        if (sr.ok) { toast.success(sd.message || 'Saved! 🎉'); setNoteTitle(''); setNoteDescription(''); setAuthor(''); setNoteFile(null); setPaperFile(null); setDriveLink('') }
        else { toast.error(sd.error || 'Failed') }
      } catch (error) {
        console.error(error)
        toast.error('A network error occurred. Please try again.')
      } finally {
        toast.dismiss('upload-progress')
        setUploading(false)
      }
      return
    }

    // ── File upload path ──
    const fileToUpload = contentType === 'NOTE' ? noteFile : paperFile
    if (!fileToUpload) { toast.error('Please choose a file'); return }

    const maxSizeMB = 100
    if (fileToUpload.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large! Max size is ${maxSizeMB}MB.`)
      return
    }

    setUploading(true)

    try {
      // Determine the cloud folder path
      const subject = await fetch(`/api/admin/subjects/${subjectId}`).then(r => r.json()).catch(() => null)
      const fileExtension = fileToUpload.name.split('.').pop()?.toLowerCase() || ''
      const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)
      const resourceType = isImage ? 'image' : 'raw'

      // Build folder path (same pattern as original backend)
      let typeFolder = ''
      if (contentType === 'NOTE') {
        typeFolder = noteType.toLowerCase()
      } else {
        typeFolder = 'past-papers'
      }
      const folder = `tu-notes-hub/${typeFolder}`

      // Step 1: Get upload signature from our backend
      toast.loading('Preparing upload...', { toastId: 'upload-progress' })
      const sigRes = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      })
      if (!sigRes.ok) {
        const err = await sigRes.json()
        toast.dismiss('upload-progress'); toast.error(err.error || 'Failed to get upload signature')
        return
      }
      const { timestamp, signature, cloudName, apiKey, folder: signedFolder } = await sigRes.json()

      // Step 2: Upload directly to Cloudinary using chunked upload (bypasses Vercel size limit!)
      toast.loading('Uploading file to cloud...', { toastId: 'upload-progress' })
      
      const chunkSize = 6 * 1024 * 1024 // Cloudinary requires chunks > 5MB
      const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      let finalUrl = ''
      
      for (let start = 0; start < fileToUpload.size; start += chunkSize) {
        const end = Math.min(start + chunkSize, fileToUpload.size)
        const chunk = fileToUpload.slice(start, end)
        
        const cloudForm = new FormData()
        cloudForm.append('file', chunk)
        cloudForm.append('api_key', apiKey)
        cloudForm.append('timestamp', String(timestamp))
        cloudForm.append('signature', signature)
        cloudForm.append('folder', signedFolder)
        
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { 
            method: 'POST', 
            headers: {
              'X-Unique-Upload-Id': uniqueUploadId,
              'Content-Range': `bytes ${start}-${end - 1}/${fileToUpload.size}`
            },
            body: cloudForm 
          }
        )
        const cloudData = await cloudRes.json()
        
        if (!cloudRes.ok) {
          toast.dismiss('upload-progress'); toast.error(cloudData.error?.message || 'Cloudinary upload failed')
          return
        }
        if (cloudData.secure_url) {
          finalUrl = cloudData.secure_url
        }
      }

      if (!finalUrl) {
        toast.dismiss('upload-progress'); toast.error('Cloudinary upload failed to complete')
        return
      }

      const cloudinaryUrl = finalUrl
      const fileSize = `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`

      // Step 3: Save metadata to our database
      toast.loading('Saving to database...', { toastId: 'upload-progress' })
      const payload: any = {
        contentType,
        subjectId,
        cloudinaryUrl,
        fileSize,
      }

      if (contentType === 'NOTE') {
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title is required'); return }
        payload.title = noteTitle
        payload.description = noteDescription
        payload.noteType = noteType
        payload.isPremium = isPremium
        payload.author = author
      } else if (contentType === 'PAST_PAPER') {
        if (!paperYear) { toast.dismiss('upload-progress'); toast.error('Year is required'); return }
        payload.year = paperYear
        payload.examType = examType
      }

      const saveRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const saveData = await saveRes.json()

      if (saveRes.ok) {
        toast.dismiss('upload-progress'); toast.success(saveData.message || 'Uploaded successfully! 🎉')
        setNoteTitle(''); setNoteDescription(''); setAuthor('')
        setNoteFile(null); setPaperFile(null)
      } else {
        toast.dismiss('upload-progress'); toast.error(saveData.error || 'Failed to save to database')
      }
    } catch (err) {
      console.error('[UPLOAD ERROR]', err)
      toast.dismiss('upload-progress')
      toast.error('Upload failed — please try again')
    } finally {
      toast.dismiss('upload-progress')
      setUploading(false)
    }
  }


  const typeOptions = [
    { type: 'NOTE',          icon: '📄', label: 'Study Note' },
    { type: 'PAST_PAPER',    icon: '📝', label: 'Past Paper' },
    { type: 'CHEATSHEET',    icon: '📋', label: 'Cheatsheet' },
    { type: 'SOLUTION_BOOK', icon: '📚', label: 'Solution Book' },
  ]

  const isSolutionBook = contentType === 'SOLUTION_BOOK'

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
            {isSolutionBook && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '10px', fontSize: '13px', color: '#67e8f9' }}>
                📚 <strong>Solution Book</strong> — applies to all subjects in a semester. No subject selection needed.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
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

          {/* Source Type Toggle */}
          {contentType !== 'CHEATSHEET' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--clr-text-3)' }}>File Source</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ v: 'FILE', icon: '📁', label: 'Upload File (Max 10MB)' }, { v: 'DRIVE', icon: '🔗', label: 'Google Drive Link' }].map(s => (
                  <button key={s.v} type="button" onClick={() => setSourceType(s.v as any)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: 'all 0.2s',
                      background: sourceType === s.v ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sourceType === s.v ? 'rgba(99,102,241,0.5)' : 'var(--clr-border)'}`,
                      color: sourceType === s.v ? 'var(--clr-primary-h)' : 'var(--clr-text-2)',
                    }}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
              {sourceType === 'DRIVE' && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fcd34d' }}>
                  ⚠️ Make sure the file is shared as <strong>"Anyone with the link can view"</strong> in Google Drive.
                </div>
              )}
            </div>
          )}

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

          {/* Subject — hidden for Solution Books */}
          {contentType !== 'SOLUTION_BOOK' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Subject</label>
              <select className="input-field" value={subjectId} onChange={e => setSubjectId(e.target.value)} required disabled={!semesterId} style={{ cursor: semesterId ? 'pointer' : 'not-allowed' }}>
                <option value="">— Choose Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>)}
              </select>
            </div>
          )}

          {/* Google Drive Link Input */}
          {sourceType === 'DRIVE' && contentType !== 'CHEATSHEET' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>🔗 Google Drive Share Link</label>
              <input
                className="input-field"
                type="url"
                placeholder="https://drive.google.com/file/d/xxxxxxxxxx/view?usp=sharing"
                value={driveLink}
                onChange={e => setDriveLink(e.target.value)}
                required
              />
              {driveLink && parseDriveLink(driveLink) && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6ee7b7' }}>
                  ✅ Valid Drive link — File ID: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{parseDriveLink(driveLink)}</code>
                </p>
              )}
              {driveLink && !parseDriveLink(driveLink) && (
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#fca5a5' }}>❌ Invalid link. Paste the full share link from Google Drive.</p>
              )}
            </motion.div>
          )}

          {/* NOTE Fields */}
          {(contentType === 'NOTE' || contentType === 'SOLUTION_BOOK') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>
                  {isSolutionBook ? 'Solution Book Title' : noteType === 'PROJECT' ? 'Project Title' : noteType === 'LAB_WORK' ? 'Lab Work Title' : 'Note Title'}
                </label>
                <input
                  className="input-field"
                  placeholder={
                    isSolutionBook ? 'e.g. BCA Semester 4 Full Solution Book 2081'
                    : noteType === 'PROJECT' ? 'e.g. E-Commerce System with Recommendation Engine'
                    : noteType === 'LAB_WORK' ? 'e.g. Computer Graphics Lab Work 1-10'
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
                {!isSolutionBook && <div>
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
                </div>}
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
              {sourceType === 'FILE' && <FileDropZone label="Document (PDF, DOCX, PPTX, Images)" accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png" file={noteFile} onFile={setNoteFile} hint="Max 100 MB — uploads directly to Cloudinary" required />}
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
              {sourceType === 'FILE' && <FileDropZone label="Question Paper (PDF / Images)" accept=".pdf,.jpg,.jpeg,.png" file={paperFile} onFile={setPaperFile} hint="Max 100 MB — uploads directly to Cloudinary" required />}
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
            {uploading ? <><span className="spinner" /> Processing...</>
              : isSolutionBook ? '📚 Publish Solution Book'
              : sourceType === 'DRIVE' ? '🔗 Save Drive Link & Publish'
              : '📤 Upload & Publish Material'}
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

  const sortedStatsData = [...statsData].map(fac => {
    // Sort semesters by total resources descending
    const sortedSemesters = [...fac.semesters].sort((a, b) => (b.total || 0) - (a.total || 0))
    const facultyTotal = sortedSemesters.reduce((sum, sem) => sum + (sem.total || 0), 0)
    return { ...fac, semesters: sortedSemesters, facultyTotal }
  }).sort((a, b) => b.facultyTotal - a.facultyTotal)

  const filtered = sortedStatsData.filter(fac =>
    fac.name.toLowerCase().includes(search.toLowerCase()) ||
    fac.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>📈 Course Material Statistics</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Detailed breakdown of uploaded resource counts by faculty and semester/year. Sorted by most resources.
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
                    {fac.name} ({fac.id.toUpperCase()}) <span style={{ color: 'var(--clr-primary-h)', fontSize: '14px', marginLeft: '8px' }}>• {fac.facultyTotal} Resources</span>
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

/* ── Site Settings Tab ── */
function SiteSettingsTab() {
  const [whatsappLink, setWhatsappLink] = useState('')
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null)
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { 
        if (d.settings) {
          setWhatsappLink(d.settings.whatsappLink)
          if (d.settings.paymentQrUrl) setPaymentQrUrl(d.settings.paymentQrUrl)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.')
        return
      }
      setPaymentQrFile(file)
      setPaymentQrUrl(URL.createObjectURL(file))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('whatsappLink', whatsappLink)
      if (paymentQrFile) fd.append('paymentQr', paymentQrFile)

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        body: fd,
      })
      if (res.ok) {
        toast.success('Settings saved! ✅')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-3xl font-bold mb-2">⚙️ Site Settings</h2>
      <p style={{ color: 'var(--clr-text-2)', marginBottom: '32px' }}>Manage platform-wide settings.</p>

      <div className="glass-card" style={{ padding: '36px', maxWidth: '600px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                💬 WhatsApp Contact Link
              </label>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '10px', lineHeight: 1.5 }}>
                This link is shown to verified sellers in their Seller Center for direct admin contact. Use format: <code style={{ color: '#a5b4fc' }}>https://wa.me/977XXXXXXXXXX</code>
              </p>
              <input
                type="url"
                required
                className="input-field"
                placeholder="https://wa.me/9779800000000"
                value={whatsappLink}
                onChange={e => setWhatsappLink(e.target.value)}
              />
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: '#6ee7b7', textDecoration: 'underline' }}
                >
                  ↗ Test Link
                </a>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                📷 Payment QR Code
              </label>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '10px', lineHeight: 1.5 }}>
                Upload your eSewa, Khalti, or Mobile Banking QR code. Buyers will scan this QR to pay for projects.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', border: '2px dashed rgba(99,102,241,0.25)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>📸</span>
                    <span style={{ fontSize: '13px', color: 'var(--clr-text-2)', fontWeight: 600 }}>
                      {paymentQrFile ? paymentQrFile.name : 'Click to upload QR Image'}
                    </span>
                  </div>
                </div>
                {(paymentQrUrl || paymentQrFile) && (
                  <div style={{ width: '120px', height: '120px', position: 'relative', background: '#fff', borderRadius: '12px', padding: '8px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Use standard img tag for blob URLs to avoid Next/Image host config issues during preview */}
                    <img src={paymentQrUrl!} alt="QR Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '20px' }}>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Saving…</> : '💾 Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  )
}
