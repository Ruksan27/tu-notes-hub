'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'
import { AdminSkeleton } from '@/components/SkeletonLoader'
import AdminProjectsTab from '@/components/admin/AdminProjectsTab'
import AdminSellersTab from '@/components/admin/AdminSellersTab'
import AdminPricingTab from '@/components/admin/AdminPricingTab'
import AdminSeoTab from '@/components/admin/AdminSeoTab'
import AdminBackupTab from '@/components/admin/AdminBackupTab'
import ExamPaperViewer, { ExamPaperData } from '@/components/ExamPaperViewer'
import MarkdownPaperViewer from '@/components/MarkdownPaperViewer'
import { parseLegacyMarkdownToExamData } from '@/lib/legacyParser'
type AdminTab = 'overview' | 'payments' | 'faculties' | 'semesters' | 'upload' | 'stats' | 'users' | 'materials' | 'projects' | 'sellers' | 'settings' | 'pricing' | 'seo' | 'backup'

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
  const [sysInfo, setSysInfo] = useState({ cpu: 0, mem: 0 })
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

  // Fetch system info only once on load to avoid server strain
  useEffect(() => {
    const fetchSysInfo = async () => {
      try {
        const res = await fetch('/api/admin/sysinfo')
        if (res.ok) {
          const data = await res.json()
          setSysInfo({ cpu: data.cpu.loadAverage, mem: data.memory.percent })
        }
      } catch (e) {
        // ignore
      }
    }
    fetchSysInfo()
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
    { id: 'seo',       icon: '🔍', label: 'SEO Dashboard' },
    { id: 'users',     icon: '👥', label: 'Users & Plans' },
    { id: 'payments',  icon: '💳', label: 'Verify Payments' },
    { id: 'sellers',   icon: '🛍️', label: 'Seller Applications' },
    { id: 'stats',     icon: '📈', label: 'Material Stats' },
    { id: 'materials', icon: '🛠️', label: 'Manage Materials' },
    { id: 'faculties', icon: '🏫', label: 'Faculties' },
    { id: 'semesters', icon: '🗓️', label: 'Semester Visibility' },
    { id: 'upload',    icon: '📤', label: 'Upload Materials' },
    { id: 'pricing',   icon: '💰', label: 'Pricing Plans' },
    { id: 'settings',  icon: '⚙️', label: 'Site Settings' },
    { id: 'backup',    icon: '💾', label: 'Data Backup' },
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
            {tab === 'seo' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminSeoTab onNavigateTab={(t) => setTab(t)} />
              </motion.div>
            )}

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

            {tab === 'backup' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminBackupTab />
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

            {/* ── Semesters Tab ── */}
            {tab === 'semesters' && <SemestersTab />}

            {/* ── Stats Tab ── */}
            {tab === 'stats' && <StatsTab />}

            {/* ── Users Tab ── */}
            {tab === 'users' && <UsersTab />}

            {/* ── Manage Materials Tab ── */}
            {tab === 'materials' && <ManageMaterialsTab />}


            {/* ── Upload Tab ── */}
            {tab === 'upload' && <UploadTab />}

            {/* ── Pricing Plans Tab ── */}
            {tab === 'pricing' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminPricingTab />
              </motion.div>
            )}
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
  const [solutionBooks, setSolutionBooks] = useState<any[]>([])
  const [mcqs, setMcqs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [editType, setEditType] = useState('')
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [ocrRunningId, setOcrRunningId] = useState<string | null>(null)
  const [showAddMcq, setShowAddMcq] = useState(false)
  const [newMcq, setNewMcq] = useState<any>({ question: '', options: ['', '', '', ''], correctOption: 0, explanation: '', year: new Date().getFullYear(), examCategory: 'BOARD_EXAM' })
  
  // Paper Viewer & Text Editor modal states
  const [viewPaperItem, setViewPaperItem] = useState<{ id: string; type: 'pastpaper' | 'note'; title: string; extractedText: string; cloudinaryUrl: string } | null>(null)
  const [viewPaperMode, setViewPaperMode] = useState<'PREVIEW' | 'EDIT'>('PREVIEW')
  const [editTextValue, setEditTextValue] = useState('')
  const [savingPaperText, setSavingPaperText] = useState(false)

  function openPaperViewer(item: any, type: 'pastpaper' | 'note', title: string) {
    setViewPaperItem({ id: item.id, type, title, extractedText: item.extractedText || '', cloudinaryUrl: item.cloudinaryUrl })
    setEditTextValue(item.extractedText || '')
    setViewPaperMode('PREVIEW')
  }

  async function handleSavePaperText() {
    if (!viewPaperItem) return
    setSavingPaperText(true)
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: viewPaperItem.id,
          type: viewPaperItem.type,
          extractedText: editTextValue
        })
      })
      if (res.ok) {
        toast.success('Extracted text updated successfully! 🎉')
        setViewPaperItem({ ...viewPaperItem, extractedText: editTextValue })
        setViewPaperMode('PREVIEW')
        loadMaterials()
      } else {
        toast.error('Failed to update text')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingPaperText(false)
    }
  }

  const [manageMcqSet, setManageMcqSet] = useState<{ label: string; items: any[] } | null>(null)
  const [editMcqSetItem, setEditMcqSetItem] = useState<{ label: string; year: any; examCategory: any; ids: string[] } | null>(null)
  const [editMcqSetForm, setEditMcqSetForm] = useState<{ year: string; examCategory: string }>({ year: '', examCategory: 'BOARD_EXAM' })
  const [savingMcqSet, setSavingMcqSet] = useState(false)

  function openEditMcqSet(setObj: { label: string; year: any; examCategory: any; items: any[] }) {
    setEditMcqSetItem({
      label: setObj.label,
      year: setObj.year,
      examCategory: setObj.examCategory,
      ids: setObj.items.map(i => i.id)
    })
    setEditMcqSetForm({
      year: setObj.year ? `${setObj.year}` : '',
      examCategory: setObj.examCategory || 'BOARD_EXAM'
    })
  }

  async function handleSaveMcqSet() {
    if (!editMcqSetItem) return
    setSavingMcqSet(true)
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mcq-set',
          ids: editMcqSetItem.ids,
          year: editMcqSetForm.year ? parseInt(editMcqSetForm.year) : null,
          examCategory: editMcqSetForm.examCategory
        })
      })
      if (res.ok) {
        toast.success('MCQ Collection details updated! 🎉')
        setEditMcqSetItem(null)
        loadMaterials()
      } else {
        toast.error('Failed to update MCQ Collection')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingMcqSet(false)
    }
  }

  function openMcqPaperViewer() {
    if (mcqs.length === 0) {
      toast.error('No MCQs available for this subject')
      return
    }
    const currentSub = subjects.find(s => s.id === subjectId)
    const paperJson = {
      university: 'TRIBHUVAN UNIVERSITY',
      faculty: 'Faculty of Humanities & Social Sciences',
      office: 'OFFICE OF THE DEAN',
      year: new Date().getFullYear().toString(),
      program: 'Bachelor in Computer Application',
      courseTitle: currentSub?.name || 'Multiple Choice Questions',
      codeNo: currentSub?.code || '',
      semester: 'Semester',
      fullMarks: (mcqs.length * 1).toString(),
      passMarks: Math.ceil(mcqs.length * 0.4).toString(),
      time: '1 hour',
      instruction: 'Attempt all questions. Correct answers are highlighted in green.',
      groups: [
        {
          groupName: 'Group A (Multiple Choice Questions)',
          marks: `[${mcqs.length} x 1 = ${mcqs.length}]`,
          instruction: 'Select the correct option for each question.',
          questions: mcqs.map((m, idx) => ({
            number: idx + 1,
            text: m.question,
            options: Array.isArray(m.options) ? m.options : (typeof m.options === 'string' ? JSON.parse(m.options) : []),
            correctOption: m.correctOption,
            explanation: m.explanation
          }))
        }
      ]
    }

    const jsonStr = JSON.stringify(paperJson, null, 2)
    setViewPaperItem({
      id: 'mcqs-all',
      type: 'pastpaper',
      title: `${currentSub?.name || 'Subject'} — All ${mcqs.length} MCQs Paper Sheet`,
      extractedText: jsonStr,
      cloudinaryUrl: ''
    })
    setEditTextValue(jsonStr)
    setViewPaperMode('PREVIEW')
  }

  function openMcqSetPaperViewer(setObj: { label: string; items: any[] }) {
    const currentSub = subjects.find(s => s.id === subjectId)
    const paperJson = {
      university: 'TRIBHUVAN UNIVERSITY',
      faculty: 'Faculty of Humanities & Social Sciences',
      office: 'OFFICE OF THE DEAN',
      year: new Date().getFullYear().toString(),
      program: 'Bachelor in Computer Application',
      courseTitle: currentSub?.name || 'Multiple Choice Questions',
      codeNo: currentSub?.code || '',
      semester: 'Semester',
      fullMarks: (setObj.items.length * 1).toString(),
      passMarks: Math.ceil(setObj.items.length * 0.4).toString(),
      time: '1 hour',
      instruction: 'Attempt all questions. Correct answers are highlighted in green.',
      groups: [
        {
          groupName: 'Group A (Multiple Choice Questions)',
          marks: `[${setObj.items.length} x 1 = ${setObj.items.length}]`,
          instruction: 'Select the correct option for each question.',
          questions: setObj.items.map((m, idx) => ({
            number: idx + 1,
            text: m.question,
            options: Array.isArray(m.options) ? m.options : (typeof m.options === 'string' ? JSON.parse(m.options) : []),
            correctOption: m.correctOption,
            explanation: m.explanation
          }))
        }
      ]
    }

    const jsonStr = JSON.stringify(paperJson, null, 2)
    setViewPaperItem({
      id: `mcqs-${setObj.label}`,
      type: 'pastpaper',
      title: `${currentSub?.name || 'Subject'} — ${setObj.label}`,
      extractedText: jsonStr,
      cloudinaryUrl: ''
    })
    setEditTextValue(jsonStr)
    setViewPaperMode('PREVIEW')
  }

  async function handleDeleteMcqSet(setObj: { label: string; items: any[] }) {
    if (!window.confirm(`⚠️ Delete all ${setObj.items.length} questions in "${setObj.label}"?`)) return
    try {
      for (const item of setObj.items) {
        await fetch(`/api/admin/materials?id=${item.id}&type=mcq`, { method: 'DELETE' })
      }
      toast.success(`Deleted MCQ Set "${setObj.label}" 🎉`)
      loadMaterials()
    } catch {
      toast.error('Failed to delete MCQ set')
    }
  }

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
    if (!subjectId && !semesterId) return
    setLoading(true)
    try {
      const url = subjectId === 'FULL_SEMESTER' 
        ? `/api/admin/materials?semesterId=${semesterId}`
        : `/api/admin/materials?subjectId=${subjectId}`
        
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
        setPastPapers(data.pastPapers || [])
        setCheatsheets(data.cheatsheets || [])
        setSolutionBooks(data.solutionBooks || [])
        setMcqs(data.mcqs || [])
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
    else { setNotes([]); setPastPapers([]); setCheatsheets([]); setSolutionBooks([]); setMcqs([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  async function handleRunOcr(id: string, type: 'pastpaper' | 'note', label: string) {
    if (!window.confirm(`🤖 Run AI OCR Text Extraction for "${label}"?\n\nThis will send the document to Gemini 3.6 Flash to extract structured questions & text.`)) return
    setOcrRunningId(id)
    toast.info('Extracting text using Gemini AI... ⏳', { autoClose: 10000 })
    try {
      const res = await fetch('/api/admin/materials/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`OCR Success! Extracted ${data.extractedTextLength.toLocaleString()} characters 🎉`)
        loadMaterials()
      } else {
        toast.error(data.error || 'OCR failed')
      }
    } catch {
      toast.error('Network error during OCR')
    } finally {
      setOcrRunningId(null)
    }
  }

  function openEdit(item: any, type: string) {
    setEditItem(item)
    setEditType(type)
    if (type === 'note') {
      setEditForm({ title: item.title, description: item.description || '', noteType: item.noteType, isPremium: item.isPremium, author: item.author || '' })
    } else if (type === 'pastpaper') {
      setEditForm({ year: item.year, examType: item.examType })
    } else if (type === 'cheatsheet') {
      setEditForm({ title: item.title, content: item.content })
    } else if (type === 'solutionbook') {
      setEditForm({ title: item.title, description: item.description || '', isPremium: item.isPremium, author: item.author || '' })
    } else if (type === 'mcq') {
      const opts = Array.isArray(item.options) ? [...item.options] : (typeof item.options === 'string' ? JSON.parse(item.options) : ['', '', '', ''])
      while (opts.length < 4) opts.push('')
      setEditForm({
        question: item.question,
        options: opts,
        correctOption: item.correctOption ?? 0,
        explanation: item.explanation || '',
        year: item.year || new Date().getFullYear(),
        examCategory: item.examCategory || 'BOARD_EXAM'
      })
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

  async function handleAddMcqSubmit() {
    if (!subjectId || subjectId === 'FULL_SEMESTER') return
    if (!newMcq.question.trim()) { toast.error('Question text is required'); return }
    if (newMcq.options.some((o: string) => !o.trim())) { toast.error('All 4 options are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          mcqs: [newMcq]
        })
      })
      if (res.ok) {
        toast.success('MCQ added successfully! 🎯')
        setShowAddMcq(false)
        setNewMcq({ question: '', options: ['', '', '', ''], correctOption: 0, explanation: '', year: new Date().getFullYear(), examCategory: 'BOARD_EXAM' })
        loadMaterials()
      } else {
        toast.error('Failed to add MCQ')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, type: string, name: string) {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete "${name}"?\n\nThis action cannot be undone.`)) return
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

  const totalItems = notes.length + pastPapers.length + cheatsheets.length + solutionBooks.length + mcqs.length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>🛠️ Manage Materials</h3>
        {subjectId && subjectId !== 'FULL_SEMESTER' && (
          <button
            className="btn btn-sm"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, borderRadius: '8px', padding: '8px 16px' }}
            onClick={() => setShowAddMcq(true)}
          >
            + Add MCQ
          </button>
        )}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '20px' }}>
        Select a Faculty → Semester → Subject to view, edit, re-run AI OCR, or manage MCQs and uploaded documents.
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
              <option value="FULL_SEMESTER" style={{ fontWeight: 'bold' }}>— Full Semester Guide (All Subjects) —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()}</option>)}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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
                      <th>Smart AI Status</th>
                      <th>File</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastPapers.map(p => {
                      const hasText = Boolean(p.extractedText && p.extractedText.trim().length > 0)
                      const textLen = p.extractedText ? p.extractedText.length : 0

                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700, fontSize: '16px' }}>{p.year}</td>
                          <td><span className="badge badge-pending">{p.examType?.replace('_', ' ')}</span></td>
                          <td>
                            {hasText ? (
                              <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={`Extracted text length: ${textLen} chars`}>
                                ✨ Smart AI Ready ({textLen > 1000 ? `${(textLen/1000).toFixed(1)}k` : textLen} chars)
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                                ❌ No AI Text
                              </span>
                            )}
                          </td>
                          <td>
                            <a href={p.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>
                              View File ↗
                            </a>
                          </td>
                          <td style={{ fontSize: '12px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '11px' }}
                                onClick={() => openPaperViewer(p, 'pastpaper', `${p.year} ${p.examType}`)}
                              >
                                👁️ View Paper
                              </button>

                              <button
                                className="btn btn-sm"
                                style={{
                                  background: hasText ? 'rgba(6,182,212,0.12)' : 'rgba(245,158,11,0.15)',
                                  color: hasText ? '#22d3ee' : '#fbbf24',
                                  border: `1px solid ${hasText ? 'rgba(6,182,212,0.3)' : 'rgba(245,158,11,0.4)'}`,
                                  fontSize: '11px'
                                }}
                                disabled={ocrRunningId === p.id}
                                onClick={() => handleRunOcr(p.id, 'pastpaper', `${p.year} ${p.examType}`)}
                              >
                                {ocrRunningId === p.id ? '⏳ OCR Running...' : hasText ? '🔄 Re-run OCR' : '🤖 Run AI OCR'}
                              </button>

                              <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(p, 'pastpaper')}>✏️ Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id, 'pastpaper', `${p.year} ${p.examType}`)}>🗑️ Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                      <th>Smart AI Status</th>
                      <th>Access</th>
                      <th>Downloads</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map(n => {
                      const hasText = Boolean(n.extractedText && n.extractedText.trim().length > 0)
                      const textLen = n.extractedText ? n.extractedText.length : 0
                      return (
                        <tr key={n.id}>
                          <td>
                            <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                            {n.author && <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>by {n.author}</div>}
                          </td>
                          <td><span className="badge badge-semester" style={{ fontSize: '11px' }}>{n.noteType?.replace('_', ' ')}</span></td>
                          <td>
                            {hasText ? (
                              <span className="badge badge-success" style={{ fontSize: '11px' }}>
                                ✨ AI Text ({textLen > 1000 ? `${(textLen/1000).toFixed(1)}k` : textLen} chars)
                              </span>
                            ) : (
                              <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                                No Text
                              </span>
                            )}
                          </td>
                          <td><span className={`badge ${n.isPremium ? 'badge-elite' : 'badge-success'}`}>{n.isPremium ? '💎 Premium' : '🔓 Free'}</span></td>
                          <td style={{ fontWeight: 600 }}>{n.downloadCount || 0}</td>
                          <td style={{ fontSize: '12px' }}>{new Date(n.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '11px' }}
                                onClick={() => openPaperViewer(n, 'note', n.title)}
                              >
                                👁️ View Paper
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', fontSize: '11px' }}
                                disabled={ocrRunningId === n.id}
                                onClick={() => handleRunOcr(n.id, 'note', n.title)}
                              >
                                {ocrRunningId === n.id ? '⏳ Extracting...' : hasText ? '🔄 Re-OCR' : '🤖 Run AI OCR'}
                              </button>
                              <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(n, 'note')}>✏️ Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n.id, 'note', n.title)}>🗑️ Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MCQs Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎯 Multiple Choice Questions ({mcqs.length})
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                {mcqs.length > 0 && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '12px', fontWeight: 600 }}
                    onClick={openMcqPaperViewer}
                  >
                    👁️ View MCQ Paper Sheet
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => setShowAddMcq(true)}
                >
                  + Add New MCQ
                </button>
              </div>
            </div>

            {mcqs.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>No MCQs added for this subject yet. Click "+ Add New MCQ" to add questions.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>MCQ Collection / Paper</th>
                      <th>Total Questions</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const mcqGroupsMap = new Map<string, { label: string; year: any; examCategory: any; items: any[] }>()
                      for (const m of mcqs) {
                        const yearStr = m.year ? `${m.year}` : 'General'
                        const catStr = m.examCategory ? m.examCategory.replace('_', ' ') : 'BOARD EXAM'
                        const key = `${yearStr}_${catStr}`
                        if (!mcqGroupsMap.has(key)) {
                          mcqGroupsMap.set(key, {
                            label: `${yearStr} ${catStr} MCQs`,
                            year: m.year,
                            examCategory: m.examCategory,
                            items: []
                          })
                        }
                        mcqGroupsMap.get(key)!.items.push(m)
                      }
                      const mcqSets = Array.from(mcqGroupsMap.values())

                      return mcqSets.map((setObj, setIdx) => (
                        <tr key={setIdx}>
                          <td style={{ fontWeight: 700, fontSize: '15px' }}>
                            🎯 {setObj.label}
                          </td>
                          <td>
                            <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 10px' }}>
                              {setObj.items.length} Questions
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-pending">
                              {setObj.examCategory ? setObj.examCategory.replace('_', ' ') : 'BOARD EXAM'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '11px', fontWeight: 600 }}
                                onClick={() => openMcqSetPaperViewer(setObj)}
                              >
                                👁️ View Paper
                              </button>

                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', fontSize: '11px', fontWeight: 600 }}
                                onClick={() => openEditMcqSet(setObj)}
                              >
                                ✏️ Edit Topic/Year
                              </button>

                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', fontSize: '11px' }}
                                onClick={() => setManageMcqSet(setObj)}
                              >
                                📋 Manage Questions ({setObj.items.length})
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteMcqSet(setObj)}
                              >
                                🗑️ Delete Set
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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

          {/* Solution Books Table */}
          {solutionBooks.length > 0 && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>📚 Solution Books</h3>
                <span className="badge badge-primary">{solutionBooks.length} items</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--clr-text-3)', fontSize: '12px', textTransform: 'uppercase' }}>Title</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--clr-text-3)', fontSize: '12px', textTransform: 'uppercase' }}>Access</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--clr-text-3)', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solutionBooks.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600 }}>{b.title}</div>
                          {b.fileSize && <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px' }}>{b.fileSize}</div>}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {b.isPremium ? <span className="badge badge-elite" style={{ fontSize: '10px' }}>PREMIUM</span> : <span className="badge badge-free" style={{ fontSize: '10px' }}>FREE</span>}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <a href={b.cloudinaryUrl} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>👁️ View</a>
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }} onClick={() => openEdit(b, 'solutionbook')}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id, 'solutionbook', b.title)}>🗑️ Delete</button>
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

      {/* Paper View & Edit Modal */}
      {viewPaperItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', padding: '20px' }} onClick={() => setViewPaperItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ width: '100%', maxWidth: '960px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 Paper View &amp; AI Text Editor — {viewPaperItem.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', margin: '2px 0 0' }}>
                  Preview formatted paper sheet or edit raw extracted text/JSON directly.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--clr-border)' }}>
                  <button
                    className="btn btn-xs"
                    style={{
                      background: viewPaperMode === 'PREVIEW' ? 'var(--grad-brand)' : 'transparent',
                      color: '#fff', fontWeight: 700, padding: '5px 12px', borderRadius: '6px'
                    }}
                    onClick={() => setViewPaperMode('PREVIEW')}
                  >
                    👁️ Formatted View
                  </button>
                  <button
                    className="btn btn-xs"
                    style={{
                      background: viewPaperMode === 'EDIT' ? 'var(--grad-brand)' : 'transparent',
                      color: '#fff', fontWeight: 700, padding: '5px 12px', borderRadius: '6px'
                    }}
                    onClick={() => setViewPaperMode('EDIT')}
                  >
                    ✏️ Edit Text / JSON
                  </button>
                </div>

                {viewPaperMode === 'EDIT' && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, padding: '6px 14px' }}
                    onClick={handleSavePaperText}
                    disabled={savingPaperText}
                  >
                    {savingPaperText ? 'Saving...' : '💾 Save Changes'}
                  </button>
                )}

                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setViewPaperItem(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: viewPaperMode === 'PREVIEW' ? '#0f172a' : 'transparent' }}>
              {viewPaperMode === 'PREVIEW' ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {(() => {
                    if (!viewPaperItem.extractedText || !viewPaperItem.extractedText.trim()) {
                      return (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--clr-text-3)' }}>
                          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                          <p style={{ fontSize: '15px', color: 'var(--clr-text-2)', marginBottom: '16px' }}>No extracted text found for this file.</p>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn btn-sm btn-primary" onClick={() => { handleRunOcr(viewPaperItem.id, viewPaperItem.type, viewPaperItem.title); setViewPaperItem(null); }}>
                              🤖 Run AI OCR Now
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setViewPaperMode('EDIT')}>
                              ✏️ Write / Paste Text Manually
                            </button>
                          </div>
                        </div>
                      )
                    }

                    try {
                      let cleanText = viewPaperItem.extractedText.trim()
                      if (cleanText.startsWith('```')) {
                        cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '')
                      }
                      let parsed: any
                      try {
                        parsed = JSON.parse(cleanText)
                      } catch {
                        let fixedText = cleanText.replace(/\n/g, ' ').replace(/\r/g, '').replace(/\t/g, ' ')
                        fixedText = fixedText.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1')
                        parsed = JSON.parse(fixedText)
                      }
                      if (typeof parsed === 'string') parsed = JSON.parse(parsed)
                      if (parsed && typeof parsed === 'object' && parsed.groups) {
                        return <ExamPaperViewer data={parsed as ExamPaperData} />
                      }
                    } catch (e) {
                      const legacyParsed = parseLegacyMarkdownToExamData(viewPaperItem.extractedText)
                      if (legacyParsed && legacyParsed.groups && legacyParsed.groups.length > 0) {
                        return <ExamPaperViewer data={legacyParsed} />
                      }
                    }
                    return <MarkdownPaperViewer content={viewPaperItem.extractedText} />
                  })()}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)' }}>
                      Raw Extracted Text / JSON Data:
                    </label>
                    <button
                      className="btn btn-xs"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '11px' }}
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(editTextValue)
                          setEditTextValue(JSON.stringify(parsed, null, 2))
                          toast.success('Prettified JSON!')
                        } catch {
                          toast.error('Invalid JSON syntax — could not format')
                        }
                      }}
                    >
                      ✨ Prettify JSON
                    </button>
                  </div>
                  <textarea
                    className="input-field"
                    rows={20}
                    style={{ fontFamily: 'monospace', fontSize: '13px', width: '100%', resize: 'vertical', lineHeight: 1.55 }}
                    value={editTextValue}
                    onChange={e => setEditTextValue(e.target.value)}
                    placeholder="Paste or edit structured JSON or paper markdown text..."
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage MCQ Questions Modal */}
      {manageMcqSet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', padding: '20px' }} onClick={() => setManageMcqSet(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 Manage Questions — {manageMcqSet.label}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', margin: '2px 0 0' }}>
                  {manageMcqSet.items.length} questions in this collection
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => {
                    const setObj = manageMcqSet
                    setManageMcqSet(null)
                    openMcqSetPaperViewer(setObj)
                  }}
                >
                  👁️ View Full Paper
                </button>
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', padding: 0 }} onClick={() => setManageMcqSet(null)}>
                  ✕
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {manageMcqSet.items.map((m, idx) => {
                  const opts = Array.isArray(m.options) ? m.options : (typeof m.options === 'string' ? JSON.parse(m.options) : [])
                  return (
                    <div key={m.id || idx} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc', flex: 1 }}>
                          {idx + 1}. {m.question}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-xs" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }} onClick={() => { setManageMcqSet(null); openEdit(m, 'mcq'); }}>✏️ Edit</button>
                          <button className="btn btn-xs btn-danger" onClick={() => { handleDelete(m.id, 'mcq', `MCQ: ${m.question.substring(0, 30)}...`); setManageMcqSet(null); }}>🗑️ Delete</button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                        {opts.map((o: string, oIdx: number) => {
                          const isCorrect = oIdx === m.correctOption
                          return (
                            <div key={oIdx} style={{ fontSize: '12px', color: isCorrect ? '#34d399' : '#cbd5e1', fontWeight: isCorrect ? 700 : 400, background: isCorrect ? 'rgba(16,185,129,0.12)' : 'transparent', padding: '3px 8px', borderRadius: '4px' }}>
                              {String.fromCharCode(65 + oIdx)}. {o} {isCorrect && '✓'}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit MCQ Set Details Modal */}
      {editMcqSetItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setEditMcqSetItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '28px', maxWidth: '480px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              ✏️ Edit MCQ Collection Topic &amp; Year
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '20px' }}>
              Updating details for all {editMcqSetItem.ids.length} questions in this collection ({editMcqSetItem.label}).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Exam Year</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 2023, 2024, 2025"
                  value={editMcqSetForm.year}
                  onChange={e => setEditMcqSetForm({ ...editMcqSetForm, year: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Exam Category / Topic Tag</label>
                <select
                  className="input-field"
                  value={editMcqSetForm.examCategory}
                  onChange={e => setEditMcqSetForm({ ...editMcqSetForm, examCategory: e.target.value })}
                >
                  <option value="BOARD_EXAM">Board Exam</option>
                  <option value="MODEL_EXAM">Model Exam</option>
                  <option value="MID_TERM">Mid Term Exam</option>
                  <option value="UNIT_TEST">Unit Test / Quiz</option>
                  <option value="GENERAL">General Practice</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-outline" onClick={() => setEditMcqSetItem(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveMcqSet}
                  disabled={savingMcqSet}
                >
                  {savingMcqSet ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add MCQ Modal */}
      {showAddMcq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setShowAddMcq(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '32px', maxWidth: '580px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
              🎯 Add New Multiple Choice Question (MCQ)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Question Text</label>
                <textarea className="input-field" rows={3} placeholder="e.g. Which algorithm is used for line drawing in Computer Graphics?" value={newMcq.question} onChange={e => setNewMcq({ ...newMcq, question: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {newMcq.options.map((opt: string, idx: number) => (
                  <div key={idx}>
                    <label className="block text-xs font-semibold mb-1" style={{ color: idx === newMcq.correctOption ? '#34d399' : 'var(--clr-text-3)' }}>
                      Option {String.fromCharCode(65 + idx)} {idx === newMcq.correctOption && '✓ (Correct)'}
                    </label>
                    <input
                      className="input-field"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={e => {
                        const newOpts = [...newMcq.options]
                        newOpts[idx] = e.target.value
                        setNewMcq({ ...newMcq, options: newOpts })
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Correct Option</label>
                  <select className="input-field" value={newMcq.correctOption} onChange={e => setNewMcq({ ...newMcq, correctOption: parseInt(e.target.value) })}>
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Year</label>
                  <input className="input-field" type="number" value={newMcq.year} onChange={e => setNewMcq({ ...newMcq, year: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Category</label>
                  <select className="input-field" value={newMcq.examCategory} onChange={e => setNewMcq({ ...newMcq, examCategory: e.target.value })}>
                    <option value="BOARD_EXAM">Board Exam</option>
                    <option value="INTERNAL_EXAM">Internal Exam</option>
                    <option value="PRACTICE">Practice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Explanation (Optional)</label>
                <textarea className="input-field" rows={2} placeholder="Explain why this answer is correct..." value={newMcq.explanation} onChange={e => setNewMcq({ ...newMcq, explanation: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-2)' }} onClick={() => setShowAddMcq(false)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 700 }} onClick={handleAddMcqSubmit} disabled={saving}>
                {saving ? 'Adding...' : 'Save MCQ 🎯'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setEditItem(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{ padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>
              ✏️ Edit {editType === 'note' ? 'Note' : editType === 'pastpaper' ? 'Past Paper' : editType === 'solutionbook' ? 'Solution Book' : editType === 'mcq' ? 'MCQ' : 'Cheatsheet'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editType === 'mcq' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Question</label>
                    <textarea className="input-field" rows={3} value={editForm.question || ''} onChange={e => setEditForm({ ...editForm, question: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {(editForm.options || ['', '', '', '']).map((opt: string, idx: number) => (
                      <div key={idx}>
                        <label className="block text-xs font-semibold mb-1" style={{ color: idx === Number(editForm.correctOption) ? '#34d399' : 'var(--clr-text-3)' }}>
                          Option {String.fromCharCode(65 + idx)} {idx === Number(editForm.correctOption) && '✓'}
                        </label>
                        <input
                          className="input-field"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...(editForm.options || ['', '', '', ''])]
                            newOpts[idx] = e.target.value
                            setEditForm({ ...editForm, options: newOpts })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Correct Option</label>
                      <select className="input-field" value={editForm.correctOption} onChange={e => setEditForm({ ...editForm, correctOption: parseInt(e.target.value) })}>
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Year</label>
                      <input className="input-field" type="number" value={editForm.year || ''} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Category</label>
                      <select className="input-field" value={editForm.examCategory || 'BOARD_EXAM'} onChange={e => setEditForm({ ...editForm, examCategory: e.target.value })}>
                        <option value="BOARD_EXAM">Board Exam</option>
                        <option value="INTERNAL_EXAM">Internal Exam</option>
                        <option value="PRACTICE">Practice</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--clr-text-2)' }}>Explanation</label>
                    <textarea className="input-field" rows={2} value={editForm.explanation || ''} onChange={e => setEditForm({ ...editForm, explanation: e.target.value })} />
                  </div>
                </>
              )}

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
                        <option value="SYLLABUS">📋 Syllabus</option>
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

              {editType === 'solutionbook' && (
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
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Access</label>
                      <select className="input-field" value={editForm.isPremium ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, isPremium: e.target.value === 'true' })} style={{ cursor: 'pointer' }}>
                        <option value="false">🔓 Free</option>
                        <option value="true">💎 Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Author</label>
                      <input className="input-field" value={editForm.author || ''} onChange={e => setEditForm({ ...editForm, author: e.target.value })} />
                    </div>
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
  const [faculties, setFaculties] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editFacultyId, setEditFacultyId] = useState('')
  const [editSemesterOrder, setEditSemesterOrder] = useState<string | number>('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
  }, [])

  useEffect(() => {
    if (!editFacultyId) {
      setSemesters([])
      return
    }
    fetch(`/api/admin/semesters?facultyId=${editFacultyId}`)
      .then(r => r.json())
      .then(d => setSemesters(d.semesters || []))
  }, [editFacultyId])

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
          facultyId: editFacultyId || null,
          semesterOrder: editSemesterOrder !== '' ? parseInt(String(editSemesterOrder)) : null,
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
    setEditFacultyId(u.facultyId || '')
    setEditSemesterOrder(u.semesterOrder !== null && u.semesterOrder !== undefined ? u.semesterOrder : '')
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
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Faculty</label>
                <select className="input-field" value={editFacultyId} onChange={e => { setEditFacultyId(e.target.value); setEditSemesterOrder(''); }}>
                  <option value="">None / Not Selected</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Semester / Year</label>
                <select className="input-field" value={editSemesterOrder} onChange={e => setEditSemesterOrder(e.target.value)} disabled={!editFacultyId}>
                  <option value="">None / Not Selected</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.order}>{s.name}</option>
                  ))}
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
  const [contentType, setContentType] = useState<'NOTE' | 'PAST_PAPER' | 'CHEATSHEET' | 'SOLUTION_BOOK' | 'MCQ'>('NOTE')
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
  const [sheetFiles, setSheetFiles] = useState<File[]>([])
  const [extractText, setExtractText] = useState(true)

  // MCQ State
  const [mcqYear, setMcqYear] = useState<string>(new Date().getFullYear().toString())
  const [mcqExamType, setMcqExamType] = useState('BOARD_EXAM')
  const [mcqItems, setMcqItems] = useState([
    { question: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }
  ])
  const [savingMcqs, setSavingMcqs] = useState(false)
  const [mcqImageFiles, setMcqImageFiles] = useState<File[]>([])
  const [mcqImageGenerating, setMcqImageGenerating] = useState(false)

  async function handleGenerateMcqsFromImage() {
    if (!subjectId) { toast.error('Please select a subject first'); return }
    if (mcqImageFiles.length === 0) { toast.error('Please select at least one image file'); return }
    
    setMcqImageGenerating(true)
    toast.loading(`Uploading ${mcqImageFiles.length} image(s) & generating MCQs...`, { toastId: 'mcq-gen' })

    try {
      // 1. Get Cloudinary signature
      const sigRes = await fetch('/api/upload/signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'tu-notes-hub/mcq-images' }) })
      if (!sigRes.ok) throw new Error('Signature error')
      const { timestamp, signature, cloudName, apiKey, folder: sf } = await sigRes.json()

      let uploadedUrls: string[] = []

      // 2. Loop through all files and upload them
      for (let i = 0; i < mcqImageFiles.length; i++) {
        const file = mcqImageFiles[i]
        
        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', apiKey)
        formData.append('timestamp', String(timestamp))
        formData.append('signature', signature)
        formData.append('folder', sf)

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || `Failed to upload image ${i + 1}`)
        
        uploadedUrls.push(uploadData.secure_url)
      }

      // 3. Generate MCQs from all images at once
      const genRes = await fetch('/api/ai/mcq-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, imageUrls: uploadedUrls })
      })
      const genData = await genRes.json()
      
      if (!genRes.ok) {
        throw new Error(genData.error || `Failed to generate MCQs from images`)
      }

      const allGeneratedMcqs = genData.mcqs || []

      toast.dismiss('mcq-gen')
      toast.success(`🎉 Generated ${allGeneratedMcqs.length} MCQs from ${mcqImageFiles.length} image(s)!`)
      setMcqItems(prev => {
        // Filter out generated MCQs that already exist in the list (case-insensitive check)
        const existingQuestions = new Set(prev.map(p => (p.question || '').toLowerCase().trim()))
        const uniqueNewMcqs = allGeneratedMcqs.filter(
          newMcq => !existingQuestions.has((newMcq.question || '').toLowerCase().trim())
        )

        // If there was only 1 empty item initially, replace it. Otherwise append.
        if (prev.length === 1 && prev[0].question === '') {
          return uniqueNewMcqs
        }
        return [...prev, ...uniqueNewMcqs]
      })
      setMcqImageFiles([])
    } catch (err: any) {
      toast.dismiss('mcq-gen')
      toast.error(err.message || 'An error occurred')
    } finally {
      setMcqImageGenerating(false)
    }
  }

  function addMcqItem() {
    setMcqItems(prev => [...prev, { question: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }])
  }

  function removeMcqItem(i: number) {
    setMcqItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateMcqItem(i: number, field: string, val: any) {
    setMcqItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  function updateMcqOption(qi: number, oi: number, val: string) {
    setMcqItems(prev => prev.map((item, idx) => idx === qi ? { ...item, options: item.options.map((o, k) => k === oi ? val : o) } : item))
  }

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

  const [syllabusFilter, setSyllabusFilter] = useState<'all' | 'new' | 'old'>('all')

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

    // ── MCQ path ──
    if (contentType === 'MCQ') {
      if (!subjectId) { toast.error('Please select a subject'); return }
      const validItems = mcqItems.filter(m => m.question.trim())
      if (validItems.length === 0) { toast.error('Please fill in at least one question'); return }
      setSavingMcqs(true)
      try {
        const res = await fetch('/api/admin/mcqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            mcqs: validItems.map(m => ({
              question: m.question.trim(),
              options: m.options,
              correctOption: m.correctOption,
              explanation: m.explanation || null,
              year: parseInt(mcqYear) || null,
              examCategory: mcqExamType
            }))
          })
        })
        const data = await res.json()
        if (res.ok) {
          toast.success(`✅ ${data.count} MCQ(s) saved successfully!`)
          setMcqItems([{ question: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }])
        } else {
          toast.error(data.error || 'Failed to save MCQs')
        }
      } catch { toast.error('Failed to save MCQs') }
      finally { setSavingMcqs(false) }
      return
    }

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
        if (noteFile.size > 10 * 1024 * 1024) { toast.error('Max 10MB limit reached for Cloudinary Free Tier'); setUploading(false); return }
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
      let finalTitle = noteTitle
      if (syllabusFilter === 'old' && !finalTitle.includes('(Old Syllabus)')) {
        finalTitle = `${finalTitle} (Old Syllabus)`
      } else if (syllabusFilter === 'new' && !finalTitle.includes('(New Syllabus)')) {
        finalTitle = `${finalTitle} (New Syllabus)`
      }
      const saveRes = await fetch('/api/upload/solution-book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ semesterId, title: finalTitle, description: noteDescription, cloudinaryUrl, fileSize, isPremium, author, subjectId: subjectId || null }) })
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

    // For cheatsheets, support uploading multiple files as well as markdown content
    if (contentType === 'CHEATSHEET') {
      if (!sheetTitle) { toast.error('Title is required'); return }
      if (!sheetContent && sheetFiles.length === 0) { toast.error('Please provide Markdown content or attach at least one file'); return }
      setUploading(true)
      toast.loading(sheetFiles.length > 0 ? `Uploading ${sheetFiles.length} file(s)...` : 'Saving cheatsheet...', { toastId: 'upload-progress' })
      try {
        let uploadedFiles: { url: string; name: string; size: string; type: string }[] = []

        if (sheetFiles.length > 0) {
          const sigRes = await fetch('/api/upload/signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'tu-notes-hub/cheatsheets' }) })
          if (!sigRes.ok) throw new Error('Signature error')
          const { timestamp, signature, cloudName, apiKey, folder: sf } = await sigRes.json()

          for (let i = 0; i < sheetFiles.length; i++) {
            const file = sheetFiles[i]
            const isRaw = !['jpg', 'jpeg', 'png', 'webp'].includes(file.name.split('.').pop()?.toLowerCase() || '')
            const resourceType = isRaw ? 'raw' : 'image'

            const formData = new FormData()
            formData.append('file', file)
            formData.append('api_key', apiKey)
            formData.append('timestamp', String(timestamp))
            formData.append('signature', signature)
            formData.append('folder', sf)

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
              method: 'POST',
              body: formData
            })
            const uploadData = await uploadRes.json()
            if (!uploadRes.ok) throw new Error(uploadData.error?.message || `Failed to upload file ${file.name}`)

            uploadedFiles.push({
              url: uploadData.secure_url,
              name: file.name,
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              type: file.type || file.name.split('.').pop()?.toUpperCase() || 'FILE'
            })
          }
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'CHEATSHEET',
            subjectId,
            title: sheetTitle,
            content: sheetContent,
            files: uploadedFiles.length > 0 ? uploadedFiles : null
          })
        })
        const data = await res.json()
        toast.dismiss('upload-progress')
        if (res.ok) {
          toast.success(data.message || 'Cheatsheet published! 🎉')
          setSheetTitle(''); setSheetContent(''); setSheetFiles([])
        } else { toast.error(data.error || 'Failed to create cheatsheet') }
      } catch (err: any) {
        toast.dismiss('upload-progress')
        toast.error(err.message || 'Network error')
      } finally { setUploading(false) }
      return
    }

    // ── Google Drive link path ──
    if (sourceType === 'DRIVE') {
      if (!driveLink) { toast.error('Please enter a Google Drive link'); return }
      const fileId = parseDriveLink(driveLink)
      if (!fileId) { toast.error('Invalid Drive link — use the share link from Google Drive'); return }
      setUploading(true)
      toast.loading('Saving Drive link...', { toastId: 'upload-progress' })
      const payload: any = { contentType, subjectId, cloudinaryUrl: normalizeDriveUrl(driveLink), fileSize: 'Drive Link', extractText }
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

    const maxSizeMB = 10
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
        extractText,
      }

      if (contentType === 'NOTE') {
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title is required'); return }
        payload.title = noteTitle
        payload.description = noteDescription
        payload.noteType = noteType
        payload.isPremium = isPremium
        payload.author = author
      } else if ((contentType as string) === 'SOLUTION_BOOK') {
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title is required'); return }
        payload.title = noteTitle
        payload.description = noteDescription
        payload.isPremium = isPremium
        payload.author = author
        payload.semesterId = semesterId
        payload.subjectId = subjectId || null
      } else if (contentType === 'PAST_PAPER') {
        if (!paperYear) { toast.dismiss('upload-progress'); toast.error('Year is required'); return }
        payload.year = paperYear
        payload.examType = examType
      }

      const uploadApiEndpoint = (contentType as string) === 'SOLUTION_BOOK' ? '/api/upload/solution-book' : '/api/upload'
      const saveRes = await fetch(uploadApiEndpoint, {
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
    { type: 'MCQ',           icon: '✅', label: 'MCQ Questions' },
  ]

  const isSolutionBook = contentType === 'SOLUTION_BOOK'
  const isMcq = contentType === 'MCQ'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', display: 'flex' }}>
          <span style={{ fontSize: '28px' }}>📤</span>
        </div>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Publish Material</h2>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginTop: '4px' }}>Add new study notes, solution books, past papers, or cheatsheets to the platform.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Step 1: Material Type */}
        <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#6366f1', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>1</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Material Type</h3>
          </div>
            {isSolutionBook && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '10px', fontSize: '13px', color: '#67e8f9' }}>
                📚 <strong>Solution Book:</strong> Select a specific subject (e.g. <em>Numerical Methods</em>) to display it inside that subject only. Choose <em>"Full Semester Guide"</em> to display it at the top for all subjects.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
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

        {/* Step 2: File Source */}
        {contentType !== 'CHEATSHEET' && contentType !== 'MCQ' && (
          <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#06b6d4', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>2</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>File Source</h3>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
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

        {/* Step 3: Location Details */}
        <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#10b981', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>3</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Course Location</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: facultyId === 'bca' ? 'repeat(auto-fit, minmax(180px, 1fr))' : '1fr 1fr', gap: '16px' }}>
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
            {facultyId === 'bca' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Syllabus Version</label>
                <select className="input-field" value={syllabusFilter} onChange={e => setSyllabusFilter(e.target.value as any)} style={{ cursor: 'pointer' }}>
                  <option value="all">🌐 All (Both Syllabuses)</option>
                  <option value="new">✨ New Syllabus (2080+)</option>
                  <option value="old">📜 Old Syllabus (2074)</option>
                </select>
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <label className="block text-sm font-semibold" style={{ color: 'var(--clr-text-2)' }}>
                Subject {contentType === 'SOLUTION_BOOK' ? '(Optional for Solution Books)' : ''}
              </label>
              {semesterId && (
                <button
                  type="button"
                  onClick={async () => {
                    const rawTitle = prompt('Enter Subject Title (e.g. Computer Graphics):')
                    if (!rawTitle) return
                    const code = prompt('Enter Subject Code (e.g. CACS305):')
                    if (!code) return
                    
                    let title = rawTitle
                    if (syllabusFilter === 'old' && !title.includes('(Old Syllabus)')) title += ' (Old Syllabus)'
                    if (syllabusFilter === 'new' && !title.includes('(New Syllabus)')) title += ' (New Syllabus)'

                    try {
                      const res = await fetch('/api/admin/subjects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, code, semesterId })
                      })
                      if (res.ok) {
                        toast.success('Subject added!')
                        fetch(`/api/admin/subjects?semesterId=${semesterId}`).then(r => r.json()).then(d => { setSubjects(d.subjects || []); setSubjectId(d.subjects[d.subjects.length - 1]?.id || '') })
                      } else {
                        const err = await res.json()
                        toast.error(err.error || 'Failed to add subject')
                      }
                    } catch (e) { toast.error('Network error') }
                  }}
                  style={{ fontSize: '12px', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
                >
                  + Add Subject
                </button>
              )}
            </div>
            <select
              className="input-field"
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              required={contentType !== 'SOLUTION_BOOK'}
              disabled={!semesterId}
              style={{ cursor: semesterId ? 'pointer' : 'not-allowed' }}
            >
              <option value="">
                {contentType === 'SOLUTION_BOOK' ? '— Full Semester Guide (All Subjects) —' : '— Choose Subject —'}
              </option>
              {subjects
                .filter(s => {
                  if (syllabusFilter === 'new') return s.title.includes('New Syllabus') || s.code.startsWith('BCA ')
                  if (syllabusFilter === 'old') return s.title.includes('Old Syllabus') || !s.code.startsWith('BCA ')
                  return true
                })
                .map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()}
                  </option>
                ))}
            </select>
          </div>

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
        </div>

        {/* Step 4: Metadata & Properties */}
        <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f59e0b', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>4</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Material Details</h3>
          </div>

          {/* NOTE Fields */}
          {(contentType === 'NOTE' || contentType === 'SOLUTION_BOOK') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="block text-sm font-semibold" style={{ color: 'var(--clr-text-2)' }}>
                    {isSolutionBook ? 'Solution Book Title' : noteType === 'PROJECT' ? 'Project Title' : noteType === 'LAB_WORK' ? 'Lab Work Title' : 'Note Title'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedFaculty = faculties.find(f => f.id === facultyId)
                      const selectedSemester = semesters.find(s => s.id === semesterId)
                      const selectedSubject = subjects.find(s => s.id === subjectId)

                      const facName = selectedFaculty ? selectedFaculty.name.toUpperCase() : 'TU'
                      const semName = selectedSemester ? selectedSemester.name : ''
                      const subName = selectedSubject ? `${selectedSubject.title} (${selectedSubject.code})` : ''

                      if (contentType === 'SOLUTION_BOOK') {
                        setNoteTitle(`TU ${facName} ${semName} Complete Solution Book & Guide PDF (2081/2082)`)
                        setNoteDescription(`Complete chapterwise solution book and semester guide for TU ${facName} ${semName}. Covers model questions, syllabus solutions, and past exam papers.`)
                        toast.success('✨ Rank #1 SEO Title & Description auto-filled!')
                        return
                      }

                      if (!selectedSubject) {
                        toast.error('Please select Faculty, Semester, and Subject first!')
                        return
                      }

                      setNoteTitle(`${facName} ${semName} ${subName} Complete Notes PDF Download (TU Updated 2026)`)
                      setNoteDescription(`Download free ${facName} ${semName} ${subName} handwritten study notes, chapterwise solutions, and past exam question answers on TU Notes Hub.`)
                      toast.success('✨ Rank #1 SEO Title & Description auto-filled!')
                    }}
                    style={{
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✨ Auto-SEO Generate
                  </button>
                </div>
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
                    <option value="SYLLABUS">📋 Syllabus</option>
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
              {sourceType === 'FILE' && <FileDropZone label="Document (PDF, DOCX, PPTX, Images)" accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png" file={noteFile} onFile={setNoteFile} hint="Max 10 MB — uploads directly to Cloudinary" required />}
              {sourceType === 'FILE' && noteFile && ['jpg', 'jpeg', 'png'].includes(noteFile.name.split('.').pop()?.toLowerCase() || '') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <input type="checkbox" id="extractTextNote" checked={extractText} onChange={e => setExtractText(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                  <label htmlFor="extractTextNote" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                    <strong>Convert to Text (OCR)</strong> - Extract text for SEO and readability. Uncheck if the image is mostly diagrams/figures.
                  </label>
                </div>
              )}
            </motion.div>
          )}

          {/* PAST_PAPER Fields */}
          {contentType === 'PAST_PAPER' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
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
              {sourceType === 'FILE' && <FileDropZone label="Question Paper (PDF / Images)" accept=".pdf,.jpg,.jpeg,.png" file={paperFile} onFile={setPaperFile} hint="Max 10 MB — uploads directly to Cloudinary" required />}
              {sourceType === 'FILE' && paperFile && ['jpg', 'jpeg', 'png'].includes(paperFile.name.split('.').pop()?.toLowerCase() || '') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <input type="checkbox" id="extractTextPaper" checked={extractText} onChange={e => setExtractText(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                  <label htmlFor="extractTextPaper" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--clr-text-2)' }}>
                    <strong>Convert to Text (OCR)</strong> - Extract text for SEO and readability. Uncheck if the image is mostly diagrams/figures.
                  </label>
                </div>
              )}
            </motion.div>
          )}

          {/* CHEATSHEET Fields */}
          {contentType === 'CHEATSHEET' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Cheatsheet Title</label>
                <input className="input-field" placeholder="e.g. .NET Quick Revision Cheatsheet" required value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
              </div>
              <MultiFileDropZone 
                label="Attach Files (PDF, Images, Word, Docs, etc.)" 
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.pptx,.ppt,.txt" 
                files={sheetFiles} 
                onFiles={setSheetFiles} 
                hint="Select multiple documents or photos to attach to this cheatsheet" 
              />
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Markdown Content / Description (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder={'# Cheatsheet Title\n- Key concept\n- **Important term**\n\n## Section\n- Point 1'}
                  style={{ minHeight: '140px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
                  value={sheetContent}
                  onChange={e => setSheetContent(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* MCQ Fields */}
          {contentType === 'MCQ' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Exam Year</label>
                  <input className="input-field" type="number" required value={mcqYear} onChange={e => setMcqYear(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Exam Category</label>
                  <select className="input-field" value={mcqExamType} onChange={e => setMcqExamType(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="BOARD_EXAM">🎓 Board Exam</option>
                    <option value="INTERNAL_EXAM">🏫 Internal Exam</option>
                    <option value="BACK_PAPER">🔄 Back Paper</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', fontSize: '13px', color: '#6ee7b7' }}>
                ✅ Add multiple MCQs at once. Each question needs 4 options and a correct answer. Explanation is optional.
              </div>

              {/* AI Image Upload Section */}
              <div style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.05), rgba(99,102,241,0.05))', border: '1px solid rgba(217,70,239,0.2)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: '#e879f9' }}>AI Magic: Extract from Question Paper</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--clr-text-3)' }}>Upload a photo of a question paper to automatically generate MCQs from it.</p>
                  </div>
                </div>
                
                <MultiFileDropZone 
                  label="Question Paper — Photos, PDF or Word (JPG, PNG, PDF, DOCX)" 
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.doc" 
                  files={mcqImageFiles} 
                  onFiles={setMcqImageFiles} 
                  hint="Select multiple files — all pages of the same paper together" 
                />

                {mcqImageFiles.length > 0 && (
                  <button 
                    type="button" 
                    onClick={handleGenerateMcqsFromImage}
                    disabled={mcqImageGenerating || !subjectId}
                    style={{ 
                      marginTop: '16px', width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700, border: 'none', cursor: (mcqImageGenerating || !subjectId) ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #d946ef, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    {mcqImageGenerating ? (
                      <><span className="spinner" style={{ width: '16px', height: '16px' }}/> Processing {mcqImageFiles.length} Image(s) & Generating MCQs...</>
                    ) : (
                      <>✨ Auto-Generate MCQs from {mcqImageFiles.length} Photo(s)</>
                    )}
                  </button>
                )}
                {!subjectId && mcqImageFiles.length > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#fca5a5', textAlign: 'center' }}>⚠️ Please select a subject above first.</p>
                )}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '10px 0' }} />

              {mcqItems.map((mcq, qi) => (
                <div key={qi} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-primary-h)' }}>Question {qi + 1}</span>
                    {mcqItems.length > 1 && (
                      <button type="button" onClick={() => removeMcqItem(qi)} style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' }}>✕ Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Question Text</label>
                      <input className="input-field" placeholder="e.g. Which of the following is a feature of OOP?" value={mcq.question} onChange={e => updateMcqItem(qi, 'question', e.target.value)} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {mcq.options.map((opt, oi) => (
                        <div key={oi}>
                          <label className="block text-sm font-semibold mb-1" style={{ color: oi === mcq.correctOption ? 'var(--clr-success)' : 'var(--clr-text-3)', fontSize: '11px' }}>
                            Option {String.fromCharCode(65 + oi)} {oi === mcq.correctOption ? '✓ Correct' : ''}
                          </label>
                          <input className="input-field" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateMcqOption(qi, oi, e.target.value)}
                            style={{ borderColor: oi === mcq.correctOption ? 'rgba(34,197,94,0.5)' : undefined }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Correct Answer</label>
                        <select className="input-field" value={mcq.correctOption} onChange={e => updateMcqItem(qi, 'correctOption', parseInt(e.target.value))} style={{ cursor: 'pointer' }}>
                          {['A', 'B', 'C', 'D'].map((l, i) => <option key={i} value={i}>Option {l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>Explanation (optional)</label>
                        <input className="input-field" placeholder="Brief explanation for the answer" value={mcq.explanation} onChange={e => updateMcqItem(qi, 'explanation', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addMcqItem}
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.5)', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)', cursor: 'pointer', width: '100%' }}
              >
                + Add Another Question
              </button>
            </motion.div>
          )}
        </div>

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '12px', padding: '18px', fontSize: '16px', borderRadius: '12px', letterSpacing: '0.5px', background: isMcq ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }} disabled={uploading || savingMcqs}>
          {(uploading || savingMcqs) ? <><span className="spinner" /> {isMcq ? 'Saving MCQs...' : 'Processing Upload...'}</>
            : isMcq ? `✅ Save ${mcqItems.length} MCQ(s) to Database`
            : isSolutionBook ? '📚 Publish Solution Book'
            : sourceType === 'DRIVE' ? '🔗 Save Drive Link & Publish'
            : '📤 Upload & Publish Material'}
        </button>
      </form>
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
/* ── Multi File Drop Zone ── */
function MultiFileDropZone({ label, accept, files, onFiles, hint, required }: {
  label: string; accept: string; files: File[]; onFiles: (f: File[]) => void; hint: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--clr-text-2)' }}>{label}</label>
      <div
        style={{
          border: `2px dashed ${files.length > 0 ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
          borderRadius: '12px', padding: '28px',
          textAlign: 'center', background: files.length > 0 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
          position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <input
          type="file" accept={accept} required={required} multiple
          onChange={e => {
            if (e.target.files) {
              onFiles(Array.from(e.target.files))
            }
          }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{files.length > 0 ? '✅' : '📂'}</div>
        <p className="text-sm font-semibold" style={{ color: files.length > 0 ? 'var(--clr-primary-h)' : 'var(--clr-text-2)' }}>
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to Browse Files'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--clr-text-3)' }}>{hint}</p>
        
        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
            {files.map((f, i) => (
              <span key={i} style={{ fontSize: '11px', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '4px', color: 'var(--clr-primary-h)' }}>
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Faculties Tab ── */
function FacultiesTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [search, setSearch] = useState('')

  // Semester visibility states
  const [selectedFacultyForSemesters, setSelectedFacultyForSemesters] = useState('')
  const [semestersList, setSemestersList] = useState<any[]>([])
  const [semestersLoading, setSemestersLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
  }, [])

  useEffect(() => {
    if (!selectedFacultyForSemesters) {
      setSemestersList([])
      return
    }
    setSemestersLoading(true)
    fetch(`/api/admin/semesters?facultyId=${selectedFacultyForSemesters}`)
      .then(r => r.json())
      .then(d => {
        setSemestersList(d.semesters || [])
        setSemestersLoading(false)
      })
      .catch(() => setSemestersLoading(false))
  }, [selectedFacultyForSemesters])

  async function toggleSemesterVisibility(semesterId: string, currentVisible: boolean) {
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesterId, visible: !currentVisible }),
      })
      if (res.ok) {
        toast.success('Semester visibility updated! 🎉')
        setSemestersList(prev => prev.map(s => s.id === semesterId ? { ...s, visible: !currentVisible } : s))
      } else {
        toast.error('Failed to update semester visibility')
      }
    } catch {
      toast.error('Network error')
    }
  }

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

      {/* ── Semester / Year Visibility Control Section ── */}
      <div style={{ marginTop: '40px' }}>
        <h3 className="section-title">🗓️ Semester / Year Visibility Control</h3>
        <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '20px' }}>
          Select a Faculty to tick ✓ which Semesters / Years should be visible to students on the frontend.
        </p>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>
              Select Faculty
            </label>
            <select
              className="input-field"
              value={selectedFacultyForSemesters}
              onChange={e => setSelectedFacultyForSemesters(e.target.value)}
              style={{ maxWidth: '320px', cursor: 'pointer' }}
            >
              <option value="">— Choose Faculty —</option>
              {faculties.map(f => (
                <option key={f.id} value={f.id}>{f.icon} {f.name} ({f.id.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {selectedFacultyForSemesters && (
            <div>
              {semestersLoading ? (
                <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Loading semesters...</p>
              ) : semestersList.length === 0 ? (
                <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>No semesters found for this faculty.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {semestersList.map((sem) => (
                    <div
                      key={sem.id}
                      className="glass-card"
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--clr-border)',
                        background: sem.visible !== false ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--clr-text-1)' }}>{sem.name}</div>
                        <div style={{ fontSize: '11px', color: sem.visible !== false ? 'var(--clr-accent-h)' : 'var(--clr-text-3)', marginTop: '2px' }}>
                          {sem.visible !== false ? '✓ Visible on Frontend' : '✕ Hidden from Students'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={sem.visible !== false}
                        onChange={() => toggleSemesterVisibility(sem.id, sem.visible !== false)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--clr-primary)' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Semesters Visibility Tab ── */
function SemestersTab() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState('bca')
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/faculties')
      .then(r => r.json())
      .then(d => setFaculties(d.faculties || []))
  }, [])

  useEffect(() => {
    if (!selectedFaculty) {
      setSemesters([])
      return
    }
    setLoading(true)
    fetch(`/api/admin/semesters?facultyId=${selectedFaculty}`)
      .then(r => r.json())
      .then(d => {
        setSemesters(d.semesters || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedFaculty])

  async function toggleSemesterVisibility(semesterId: string, field: 'visible' | 'visibleNew' | 'visibleOld', currentVisible: boolean) {
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesterId, [field]: !currentVisible }),
      })
      if (res.ok) {
        toast.success('Visibility updated! 🎉')
        setSemesters(prev => prev.map(s => s.id === semesterId ? { ...s, [field]: !currentVisible } : s))
      } else {
        toast.error('Failed to update visibility')
      }
    } catch {
      toast.error('Network error')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>🗓️ Semester & Year Visibility Control</h3>
        <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
          Tick ✓ to show a semester on the frontend. Untick to hide it from students.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>
            Select Faculty to Manage
          </label>
          <select
            className="input-field"
            value={selectedFaculty}
            onChange={e => setSelectedFaculty(e.target.value)}
            style={{ maxWidth: '360px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.icon} {f.name} ({f.id.toUpperCase()})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-3)' }}>
            <span className="spinner" /> Loading semesters...
          </div>
        ) : semesters.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-3)' }}>
            No semesters configured for this faculty.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {semesters.map((sem) => {
              const isBca = selectedFaculty.toLowerCase() === 'bca'
              const isVisibleNew = sem.visibleNew !== false
              const isVisibleOld = sem.visibleOld !== false
              const isVisibleGeneral = sem.visible !== false

              return (
                <div
                  key={sem.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: '1px solid var(--clr-border)',
                    background: 'rgba(255,255,255,0.01)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--clr-text-1)' }}>
                    {sem.name}
                  </div>

                  {isBca ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}>
                        <span style={{ color: isVisibleNew ? '#67e8f9' : 'var(--clr-text-3)', fontWeight: 700 }}>
                          ✨ New Syllabus (2080+)
                        </span>
                        <input
                          type="checkbox"
                          checked={isVisibleNew}
                          onChange={() => toggleSemesterVisibility(sem.id, 'visibleNew', isVisibleNew)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--clr-primary)' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}>
                        <span style={{ color: isVisibleOld ? '#fcd34d' : 'var(--clr-text-3)', fontWeight: 700 }}>
                          📜 Old Syllabus (2074)
                        </span>
                        <input
                          type="checkbox"
                          checked={isVisibleOld}
                          onChange={() => toggleSemesterVisibility(sem.id, 'visibleOld', isVisibleOld)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                        />
                      </label>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: isVisibleGeneral ? '#67e8f9' : 'var(--clr-text-3)', fontWeight: 700 }}>
                        {isVisibleGeneral ? '🟢 Visible on Frontend' : '⚪ Hidden from Students'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isVisibleGeneral}
                        onChange={() => toggleSemesterVisibility(sem.id, 'visible', isVisibleGeneral)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--clr-primary)' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
                      <th>MCQs</th>
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
                        <td>{sem.mcqsCount || 0}</td>
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
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'TESTIMONIALS' | 'ABOUT' | 'RULES'>('GENERAL')
  const [whatsappLink, setWhatsappLink] = useState('')
  const [facebookLink, setFacebookLink] = useState('')
  const [tiktokLink, setTiktokLink] = useState('')
  const [instagramLink, setInstagramLink] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [githubLink, setGithubLink] = useState('')

  // About items state
  const [aboutItems, setAboutItems] = useState<any[]>([])
  const [aboutLoading, setAboutLoading] = useState(false)
  const [aboutSaving, setAboutSaving] = useState(false)

  // Rules state
  const [buyerRules, setBuyerRules] = useState<string[]>([])
  const [sellerRules, setSellerRules] = useState<string[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesSaving, setRulesSaving] = useState(false)
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null)
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [testimonials, setTestimonials] = useState<any[]>([])
  const [testsLoading, setTestsLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'TESTIMONIALS') {
      setTestsLoading(true)
      fetch('/api/admin/testimonials').then(r => r.json()).then(d => {
        setTestimonials(d.testimonials || [])
      }).catch(() => {}).finally(() => setTestsLoading(false))
    }
    if (activeTab === 'ABOUT') {
      setAboutLoading(true)
      fetch('/api/admin/about')
        .then(r => r.json())
        .then(d => setAboutItems(d.items || []))
        .catch(() => {})
        .finally(() => setAboutLoading(false))
    }
    if (activeTab === 'RULES') {
      setRulesLoading(true)
      fetch('/api/admin/rules')
        .then(r => r.json())
        .then(d => {
          if (d.rules) {
            setBuyerRules(d.rules.buyerRules || [])
            setSellerRules(d.rules.sellerRules || [])
          }
        })
        .catch(() => {})
        .finally(() => setRulesLoading(false))
    }
  }, [activeTab])

  async function handleSaveAbout(e: React.FormEvent) {
    e.preventDefault()
    setAboutSaving(true)
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: aboutItems })
      })
      if (res.ok) {
        toast.success('About items updated! ✅')
      } else {
        toast.error('Failed to update about items')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setAboutSaving(false)
    }
  }

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault()
    setRulesSaving(true)
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: { buyerRules, sellerRules } })
      })
      if (res.ok) {
        toast.success('Platform rules updated! ✅')
      } else {
        toast.error('Failed to update platform rules')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setRulesSaving(false)
    }
  }

  async function updateTestimonialStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (!res.ok) throw new Error('Update failed')
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, status } : t))
      toast.success(`Testimonial ${status}`)
    } catch {
      toast.error('Failed to update testimonial')
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setTestimonials(prev => prev.filter(t => t.id !== id))
      toast.success('Testimonial deleted')
    } catch {
      toast.error('Failed to delete testimonial')
    }
  }

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { 
        if (d.settings) {
          setWhatsappLink(d.settings.whatsappLink || '')
          setFacebookLink(d.settings.facebookLink || '')
          setTiktokLink(d.settings.tiktokLink || '')
          setInstagramLink(d.settings.instagramLink || '')
          setContactPhone(d.settings.contactPhone || '')
          setContactEmail(d.settings.contactEmail || '')
          setGithubLink(d.settings.githubLink || '')
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
      fd.append('facebookLink', facebookLink)
      fd.append('tiktokLink', tiktokLink)
      fd.append('instagramLink', instagramLink)
      fd.append('contactPhone', contactPhone)
      fd.append('contactEmail', contactEmail)
      fd.append('githubLink', githubLink)
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
      <p style={{ color: 'var(--clr-text-2)', marginBottom: '32px' }}>Manage platform-wide settings and content.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '0', flexWrap: 'wrap' }}>
        {(['GENERAL', 'TESTIMONIALS', 'ABOUT', 'RULES'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`btn ${activeTab === t ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '13px', minWidth: '160px', marginBottom: '8px' }}
          >
            {t === 'GENERAL' ? '⚙️ General Settings' : t === 'TESTIMONIALS' ? '💬 Testimonials' : t === 'ABOUT' ? '📖 About Info' : '⚖️ Platform Rules'}
          </button>
        ))}
      </div>

      {activeTab === 'GENERAL' && (
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
                Direct admin contact link for WhatsApp chat. Use format: <code style={{ color: '#a5b4fc' }}>https://wa.me/977XXXXXXXXXX</code>
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                📞 Contact Phone Number
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="9767776999"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                ✉️ Contact Email
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="tunoteshub@gmail.com"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                📘 Facebook Profile Link
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://facebook.com/yourpage"
                value={facebookLink}
                onChange={e => setFacebookLink(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                🎵 TikTok Profile Link
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://tiktok.com/@yourusername"
                value={tiktokLink}
                onChange={e => setTiktokLink(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                📸 Instagram Profile Link
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://instagram.com/yourusername"
                value={instagramLink}
                onChange={e => setInstagramLink(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-2)', marginBottom: '10px' }}>
                🐱 GitHub Profile Link
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://github.com/yourusername"
                value={githubLink}
                onChange={e => setGithubLink(e.target.value)}
              />
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
      )}

      {activeTab === 'TESTIMONIALS' && (
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>💬 Testimonials Management</h3>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Approve testimonials to show them on the homepage marquee.</p>
            </div>
          </div>

          {testsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : testimonials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No Testimonials Found</h3>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Users haven't submitted any testimonials yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {testimonials.map((t: any) => (
                <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                        {t.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>{t.role || 'Student'} • {'⭐'.repeat(t.rating)}</div>
                      </div>
                    </div>
                    <span className={`badge ${t.status === 'APPROVED' ? 'badge-success' : t.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: 'var(--clr-text-2)', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' }}>
                    "{t.content}"
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    {t.status !== 'APPROVED' && (
                      <button onClick={() => updateTestimonialStatus(t.id, 'APPROVED')} className="btn btn-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                        ✅ Approve
                      </button>
                    )}
                    {t.status !== 'REJECTED' && (
                      <button onClick={() => updateTestimonialStatus(t.id, 'REJECTED')} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ❌ Reject
                      </button>
                    )}
                    <button onClick={() => deleteTestimonial(t.id)} className="btn btn-sm btn-danger">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ABOUT' && (
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>📖 About Section Cards</h3>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Customize the mission and feature cards displayed on the About page.</p>
            </div>
            <button
              onClick={() => setAboutItems(prev => [...prev, { id: String(Date.now()), emoji: '🎯', title: 'New Feature', description: 'Feature description' }])}
              className="btn btn-primary btn-sm"
            >
              ➕ Add New Card
            </button>
          </div>

          {aboutLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : (
            <form onSubmit={handleSaveAbout}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                {aboutItems.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                      <label style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>Emoji</label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ width: '60px', textAlign: 'center', fontSize: '20px' }}
                        value={item.emoji}
                        onChange={e => {
                          const updated = [...aboutItems]
                          updated[index].emoji = e.target.value
                          setAboutItems(updated)
                        }}
                        required
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '4px' }}>Card Title</label>
                        <input
                          type="text"
                          className="input-field"
                          value={item.title}
                          onChange={e => {
                            const updated = [...aboutItems]
                            updated[index].title = e.target.value
                            setAboutItems(updated)
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '4px' }}>Description</label>
                        <textarea
                          className="input-field"
                          style={{ height: '80px', resize: 'vertical' }}
                          value={item.description}
                          onChange={e => {
                            const updated = [...aboutItems]
                            updated[index].description = e.target.value
                            setAboutItems(updated)
                          }}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAboutItems(prev => prev.filter(a => a.id !== item.id))}
                      className="btn btn-danger btn-sm"
                      style={{ marginTop: '24px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '20px' }}>
                <button type="submit" disabled={aboutSaving} className="btn btn-primary">
                  {aboutSaving ? 'Saving…' : '💾 Save About Cards'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'RULES' && (
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>⚖️ Platform Rules & Regulations</h3>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Customize guidelines for Buyers and Sellers shown on the About page.</p>
          </div>

          {rulesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : (
            <form onSubmit={handleSaveRules}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                
                {/* Buyer Rules Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-accent)' }}>📥 For Project Buyers</h4>
                    <button
                      type="button"
                      onClick={() => setBuyerRules(prev => [...prev, ''])}
                      className="btn btn-outline btn-sm"
                    >
                      ➕ Add Rule
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {buyerRules.map((rule, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={rule}
                          onChange={e => {
                            const updated = [...buyerRules]
                            updated[index] = e.target.value
                            setBuyerRules(updated)
                          }}
                          placeholder="Enter buyer rule..."
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setBuyerRules(prev => prev.filter((_, i) => i !== index))}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller Rules Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-primary-h)' }}>📤 For Project Sellers</h4>
                    <button
                      type="button"
                      onClick={() => setSellerRules(prev => [...prev, ''])}
                      className="btn btn-outline btn-sm"
                    >
                      ➕ Add Rule
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sellerRules.map((rule, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={rule}
                          onChange={e => {
                            const updated = [...sellerRules]
                            updated[index] = e.target.value
                            setSellerRules(updated)
                          }}
                          placeholder="Enter seller rule..."
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setSellerRules(prev => prev.filter((_, i) => i !== index))}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '20px' }}>
                <button type="submit" disabled={rulesSaving} className="btn btn-primary">
                  {rulesSaving ? 'Saving…' : '💾 Save Platform Rules'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </motion.div>
  )
}
