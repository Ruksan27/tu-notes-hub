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
import AdminBlogTab from '@/components/admin/AdminBlogTab'
import AdminCourseMappingTab from '@/components/admin/AdminCourseMappingTab'
import AdminNotifications from '@/components/admin/AdminNotifications'
import ExamPaperViewer, { ExamPaperData } from '@/components/ExamPaperViewer'
import MarkdownPaperViewer from '@/components/MarkdownPaperViewer'
import { parseLegacyMarkdownToExamData } from '@/lib/legacyParser'
import { fixCloudinaryUrl } from '@/lib/utils'
type AdminTab = 'overview' | 'payments' | 'faculties' | 'semesters' | 'upload' | 'stats' | 'users' | 'materials' | 'projects' | 'sellers' | 'settings' | 'pricing' | 'seo' | 'backup' | 'blogs' | 'mapping'

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

function getShortFacultyName(name: string) {
  if (!name) return ''
  return name
    .replace('Bachelor of Computer Application', 'BCA (Comp. App)')
    .replace('B.Sc. Computer Science & Information Technology', 'B.Sc. CSIT')
    .replace('Bachelor of Business Administration', 'BBA (Business Admin)')
    .replace('Bachelor of Business Management', 'BBM (Business Mgmt)')
    .replace('Bachelor of Business Studies', 'BBS (Business Studies)')
    .replace('Bachelor of Information Management', 'BIM (Info Mgmt)')
    .replace('Bachelor of Information Technology', 'BIT (Info Tech)')
    .replace('Bachelor of Hotel Management', 'BHM (Hotel Mgmt)')
    .replace('Bachelor of Engineering (Computer)', 'BE Computer')
    .replace('B.Sc. (General Science)', 'B.Sc. Science')
    .replace('B.Ed. (General Education)', 'B.Ed. Education')
    .replace('B.Sc. Agriculture', 'B.Sc. Agri')
    .replace('B.Sc. Forestry', 'B.Sc. Forestry')
    .replace('B.Sc. Nursing / Allied Health', 'B.Sc. Nursing')
    .replace('B.Tech (Food Technology)', 'B.Tech Food')
    .replace('B.V.Sc. & AH (Veterinary Science)', 'B.V.Sc. Vet')
    .replace('BA LLB (Integrated Law)', 'BA LLB Law')
    .replace('Bachelor of Architecture', 'B.Arch')
    .replace('Bachelor of Arts', 'BA Arts')
}

export default function AdminPage() {

  const [user, setUser] = useState<{ role: string; name: string; email: string; packageType: string; adminFacultyId?: string; adminSemesterId?: string } | null>(null)
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
    if (u.role !== 'ADMIN' && u.role !== 'CHILD_ADMIN') { router.push('/'); return }
    setUser(u)
    if (u.role === 'CHILD_ADMIN') {
      setTab('upload')
    }
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

  let navItems: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'seo',       icon: '🔍', label: 'SEO Dashboard' },
    { id: 'blogs',     icon: '📝', label: 'Blogs & Articles' },
    { id: 'users',     icon: '👥', label: 'Users & Plans' },
    { id: 'payments',  icon: '💳', label: 'Verify Payments' },
    { id: 'sellers',   icon: '🛍️', label: 'Seller Applications' },
    { id: 'stats',     icon: '📈', label: 'Material Stats' },
    { id: 'materials', icon: '🛠️', label: 'Manage Materials' },
    { id: 'mapping',   icon: '🔗', label: 'Course Mapping' },
    { id: 'faculties', icon: '🏫', label: 'Faculties' },
    { id: 'semesters', icon: '🗓️', label: 'Semester Visibility' },
    { id: 'upload',    icon: '📤', label: 'Upload Materials' },
    { id: 'pricing',   icon: '💰', label: 'Pricing Plans' },
    { id: 'settings',  icon: '⚙️', label: 'Site Settings' },
    { id: 'backup',    icon: '💾', label: 'Data Backup' },
  ]

  if (user?.role === 'CHILD_ADMIN') {
    navItems = [{ id: 'upload', icon: '📤', label: 'Upload Materials' }]
  }

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
            {user?.role !== 'CHILD_ADMIN' && (
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
            )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <AdminNotifications onNavigate={setTab} />
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
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{user.email || 'admin@tunoteshub.me'}</p>
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

            {tab === 'blogs' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminBlogTab />
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

            {tab === 'mapping' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AdminCourseMappingTab />
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
            {tab === 'upload' && <UploadTab user={user} />}

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
  const [semesters, setSemesters] = useState<{ id: string; name: string; order: number; visibleNew?: boolean; visibleOld?: boolean }[]>([])
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
  const [showAiGenerateMcqModal, setShowAiGenerateMcqModal] = useState(false)
  const [aiMcqPaperIds, setAiMcqPaperIds] = useState<string[]>([])
  const [generatingAdminMcqs, setGeneratingAdminMcqs] = useState(false)

  async function handleAdminGenerateMcqs() {
    if (aiMcqPaperIds.length < 1) {
      toast.error('Please select at least 1 past paper to generate MCQs from')
      return
    }
    setGeneratingAdminMcqs(true)
    try {
      const res = await fetch('/api/ai/mcq-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, paperIds: aiMcqPaperIds, saveToDb: true }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`✨ Successfully generated & saved ${data.mcqs?.length || 0} MCQs to DB! 🎉`)
        setShowAiGenerateMcqModal(false)
        setAiMcqPaperIds([])
        if (subjectId) {
          const mcqRes = await fetch(`/api/mcq/${subjectId}`)
          const mcqData = await mcqRes.json()
          setMcqs(mcqData.mcqs || [])
        }
      } else {
        toast.error(data.error || 'Failed to generate MCQs')
      }
    } catch {
      toast.error('AI MCQ generation failed')
    } finally {
      setGeneratingAdminMcqs(false)
    }
  }
  
  // Paper Viewer & Text Editor modal states
  const [viewPaperItem, setViewPaperItem] = useState<{ id: string; type: 'pastpaper' | 'note' | 'cheatsheet'; title: string; extractedText: string; cloudinaryUrl: string; files?: any[] } | null>(null)
  const [viewPaperMode, setViewPaperMode] = useState<'PREVIEW' | 'FILE' | 'EDIT'>('PREVIEW')
  const [editTextValue, setEditTextValue] = useState('')
  const [savingPaperText, setSavingPaperText] = useState(false)

  // ── Student Submissions State ──
  const [submissions, setSubmissions] = useState<any[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsFilter, setSubmissionsFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [submissionsExpanded, setSubmissionsExpanded] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  // ── Rejection Modal State ──
  const [rejectingNote, setRejectingNote] = useState<{ id: string; title: string; fromTab: 'submissions' | 'materials' } | null>(null)
  const [rejectionReasonInput, setRejectionReasonInput] = useState('')

  useEffect(() => {
    loadSubmissions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionsFilter])

  async function loadSubmissions() {
    setSubmissionsLoading(true)
    try {
      const res = await fetch(`/api/admin/submissions?status=${submissionsFilter}`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch {
      // silent
    } finally {
      setSubmissionsLoading(false)
    }
  }

  async function handleSubmissionAction(noteId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) {
    setApprovingId(noteId)
    if (action === 'REJECT' && !rejectionReason) {
      // Find note title for modal display
      const note = submissions.find((s) => s.id === noteId) || notes.find((n) => n.id === noteId)
      setRejectingNote({ id: noteId, title: note?.title || 'Untitled', fromTab: note ? 'submissions' : 'materials' })
      // Do not send request yet; wait for modal confirmation
      setApprovingId(null)
      return
    }
    try {
      const res = await fetch('/api/admin/notes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action, rejectionReason })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || `Note ${action.toLowerCase()}d! 🎉`)
        loadSubmissions()
        if (subjectId) loadMaterials()
        setRejectingNote(null)
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setApprovingId(null)
    }
  }

  function openPaperViewer(item: any, type: 'pastpaper' | 'note' | 'cheatsheet', title: string) {
    const textVal = item.extractedText || item.content || ''
    let filesArr: any[] = []
    if (Array.isArray(item.files)) {
      filesArr = item.files
    } else if (typeof item.files === 'string') {
      try { filesArr = JSON.parse(item.files) } catch {}
    }
    filesArr = filesArr.map(f => typeof f === 'object' && f?.url ? { ...f, url: fixCloudinaryUrl(f.url) } : (typeof f === 'string' ? fixCloudinaryUrl(f) : f))

    const rawUrl = item.cloudinaryUrl || (filesArr.length > 0 && filesArr[0]?.url ? filesArr[0].url : (typeof filesArr[0] === 'string' ? filesArr[0] : ''))
    const cUrl = fixCloudinaryUrl(rawUrl)

    setViewPaperItem({
      id: item.id,
      type,
      title,
      extractedText: textVal,
      cloudinaryUrl: cUrl,
      files: filesArr
    })
    setEditTextValue(textVal)
    setViewPaperMode((cUrl || filesArr.length > 0) ? 'FILE' : 'PREVIEW')
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

  // Helper to finalize rejection from modal
  async function confirmRejection() {
    if (!rejectingNote) return
    const { id } = rejectingNote
    try {
      const res = await fetch('/api/admin/notes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'REJECT', rejectionReason: rejectionReasonInput })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Note rejected! 🎉')
        loadMaterials()
        loadSubmissions()
      } else {
        toast.error(data.error || 'Failed to reject note')
      }
    } catch {
      toast.error('Network error while rejecting')
    } finally {
      setRejectingNote(null)
      setRejectionReasonInput('')
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

      {/* ── Student Submissions Panel ── */}
      <div style={{
        marginBottom: '28px',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'rgba(245,158,11,0.03)',
      }}>
        {/* Panel Header */}
        <button
          type="button"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit'
          }}
          onClick={() => setSubmissionsExpanded(v => !v)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📥</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#fcd34d' }}>Student &amp; Sub-Admin Submissions</span>
            {submissions.length > 0 && submissionsFilter === 'PENDING' && (
              <span style={{ background: 'rgba(245,158,11,0.3)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 800 }}>
                {submissions.length} pending
              </span>
            )}
            {submissionsLoading && <span className="spinner" style={{ width: '14px', height: '14px' }} />}
          </div>
          <span style={{ color: 'var(--clr-text-3)', fontSize: '18px', transition: 'transform 0.2s', transform: submissionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>

        {submissionsExpanded && (
          <div style={{ padding: '0 20px 20px 20px' }}>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSubmissionsFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: submissionsFilter === f
                      ? f === 'PENDING' ? 'rgba(245,158,11,0.3)' : f === 'APPROVED' ? 'rgba(16,185,129,0.25)' : f === 'REJECTED' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'
                      : 'rgba(255,255,255,0.05)',
                    color: submissionsFilter === f
                      ? f === 'PENDING' ? '#fcd34d' : f === 'APPROVED' ? '#34d399' : f === 'REJECTED' ? '#f87171' : '#a5b4fc'
                      : 'var(--clr-text-3)',
                    outline: submissionsFilter === f ? `1px solid ${f === 'PENDING' ? 'rgba(245,158,11,0.4)' : f === 'APPROVED' ? 'rgba(16,185,129,0.35)' : f === 'REJECTED' ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)'}` : 'none',
                  }}
                >
                  {f === 'PENDING' ? '⏳' : f === 'APPROVED' ? '✅' : f === 'REJECTED' ? '❌' : '📋'} {f}
                </button>
              ))}
              <button
                type="button"
                onClick={loadSubmissions}
                style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--clr-text-3)', marginLeft: 'auto' }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Submissions Table */}
            {submissionsLoading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <span className="spinner" style={{ width: '24px', height: '24px' }} />
                <p style={{ color: 'var(--clr-text-3)', marginTop: '10px', fontSize: '13px' }}>Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>
                  {submissionsFilter === 'PENDING' ? '🎉' : '📭'}
                </div>
                <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', fontWeight: 600 }}>
                  {submissionsFilter === 'PENDING' ? 'No pending submissions — all caught up!' : `No ${submissionsFilter.toLowerCase()} submissions found.`}
                </p>
              </div>
            ) : (
              <div className="table-wrap" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '200px' }}>Material Title</th>
                      <th>Type</th>
                      <th>Submitted By</th>
                      <th>Faculty / Subject</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ minWidth: '200px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => {
                      const isPending = s.status === 'PENDING'
                      const isApproved = s.status === 'APPROVED'
                      const isRejected = s.status === 'REJECTED'
                      const isWorking = approvingId === s.id
                      const subjectTitle = s.subject?.title || '—'
                      const subjectCode = s.subject?.code || ''
                      const semesterName = s.subject?.semester?.name || ''
                      const isSubAdmin = s.isSubAdmin || s.authorRole === 'CHILD_ADMIN' || s.authorRole === 'ADMIN'

                      return (
                        <tr key={s.id} style={{ background: isPending ? 'rgba(245,158,11,0.04)' : 'transparent', opacity: isWorking ? 0.6 : 1 }}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--clr-text-1)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.title}
                            </div>
                            {s.description && (
                              <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.description}
                              </div>
                            )}
                            {s.fileSize && (
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>📦 {s.fileSize}</div>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-semester" style={{ fontSize: '10px' }}>
                              {s.noteType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', color: 'var(--clr-text-2)', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>{s.authorName || s.author || '—'}</span>
                              {isSubAdmin && (
                                <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  🛡️ Sub-Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11px', color: 'var(--clr-text-2)', fontWeight: 700 }}>
                              {subjectCode && <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '4px', marginRight: '4px', fontSize: '10px' }}>{subjectCode}</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {semesterName} · {subjectTitle.replace(/\s*\(.*?\)/gi, '').trim()}
                            </div>
                          </td>
                          <td>
                            {isSubAdmin ? (
                              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>— (No Points)</span>
                            ) : (
                              <span style={{ fontWeight: 800, color: '#fcd34d', fontSize: '13px' }}>+{s.awardedPoints || 0}</span>
                            )}
                          </td>
                          <td>
                            {isPending && <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', fontSize: '10px' }}>⏳ PENDING</span>}
                            {isApproved && <span className="badge badge-success" style={{ fontSize: '10px' }}>✅ APPROVED</span>}
                            {isRejected && (
                              <div>
                                <span className="badge badge-low" style={{ fontSize: '10px' }}>❌ REJECTED</span>
                                {s.rejectionReason && (
                                  <div style={{ fontSize: '10.5px', color: '#f87171', marginTop: '3px', maxWidth: '180px', fontStyle: 'italic', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)', wordBreak: 'break-word' }}>
                                    Reason: "{s.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--clr-text-3)', whiteSpace: 'nowrap' }}>
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {(() => {
                                const url = s.cloudinaryUrl
                                const isValid = url && url.trim() !== '' && url !== 'https://drive.google.com'
                                let viewHref = url
                                if (isValid && (url.endsWith('.pdf') || url.includes('/raw/upload/'))) {
                                  viewHref = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`
                                }
                                return isValid ? (
                                  <a
                                    href={viewHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline"
                                    style={{ fontSize: '10px', padding: '3px 8px' }}
                                  >
                                    👁️ View File
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                                    ⚠️ No File Link
                                  </span>
                                )
                              })()}
                              {isPending && (
                                <>
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 800, fontSize: '10px', opacity: isWorking ? 0.5 : 1 }}
                                    disabled={isWorking}
                                    onClick={() => handleSubmissionAction(s.id, 'APPROVE')}
                                  >
                                    {isWorking ? '⏳...' : '✓ Approve'}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ fontSize: '10px', opacity: isWorking ? 0.5 : 1 }}
                                    disabled={isWorking}
                                    onClick={() => {
                                      setRejectingNote({ id: s.id, title: s.title, fromTab: 'submissions' })
                                      setRejectionReasonInput('')
                                    }}
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-full">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Faculty</label>
            <select className="input-field w-full max-w-full" value={facultyId} onChange={e => { setFacultyId(e.target.value); setSemesterId(''); setSubjectId('') }} style={{ cursor: 'pointer' }}>
              <option value="">— Choose Faculty —</option>
              {faculties.map(f => (
                <option key={f.id} value={f.id}>
                  {f.icon} {getShortFacultyName(f.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Semester / Year</label>
            <select className="input-field w-full max-w-full" value={semesterId} onChange={e => { setSemesterId(e.target.value); setSubjectId('') }} disabled={!facultyId} style={{ cursor: facultyId ? 'pointer' : 'not-allowed' }}>
              <option value="">— Choose Period —</option>
              {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Subject</label>
            <select className="input-field w-full max-w-full" value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!semesterId} style={{ cursor: semesterId ? 'pointer' : 'not-allowed' }}>
              <option value="">— Choose Subject —</option>
              <option value="FULL_SEMESTER" style={{ fontWeight: 'bold' }}>— Full Semester Guide (All Subjects) —</option>
              {subjects
                .filter(s => {
                  const selectedSem = semesters.find(sem => sem.id === semesterId)
                  if (!selectedSem) return true
                  
                  const isNew = s.title.includes('New Syllabus') || s.code.startsWith('BCA ')
                  const isOld = s.title.includes('Old Syllabus') || 
                    (!s.code.startsWith('BCA ') && 
                     (s.code.startsWith('CACS') || s.code.startsWith('CAMT') || s.code.startsWith('CASO') || s.code.startsWith('CAEN') || s.code.startsWith('CAAC') || s.code.startsWith('CAST') || s.code.startsWith('CAPJ') || s.code.startsWith('CAEC') || s.code.startsWith('CAMG') || s.code.startsWith('CAIN') || s.code.startsWith('CAOR'))
                    )

                  if (isNew && selectedSem.visibleNew === false) return false
                  if (isOld && selectedSem.visibleOld === false) return false
                  return true
                })
                .map(s => {
                const clean = s.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()
                const display = clean.length > 28 ? clean.slice(0, 26) + '...' : clean
                return <option key={s.id} value={s.id}>[{s.code}] {display}</option>
              })}
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
                      <th>Approval Status</th>
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
                      const isPending = n.status === 'PENDING'
                      const isApproved = n.status === 'APPROVED' || !n.status
                      const isRejected = n.status === 'REJECTED'

                      return (
                        <tr key={n.id} style={{ background: isPending ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                          <td>
                            <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                            {n.author && <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>by {n.author}</div>}
                          </td>
                          <td><span className="badge badge-semester" style={{ fontSize: '11px' }}>{n.noteType?.replace('_', ' ')}</span></td>
                          <td>
                            {isPending && <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)', fontSize: '11px' }}>⏳ PENDING</span>}
                            {isApproved && <span className="badge badge-success" style={{ fontSize: '11px' }}>✅ APPROVED</span>}
                            {isRejected && (
                              <div>
                                <span className="badge badge-low" style={{ fontSize: '11px' }}>❌ REJECTED</span>
                                {n.rejectionReason && (
                                  <div style={{ fontSize: '10.5px', color: '#f87171', marginTop: '3px', maxWidth: '180px', fontStyle: 'italic', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.25)', wordBreak: 'break-word' }}>
                                    Reason: "{n.rejectionReason}"
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
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
                              {isPending && (
                                <>
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 800, fontSize: '11px' }}
                                    onClick={() => handleSubmissionAction(n.id, 'APPROVE')}
                                  >
                                    ✓ Approve (+PTS & OCR)
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ fontSize: '11px' }}
                                    onClick={() => {
                                      setRejectingNote({ id: n.id, title: n.title, fromTab: 'materials' })
                                      setRejectionReasonInput('')
                                    }}
                                  >
                                    ✕ Reject
                                  </button>
                                </>
                              )}
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
                MCQs ({mcqs.length})
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
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => {
                    setAiMcqPaperIds(pastPapers.map((p: any) => p.id))
                    setShowAiGenerateMcqModal(true)
                  }}
                >
                  ✨ Auto-Generate from Papers
                </button>
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
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', fontSize: '11px' }} onClick={() => openPaperViewer(c, 'cheatsheet', c.title)}>👁️ View</button>
                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', fontSize: '11px' }} onClick={() => openEdit(c, 'cheatsheet')}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger" style={{ fontSize: '11px' }} onClick={() => handleDelete(c.id, 'cheatsheet', c.title)}>🗑️ Delete</button>
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
                    {solutionBooks.map((b: any) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.title}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${b.isPremium ? 'badge-elite' : 'badge-success'}`}>
                            {b.isPremium ? '💎 Premium' : '🔓 Free'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id, 'solutionbook', b.title)}>🗑️ Delete</button>
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
                  Preview formatted paper sheet, original file, or edit raw extracted text/JSON directly.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--clr-border)' }}>
                  {(viewPaperItem.cloudinaryUrl || (viewPaperItem.files && viewPaperItem.files.length > 0)) && (
                    <button
                      className="btn btn-xs"
                      style={{
                        background: viewPaperMode === 'FILE' ? 'var(--grad-brand)' : 'transparent',
                        color: '#fff', fontWeight: 700, padding: '5px 12px', borderRadius: '6px'
                      }}
                      onClick={() => setViewPaperMode('FILE')}
                    >
                      📄 Original File
                    </button>
                  )}
                  <button
                    className="btn btn-xs"
                    style={{
                      background: viewPaperMode === 'PREVIEW' ? 'var(--grad-brand)' : 'transparent',
                      color: '#fff', fontWeight: 700, padding: '5px 12px', borderRadius: '6px'
                    }}
                    onClick={() => setViewPaperMode('PREVIEW')}
                  >
                    👁️ Text / Formatted
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
              {viewPaperMode === 'FILE' ? (
                <div style={{ width: '100%', height: '100%', minHeight: '550px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {viewPaperItem.cloudinaryUrl ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          📁 File: {viewPaperItem.cloudinaryUrl}
                        </span>
                        <a href={viewPaperItem.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                          🔗 Open File in New Tab
                        </a>
                      </div>
                      {viewPaperItem.cloudinaryUrl.match(/\.(png|jpg|jpeg|webp|gif)($|\?)/i) ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '12px', overflow: 'auto', padding: '20px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={viewPaperItem.cloudinaryUrl} alt={viewPaperItem.title} style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }} />
                        </div>
                      ) : (() => {
                        // For Cloudinary raw/PDF files, embed through file-proxy (bypasses X-Frame-Options)
                        // For others, use Google Docs viewer
                        const isCloudinaryRaw = viewPaperItem.cloudinaryUrl.includes('res.cloudinary.com')
                        const embedSrc = isCloudinaryRaw
                          ? `/api/file-proxy?url=${encodeURIComponent(viewPaperItem.cloudinaryUrl)}`
                          : `https://docs.google.com/gview?url=${encodeURIComponent(viewPaperItem.cloudinaryUrl)}&embedded=true`
                        return (
                          <iframe
                            src={embedSrc}
                            style={{ width: '100%', height: '600px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            title={viewPaperItem.title}
                          />
                        )
                      })()}
                    </>
                  ) : viewPaperItem.files && viewPaperItem.files.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: 700 }}>📁 Attached Files ({viewPaperItem.files.length})</h4>
                      {viewPaperItem.files.map((f: any, idx: number) => {
                        const fUrl = typeof f === 'string' ? f : (f.url || '')
                        const fName = typeof f === 'string' ? `File ${idx + 1}` : (f.name || `File ${idx + 1}`)
                        return (
                          <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>📄 {fName}</span>
                            <a href={fUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                              🔗 Open / Download File
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--clr-text-3)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                      <p style={{ fontSize: '15px', color: 'var(--clr-text-2)' }}>No original file attached to this item.</p>
                    </div>
                  )}
                </div>
              ) : viewPaperMode === 'PREVIEW' ? (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  {(() => {
                    // Cheatsheets — show content text directly
                    if (viewPaperItem.type === 'cheatsheet' && viewPaperItem.extractedText) {
                      return (
                        <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <span className="badge badge-elite" style={{ fontSize: '11px', padding: '4px 12px', width: 'fit-content' }}>✨ CHEATSHEET CONTENT</span>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', fontSize: '14px', lineHeight: 1.7, color: 'var(--clr-text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {viewPaperItem.extractedText}
                          </div>
                        </div>
                      )
                    }

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

      {/* ── AI MCQ Generator Modal ── */}
      {showAiGenerateMcqModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', padding: '20px' }} onClick={() => setShowAiGenerateMcqModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '20px', background: '#0f172a', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 25px 50px -12px rgba(168,85,247,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>✨</span>
                <h4 style={{ fontWeight: 800, fontSize: '18px', color: '#c084fc', margin: 0 }}>Auto-Generate MCQs from Past Papers</h4>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }} onClick={() => setShowAiGenerateMcqModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.5' }}>
              Select past paper PDFs to analyze with AI. Questions will be extracted, turned into 4-option MCQs with explanations, and saved permanently to this subject's question bank.
            </p>
            
            {pastPapers.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#f87171', padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
                ⚠️ No past papers uploaded for this subject yet. Upload past paper PDFs first to auto-generate MCQs!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                {pastPapers.map((paper: any) => {
                  const isChecked = aiMcqPaperIds.includes(paper.id)
                  return (
                    <label key={paper.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: isChecked ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)', border: isChecked ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#f8fafc', fontWeight: 600, transition: 'all 0.2s' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        style={{ accentColor: '#c084fc', width: '16px', height: '16px' }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAiMcqPaperIds(prev => [...prev, paper.id])
                          } else {
                            setAiMcqPaperIds(prev => prev.filter(id => id !== paper.id))
                          }
                        }}
                      />
                      <span>📄 Year {paper.year} Exam Paper ({paper.title || 'Past Paper'})</span>
                    </label>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }} onClick={() => setShowAiGenerateMcqModal(false)}>Cancel</button>
              <button
                className="btn btn-sm"
                disabled={generatingAdminMcqs || aiMcqPaperIds.length === 0}
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#fff', fontWeight: 700, padding: '8px 18px' }}
                onClick={handleAdminGenerateMcqs}
              >
                {generatingAdminMcqs ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="animate-spin" style={{ display: 'inline-block' }}>⚙️</span> Generating MCQs...
                  </span>
                ) : (
                  `✨ Generate & Save (${aiMcqPaperIds.length} papers)`
                )}
              </button>
            </div>
          </div>
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
      {/* ── Rejection Reason Modal ── */}
      {rejectingNote && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#0b1329', border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%', color: '#fff',
            boxShadow: '0 20px 50px rgba(239,68,68,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ❌ Reject Material Submission
              </h3>
              <button
                type="button"
                onClick={() => setRejectingNote(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.5 }}>
              Specify the reason why <strong style={{ color: '#fff' }}>"{rejectingNote.title}"</strong> is being rejected. This will send an in-app notification to the user with the exact details.
            </p>

            {/* Preset Chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Quick Select Preset Reason
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  '📷 Blurry / unreadable photos or PDF',
                  '📚 Wrong Faculty, Semester, or Subject selected',
                  '📄 Incomplete document or missing pages',
                  '⚠️ Duplicate file or copyright violation',
                  '🎯 Low academic quality / does not meet guidelines',
                  '🔗 Invalid external link or file unaccessible'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectionReasonInput(chip)}
                    style={{
                      background: rejectionReasonInput === chip ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${rejectionReasonInput === chip ? '#ef4444' : 'rgba(255, 255, 255, 0.12)'}`,
                      color: rejectionReasonInput === chip ? '#fca5a5' : '#cbd5e1',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Reason Explanation (Custom Text)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Blur pages, duplicate note, missing diagrams, or wrong subject category."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', background: '#050a14',
                  border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '13.5px', outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRejectingNote(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectingNote) return
                  const reason = rejectionReasonInput.trim() || 'Content did not meet quality guidelines.'
                  handleSubmissionAction(rejectingNote.id, 'REJECT', reason)
                }}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none',
                  borderRadius: '10px', padding: '9px 22px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                Confirm Rejection ❌
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ── Users Tab ── */
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [verifiedFilter, setVerifiedFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [faculties, setFaculties] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [adminSemesters, setAdminSemesters] = useState<any[]>([])

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('STUDENT')
  const [newAdminFacultyId, setNewAdminFacultyId] = useState('')
  const [newAdminSemesterId, setNewAdminSemesterId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newAdminSemesters, setNewAdminSemesters] = useState<any[]>([])

  // Edit User State
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCollege, setEditCollege] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editFacultyId, setEditFacultyId] = useState('')
  const [editSemesterOrder, setEditSemesterOrder] = useState<string | number>('')
  const [editAdminFacultyId, setEditAdminFacultyId] = useState('')
  const [editAdminSemesterId, setEditAdminSemesterId] = useState('')
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

  useEffect(() => {
    if (!editAdminFacultyId) {
      setAdminSemesters([])
      return
    }
    fetch(`/api/admin/semesters?facultyId=${editAdminFacultyId}`)
      .then(r => r.json())
      .then(d => setAdminSemesters(d.semesters || []))
  }, [editAdminFacultyId])

  useEffect(() => {
    if (!newAdminFacultyId) {
      setNewAdminSemesters([])
      return
    }
    fetch(`/api/admin/semesters?facultyId=${newAdminFacultyId}`)
      .then(r => r.json())
      .then(d => setNewAdminSemesters(d.semesters || []))
  }, [newAdminFacultyId])

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

  async function deleteUser(userId: string, userName: string) {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete the user "${userName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('User deleted successfully! 🗑️')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete user')
      }
    } catch {
      toast.error('Network error')
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newEmail || !newPassword) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          adminFacultyId: newAdminFacultyId || null,
          adminSemesterId: newAdminSemesterId || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'User created successfully! ✅')
        setShowCreateModal(false)
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setNewRole('STUDENT')
        setNewAdminFacultyId('')
        setNewAdminSemesterId('')
        fetchUsers()
      } else {
        toast.error(data.error || 'Failed to create user')
      }
    } catch {
      toast.error('Failed to create user')
    } finally {
      setCreating(false)
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
          college: editCollege || null,
          phone: editPhone || null,
          gender: editGender || null,
          role: editRole,
          facultyId: editFacultyId || null,
          semesterOrder: editSemesterOrder !== '' ? parseInt(String(editSemesterOrder)) : null,
          adminFacultyId: editAdminFacultyId || null,
          adminSemesterId: editAdminSemesterId || null,
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
    setEditCollege(u.college || '')
    setEditPhone(u.phone || '')
    setEditGender(u.gender || '')
    setEditRole(u.role || 'STUDENT')
    setEditFacultyId(u.facultyId || '')
    setEditSemesterOrder(u.semesterOrder !== null && u.semesterOrder !== undefined ? u.semesterOrder : '')
    setEditAdminFacultyId(u.adminFacultyId || '')
    setEditAdminSemesterId(u.adminSemesterId || '')
  }

  const filtered = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesPlan = planFilter === 'ALL' || u.packageType === planFilter
    const matchesVerified =
      verifiedFilter === 'ALL'
        ? true
        : verifiedFilter === 'VERIFIED'
        ? u.isEmailVerified === true
        : u.isEmailVerified !== true

    return matchesSearch && matchesRole && matchesPlan && matchesVerified
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>👥 Users &amp; Plans</h3>
          <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
            Manage registered students, grant premium access manually, and view active subscriptions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: '260px', padding: '8px 14px', borderRadius: '8px' }}
          />
          <button className="primary-btn" onClick={() => setShowCreateModal(true)} style={{ padding: '8px 16px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
            ✨ Add User
          </button>
        </div>
      </div>

      {/* ── Filter Bar for Role, Plan, and Verification Status ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        padding: '10px 16px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>⚙️</span> Filter:
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            background: roleFilter !== 'ALL' ? 'rgba(99,102,241,0.2)' : '#0f172a',
            border: roleFilter !== 'ALL' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: roleFilter !== 'ALL' ? '#a5b4fc' : '#cbd5e1',
            boxShadow: roleFilter !== 'ALL' ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
          }}
        >
          <option value="ALL" style={{ background: '#0f172a', color: '#fff' }}>👥 All Roles</option>
          <option value="STUDENT" style={{ background: '#0f172a', color: '#fff' }}>🎓 Students</option>
          <option value="CHILD_ADMIN" style={{ background: '#0f172a', color: '#fff' }}>🛡️ Sub-Admins / Uploaders</option>
          <option value="ADMIN" style={{ background: '#0f172a', color: '#fff' }}>👑 Super Admins</option>
        </select>

        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            background: planFilter !== 'ALL' ? 'rgba(6,182,212,0.2)' : '#0f172a',
            border: planFilter !== 'ALL' ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: planFilter !== 'ALL' ? '#67e8f9' : '#cbd5e1',
            boxShadow: planFilter !== 'ALL' ? '0 0 12px rgba(6,182,212,0.2)' : 'none',
          }}
        >
          <option value="ALL" style={{ background: '#0f172a', color: '#fff' }}>💳 All Plans</option>
          <option value="FREE" style={{ background: '#0f172a', color: '#fff' }}>🆓 Free Plan</option>
          <option value="SEMESTER_PASS" style={{ background: '#0f172a', color: '#fff' }}>🎓 Semester Pass</option>
          <option value="ELITE_AI" style={{ background: '#0f172a', color: '#fff' }}>💎 Elite AI</option>
        </select>

        {/* Verification Status Filter */}
        <select
          value={verifiedFilter}
          onChange={e => setVerifiedFilter(e.target.value)}
          style={{
            width: 'auto',
            minWidth: '150px',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            background: verifiedFilter !== 'ALL' ? 'rgba(16,185,129,0.2)' : '#0f172a',
            border: verifiedFilter !== 'ALL' ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: verifiedFilter !== 'ALL' ? '#6ee7b7' : '#cbd5e1',
            boxShadow: verifiedFilter !== 'ALL' ? '0 0 12px rgba(16,185,129,0.2)' : 'none',
          }}
        >
          <option value="ALL" style={{ background: '#0f172a', color: '#fff' }}>✔️ All Verification Status</option>
          <option value="VERIFIED" style={{ background: '#0f172a', color: '#fff' }}>✅ Verified Only</option>
          <option value="UNVERIFIED" style={{ background: '#0f172a', color: '#fff' }}>⚠️ Unverified Only</option>
        </select>

        {/* Reset Filters Button */}
        {(roleFilter !== 'ALL' || planFilter !== 'ALL' || verifiedFilter !== 'ALL' || search) && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => { setRoleFilter('ALL'); setPlanFilter('ALL'); setVerifiedFilter('ALL'); setSearch(''); }}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 14px',
              background: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '999px',
              cursor: 'pointer',
            }}
          >
            ✕ Reset Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          Showing <strong style={{ color: '#fcd34d', fontSize: '13px' }}>{filtered.length}</strong> of {users.length} users
        </div>
      </div>

      <div className="table-wrap">
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px 0' }}>✨ Add New User</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Name</label>
                  <input type="text" className="input-field" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Email</label>
                  <input type="email" className="input-field" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Password</label>
                  <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2">Role</label>
                  <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Super Admin</option>
                    <option value="CHILD_ADMIN">Child Admin (Uploader)</option>
                  </select>
                </div>
                
                {newRole === 'CHILD_ADMIN' && (
                  <div style={{ padding: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--clr-primary-h)' }}>CHILD ADMIN PERMISSIONS</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2">Assigned Faculty</label>
                        <select className="input-field" value={newAdminFacultyId} onChange={e => setNewAdminFacultyId(e.target.value)} required>
                          <option value="">-- Select --</option>
                          {faculties.map(f => (
                            <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2">Assigned Semester</label>
                        <select className="input-field" value={newAdminSemesterId} onChange={e => setNewAdminSemesterId(e.target.value)} required disabled={!newAdminFacultyId}>
                          <option value="">-- Select --</option>
                          {newAdminSemesters.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={creating} style={{ padding: '8px 16px', borderRadius: '8px' }}>
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Student / User</th>
              <th>Role</th>
              <th>Current Plan</th>
              <th>Subscription Expires</th>
              <th>Actions (Grant Access & Edit)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}><span className="spinner" style={{ width: '24px', height: '24px' }} /> Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--clr-text-3)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📭</div>
                  No matching users found for selected filters.
                </td>
              </tr>
            ) : (
              filtered.map(u => {
                const isAdmin = u.role === 'ADMIN'
                const isSubAdmin = u.role === 'CHILD_ADMIN'
                const initials = (u.name || u.email || 'U').substring(0, 2).toUpperCase()

                return (
                  <tr key={u.id} style={{ transition: 'background 0.2s' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name || 'User'}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                              border: '1.5px solid rgba(255,255,255,0.15)'
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const sibling = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (sibling) sibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: isAdmin ? 'linear-gradient(135deg, #a855f7, #ec4899)' : isSubAdmin ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#ffffff', fontWeight: 800, fontSize: '13px',
                          display: u.avatarUrl ? 'none' : 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                          margin: '0 auto',
                          textAlign: 'center',
                          lineHeight: '36px'
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--clr-text-1)', fontSize: '13.5px' }}>{u.name || 'Unknown User'}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--clr-text-3)' }}>{u.email}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                            {u.isEmailVerified ? (
                              <span style={{ color: '#34d399', fontWeight: 700 }}>• ✅ Verified</span>
                            ) : (
                              <span style={{ color: '#fbbf24', fontWeight: 700 }}>• ⚠️ Unverified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isAdmin && (
                        <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.25))', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)', fontWeight: 800, fontSize: '10px' }}>
                          👑 SUPER ADMIN
                        </span>
                      )}
                      {isSubAdmin && (
                        <span className="badge" style={{ background: 'rgba(6,182,212,0.2)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.35)', fontWeight: 800, fontSize: '10px' }}>
                          🛡️ SUB-ADMIN
                        </span>
                      )}
                      {!isAdmin && !isSubAdmin && (
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 700, fontSize: '10px' }}>
                          🎓 STUDENT
                        </span>
                      )}
                    </td>
                    <td>
                      {u.packageType === 'ELITE_AI' && (
                        <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(129,140,248,0.25))', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', fontWeight: 800, fontSize: '10px' }}>
                          💎 ELITE AI
                        </span>
                      )}
                      {u.packageType === 'SEMESTER_PASS' && (
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)', fontWeight: 800, fontSize: '10px' }}>
                          🎓 SEM PASS
                        </span>
                      )}
                      {u.packageType !== 'ELITE_AI' && u.packageType !== 'SEMESTER_PASS' && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}>
                          🆓 FREE
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--clr-text-2)', fontWeight: 600 }}>
                      {u.subscriptionExpiresAt ? (
                        <span style={{ color: '#e2e8f0' }}>
                          {new Date(u.subscriptionExpiresAt).toLocaleDateString('en-NP', { dateStyle: 'medium' })}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', fontSize: '11px', fontWeight: 600, padding: '4px 10px' }}
                          onClick={() => startEdit(u)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px', fontWeight: 600, padding: '4px 10px' }}
                          onClick={() => updateUserPlan(u.id, 'SEMESTER_PASS', 6)}
                        >
                          + Sem Pass (6m)
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(217,70,239,0.12)', color: '#e879f9', border: '1px solid rgba(217,70,239,0.3)', fontSize: '11px', fontWeight: 600, padding: '4px 10px' }}
                          onClick={() => updateUserPlan(u.id, 'ELITE_AI', 12)}
                        >
                          + Elite (1yr)
                        </button>
                        {u.packageType !== 'FREE' && (
                          <button
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                            onClick={() => updateUserPlan(u.id, 'FREE', 0)}
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => deleteUser(u.id, u.name || u.email)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
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
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>College</label>
                <input type="text" className="input-field" value={editCollege} onChange={e => setEditCollege(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Phone Number</label>
                <input type="text" className="input-field" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Gender</label>
                <select className="input-field" value={editGender} onChange={e => setEditGender(e.target.value)}>
                  <option value="">None / Not Selected</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>System Role</label>
                <select className="input-field" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="CHILD_ADMIN">CHILD_ADMIN (UPLOADER)</option>
                  <option value="ADMIN">ADMIN (SUPER)</option>
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
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Semester / Year (Student)</label>
                <select className="input-field" value={editSemesterOrder} onChange={e => setEditSemesterOrder(e.target.value)} disabled={!editFacultyId}>
                  <option value="">None / Not Selected</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.order}>{s.name}</option>
                  ))}
                </select>
              </div>

              {editRole === 'CHILD_ADMIN' && (
                <div style={{ background: 'rgba(6,182,212,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', margin: 0, color: 'var(--clr-text-1)', fontWeight: 700 }}>Upload Assignment (Child Admin)</h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Assigned Faculty</label>
                    <select className="input-field" value={editAdminFacultyId} onChange={e => { setEditAdminFacultyId(e.target.value); setEditAdminSemesterId(''); }}>
                      <option value="">None / Not Selected</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '6px', fontWeight: 600 }}>Assigned Semester / Year</label>
                    <select className="input-field" value={editAdminSemesterId} onChange={e => setEditAdminSemesterId(e.target.value)} disabled={!editAdminFacultyId}>
                      <option value="">None / Not Selected</option>
                      {adminSemesters.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

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
function UploadTab({ user }: { user?: any }) {
  const [contentType, setContentType] = useState<'NOTE' | 'PAST_PAPER' | 'CHEATSHEET' | 'SOLUTION_BOOK' | 'MCQ'>('NOTE')
  const [sourceType, setSourceType] = useState<'FILE' | 'DRIVE'>('FILE')
  const [driveLink, setDriveLink] = useState('')
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [semesters, setSemesters] = useState<{ id: string; name: string; order: number; visibleNew?: boolean; visibleOld?: boolean }[]>([])
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

  // Auto-SEO Generator State for Upload Section
  const [showSeoBox, setShowSeoBox] = useState(false)
  const [seoCodeSnippet, setSeoCodeSnippet] = useState('')
  const [seoKeywordsList, setSeoKeywordsList] = useState<string[]>([])

  // MCQ State
  const [mcqYear, setMcqYear] = useState<string>(new Date().getFullYear().toString())
  const [mcqExamType, setMcqExamType] = useState('BOARD_EXAM')
  const [mcqItems, setMcqItems] = useState<any[]>([
    { question: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }
  ])
  const [savingMcqs, setSavingMcqs] = useState(false)
  const [mcqImageFiles, setMcqImageFiles] = useState<File[]>([])
  const [mcqImageGenerating, setMcqImageGenerating] = useState(false)

  // AI Valuation State
  const [projectPrice, setProjectPrice] = useState<string>('3500')
  const [evaluatingPrice, setEvaluatingPrice] = useState(false)
  const [aiValuationResult, setAiValuationResult] = useState<any>(null)
  const [hasReportPdf, setHasReportPdf] = useState(true)
  const [hasDocumentation, setHasDocumentation] = useState(true)
  const [hasDemoVideo, setHasDemoVideo] = useState(false)
  const [hasSqlScript, setHasSqlScript] = useState(true)

  async function handleEvaluateProjectPrice() {
    if (!noteTitle && !noteDescription) {
      toast.error('Please enter a Title or Description first!')
      return
    }

    setEvaluatingPrice(true)
    toast.loading('🤖 AI is evaluating project complexity & calculating fair price...', { toastId: 'eval-price' })

    try {
      const selectedFaculty = faculties.find(f => f.id === facultyId)
      const selectedSemester = semesters.find(s => s.id === semesterId)
      const selectedSubject = subjects.find(s => s.id === subjectId)

      const res = await fetch('/api/ai/project-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle,
          description: noteDescription,
          projectType: noteType,
          category: selectedFaculty?.name,
          subcategory: selectedSemester?.name,
          technologies: selectedSubject?.title,
          sourceDriveLink: driveLink,
          hasReportPdf,
          hasDocumentation,
          hasDemoVideo,
          hasSqlScript
        })
      })

      const data = await res.json()
      toast.dismiss('eval-price')

      if (res.ok && data.appraisal) {
        setAiValuationResult(data.appraisal)
        setProjectPrice(String(data.appraisal.calculatedPriceNpr))
        toast.success(`✨ Fair Price Calculated: Rs. ${data.appraisal.calculatedPriceNpr} (${data.appraisal.complexityGrade})`)
      } else {
        toast.error(data.error || 'Failed to evaluate price')
      }
    } catch (err: any) {
      toast.dismiss('eval-price')
      toast.error(err.message || 'Network error during valuation')
    } finally {
      setEvaluatingPrice(false)
    }
  }


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

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
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
          (newMcq: any) => !existingQuestions.has((newMcq.question || '').toLowerCase().trim())
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
    setMcqItems(prev => prev.map((item, idx) => idx === qi ? { ...item, options: item.options.map((o: string, k: number) => k === oi ? val : o) } : item))
  }

  useEffect(() => {
    fetch('/api/admin/faculties').then(r => r.json()).then(d => {
      setFaculties(d.faculties || [])
      if (user?.role === 'CHILD_ADMIN' && user.adminFacultyId) {
        setFacultyId(user.adminFacultyId)
      }
    })
  }, [user])

  useEffect(() => {
    if (!facultyId) { setSemesters([]); setSemesterId(''); setSemesterOrder(0); return }
    fetch(`/api/admin/semesters?facultyId=${facultyId}`).then(r => r.json()).then(d => {
      setSemesters(d.semesters || [])
      if (user?.role === 'CHILD_ADMIN' && user.adminSemesterId) {
        setSemesterId(user.adminSemesterId)
      }
    })
  }, [facultyId, user])

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
        
        if (noteFile.size > 10 * 1024 * 1024) {
          toast.loading(`File is ${(noteFile.size / 1024 / 1024).toFixed(1)}MB (>10MB). Auto-uploading to Google Drive... ☁️`, { toastId: 'upload-progress' })
          try {
            const formData = new FormData()
            formData.append('file', noteFile)
            const driveRes = await fetch('/api/upload-drive', { method: 'POST', body: formData })
            const driveData = await driveRes.json()
            if (!driveRes.ok || !driveData.success) {
              toast.dismiss('upload-progress')
              toast.error(driveData.error || 'Google Drive upload failed')
              setUploading(false)
              return
            }
            cloudinaryUrl = driveData.driveLink
            fileSize = driveData.fileSize || `${(noteFile.size / 1024 / 1024).toFixed(2)} MB`
            toast.dismiss('upload-progress')
            toast.success('Uploaded to Google Drive automatically! 🚀')
          } catch (err: any) {
            toast.dismiss('upload-progress')
            toast.error(err.message || 'Drive upload error')
            setUploading(false)
            return
          }
        } else {
          toast.loading(`Uploading file (${(noteFile.size / 1024 / 1024).toFixed(1)}MB)...`, { toastId: 'upload-progress' })
          try {
            const sigRes = await fetch('/api/upload/signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'tu-notes-hub/solution-books' }) })
            if (!sigRes.ok) { toast.dismiss('upload-progress'); toast.error('Signature error'); setUploading(false); return }
            const { timestamp, signature, cloudName, apiKey, folder: sf } = await sigRes.json()
            
            const ext = noteFile.name.split('.').pop()?.toLowerCase() || ''
            const rt = ['jpg','jpeg','png','webp','pdf'].includes(ext) ? 'image' : 'auto'
            
            const cf = new FormData()
            cf.append('file', noteFile)
            cf.append('api_key', apiKey)
            cf.append('timestamp', String(timestamp))
            cf.append('signature', signature)
            cf.append('folder', sf)
            
            const cr = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${rt}/upload`, {
              method: 'POST',
              body: cf
            })
            
            const cd = await cr.json()
            if (!cr.ok || !cd.secure_url) {
              toast.dismiss('upload-progress'); toast.error(cd.error?.message || 'Cloudinary upload failed'); setUploading(false); return
            }
            const finalUrl = cd.secure_url
            
            if (!finalUrl) throw new Error('Failed to get secure URL')
            cloudinaryUrl = finalUrl; fileSize = `${(noteFile.size / 1024 / 1024).toFixed(2)} MB`
          } catch (err: any) { toast.dismiss('upload-progress'); toast.error(err.message || 'Upload error'); setUploading(false); return }
        }
      }
      toast.dismiss('upload-progress')
      toast.loading('Saving...', { toastId: 'upload-progress' })
      let finalTitle = noteTitle
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
            const ext = file.name.split('.').pop()?.toLowerCase() || ''
            const resourceType = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? 'image' : 'auto'

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
      } else if (contentType === 'PAST_PAPER') {
        if (!paperYear) { toast.dismiss('upload-progress'); toast.error('Year required'); setUploading(false); return }
        payload.year = paperYear; payload.examType = examType
      } else if (contentType === 'CHEATSHEET') {
        if (!sheetTitle) { toast.dismiss('upload-progress'); toast.error('Title required'); setUploading(false); return }
        payload.title = sheetTitle;
        payload.content = sheetContent || '';
        payload.files = [{ url: normalizeDriveUrl(driveLink), name: "Google Drive File", size: "Drive Link", type: "DRIVE_LINK" }]
      } else if (contentType === 'MCQ') {
        if (!mcqYear) { toast.dismiss('upload-progress'); toast.error('Year required'); setUploading(false); return }
        payload.contentType = 'NOTE'
        payload.noteType = 'MCQ_FILE'
        const currentSub = subjects.find(s => s.id === subjectId)
        payload.title = `${currentSub?.title || 'MCQ'} Collection - ${mcqYear}`
        payload.description = `MCQ file for ${currentSub?.title || 'Subject'}`
        payload.isPremium = 'false'
        payload.author = 'Admin'
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

    setUploading(true)

    let cloudinaryUrl = ''
    let fileSize = ''

    if (fileToUpload.size > 10 * 1024 * 1024) {
      toast.loading(`File is ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB (>10MB). Auto-uploading to Google Drive... ☁️`, { toastId: 'upload-progress' })
      try {
        const formData = new FormData()
        formData.append('file', fileToUpload)
        const driveRes = await fetch('/api/upload-drive', { method: 'POST', body: formData })
        const driveData = await driveRes.json()
        if (!driveRes.ok || !driveData.success) {
          toast.dismiss('upload-progress')
          toast.error(driveData.error || 'Google Drive upload failed')
          setUploading(false)
          return
        }
        cloudinaryUrl = driveData.driveLink
        fileSize = driveData.fileSize || `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`
        toast.dismiss('upload-progress')
        toast.success('Uploaded to Google Drive automatically! 🚀')
      } catch (err: any) {
        toast.dismiss('upload-progress')
        toast.error(err.message || 'Drive upload error')
        setUploading(false)
        return
      }
    } else {

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
        toast.loading(`Uploading file (${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB)...`, { toastId: 'upload-progress' })
        const sigRes = await fetch('/api/upload/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder })
        })
        if (!sigRes.ok) {
          const err = await sigRes.json()
          toast.dismiss('upload-progress'); toast.error(err.error || 'Failed to get upload signature')
          setUploading(false)
          return
        }
        const { timestamp, signature, cloudName, apiKey, folder: signedFolder } = await sigRes.json()

        // Step 2: Upload directly to Cloudinary
        const cloudForm = new FormData()
        cloudForm.append('file', fileToUpload)
        cloudForm.append('api_key', apiKey)
        cloudForm.append('timestamp', String(timestamp))
        cloudForm.append('signature', signature)
        cloudForm.append('folder', signedFolder)

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { 
            method: 'POST', 
            body: cloudForm 
          }
        )
        const cloudData = await cloudRes.json()
        
        if (!cloudRes.ok || !cloudData.secure_url) {
          toast.dismiss('upload-progress'); toast.error(cloudData.error?.message || 'Cloudinary upload failed')
          setUploading(false)
          return
        }

        cloudinaryUrl = cloudData.secure_url
        fileSize = `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`
      } catch (err: any) {
        toast.dismiss('upload-progress')
        toast.error(err.message || 'Upload error')
        setUploading(false)
        return
      }
    }

    try {
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
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title is required'); setUploading(false); return }
        payload.title = noteTitle
        payload.description = noteDescription
        payload.noteType = noteType
        payload.isPremium = isPremium
        payload.author = author
      } else if ((contentType as string) === 'SOLUTION_BOOK') {
        if (!noteTitle) { toast.dismiss('upload-progress'); toast.error('Title is required'); setUploading(false); return }
        payload.title = noteTitle
        payload.description = noteDescription
        payload.isPremium = isPremium
        payload.author = author
        payload.semesterId = semesterId
        payload.subjectId = subjectId || null
      } else if (contentType === 'PAST_PAPER') {
        if (!paperYear) { toast.dismiss('upload-progress'); toast.error('Year is required'); setUploading(false); return }
        payload.year = paperYear
        payload.examType = examType
      }

      const uploadApiEndpoint = (contentType as string) === 'SOLUTION_BOOK' ? '/api/upload/solution-book' : '/api/upload'

      const sr = await fetch(uploadApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const sd = await sr.json()
      toast.dismiss('upload-progress')
      if (sr.ok) {
        toast.success(sd.message || 'Material published! 🎉')
        setNoteTitle('')
        setNoteDescription('')
        setAuthor('')
        setNoteFile(null)
        setPaperFile(null)
      } else {
        toast.error(sd.error || 'Failed to save material')
      }
    } catch (err: any) {
      toast.dismiss('upload-progress')
      toast.error(err.message || 'An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  const typeOptions = [
    { type: 'NOTE',          icon: '📄', label: 'Study Note', desc: 'Handwritten & PDF notes' },
    { type: 'PAST_PAPER',    icon: '📝', label: 'Past Paper', desc: 'TU Exam Board papers' },
    { type: 'CHEATSHEET',    icon: '📋', label: 'Cheatsheet', desc: 'Quick exam revision' },
    { type: 'SOLUTION_BOOK', icon: '📚', label: 'Solution Book', desc: 'Full semester guide' },
    { type: 'MCQ',           icon: '✅', label: 'MCQ Questions', desc: 'Practice test sets' },
  ]

  const isSolutionBook = contentType === 'SOLUTION_BOOK'
  const isMcq = contentType === 'MCQ'

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1100px] mx-auto pb-16">
      
      {/* ── Sleek Header Banner ── */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-indigo-500/20 rounded-[20px] p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 flex-shrink-0">
            📤
          </div>
          <div>
            <h2 className="text-2xl sm:text-[26px] font-black text-white m-0 tracking-tight">
              Publish Study Material
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Upload handwritten notes, solution books, past papers, or MCQs directly to Cloudinary & Google Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Cloud Sync Ready
        </div>
      </div>

      <form onSubmit={handleUpload} className="flex flex-col gap-6">

        {/* ── STEP 1: MATERIAL TYPE SELECTOR (Grid Card) ── */}
        <div className="admin-card p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-500/40">1</div>
            <div>
              <h3 className="text-base font-extrabold text-white m-0">Choose Material Category</h3>
              <span className="text-xs text-slate-400">Select the type of content you are publishing today.</span>
            </div>
          </div>

          {isSolutionBook && (
            <div className="mb-5 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-sm text-cyan-200">
              📚 <strong>Solution Book:</strong> Select a specific subject to pin inside that subject, or choose <em>"Full Semester Guide"</em> to display at the top for all subjects.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {typeOptions.map((item) => (
              <button
                key={item.type} 
                type="button"
                onClick={() => setContentType(item.type as any)}
                className={`
                  flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all duration-300 text-center
                  ${contentType === item.type 
                    ? 'bg-gradient-to-br from-indigo-500/25 to-cyan-500/25 border-[1.5px] border-indigo-500 shadow-lg shadow-indigo-500/25' 
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-[1.5px] border-white/5 hover:border-white/10'}
                `}
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <span className={`text-sm font-extrabold block ${contentType === item.type ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── STEP 2 & STEP 3: COURSE LOCATION & FILE SOURCE (2 Column Layout) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Course Location Card */}
          <div className="admin-card p-6 sm:p-7 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/40">2</div>
              <div>
                <h3 className="text-base font-extrabold text-white m-0">Course Location</h3>
                <span className="text-xs text-slate-400">Faculty, Semester & Subject target.</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="w-full min-w-0">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Faculty *</label>
                  <select className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all ${user?.role === 'CHILD_ADMIN' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} value={facultyId} onChange={e => setFacultyId(e.target.value)} required disabled={user?.role === 'CHILD_ADMIN'}>
                    <option value="" className="bg-slate-900">— Choose Faculty —</option>
                    {faculties.map(f => <option key={f.id} value={f.id} className="bg-slate-900">{f.icon} {getShortFacultyName(f.name)}</option>)}
                  </select>
                </div>
                <div className="w-full min-w-0">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Semester / Year *</label>
                  <select className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all ${facultyId && user?.role !== 'CHILD_ADMIN' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} value={semesterId} onChange={e => setSemesterId(e.target.value)} required disabled={!facultyId || user?.role === 'CHILD_ADMIN'}>
                    <option value="" className="bg-slate-900">— Choose Period —</option>
                    {semesters.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
              </div>




              {/* Subject Dropdown */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 m-0">
                    Subject {contentType === 'SOLUTION_BOOK' ? '(Optional)' : '*'}
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
                      className="text-[10px] bg-indigo-500/20 text-indigo-400 border-none rounded-lg px-2.5 py-1.5 font-bold hover:bg-indigo-500/30 transition-all"
                    >
                      + Add Subject
                    </button>
                  )}
                </div>

                <select
                  className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all ${semesterId ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  required={contentType !== 'SOLUTION_BOOK'}
                  disabled={!semesterId}
                >
                  <option value="" className="bg-slate-900">
                    {contentType === 'SOLUTION_BOOK' ? '— Full Semester Guide (All Subjects) —' : '— Choose Subject —'}
                  </option>
                  {subjects
                    .filter(s => {
                      const selectedSem = semesters.find(sem => sem.id === semesterId)
                      if (!selectedSem) return true
                      
                      const isNew = s.title.includes('New Syllabus') || s.code.startsWith('BCA ')
                      const isOld = s.title.includes('Old Syllabus') || 
                        (!s.code.startsWith('BCA ') && 
                         (s.code.startsWith('CACS') || s.code.startsWith('CAMT') || s.code.startsWith('CASO') || s.code.startsWith('CAEN') || s.code.startsWith('CAAC') || s.code.startsWith('CAST') || s.code.startsWith('CAPJ') || s.code.startsWith('CAEC') || s.code.startsWith('CAMG') || s.code.startsWith('CAIN') || s.code.startsWith('CAOR'))
                        )

                      if (isNew && selectedSem.visibleNew === false) return false
                      if (isOld && selectedSem.visibleOld === false) return false
                      return true
                    })
                    .map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        [{s.code}] {s.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* File Source Card */}
          <div className="admin-card p-6 sm:p-7 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md shadow-cyan-500/40">3</div>
                <div>
                  <h3 className="text-base font-extrabold text-white m-0">File Storage Source</h3>
                  <span className="text-xs text-slate-400">Cloudinary direct upload or Google Drive.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[{ v: 'FILE', icon: '📁', label: 'Local File', hint: 'Max 10MB' }, { v: 'DRIVE', icon: '🔗', label: 'Drive Link', hint: 'Unlimited Size' }].map(s => (
                  <button 
                    key={s.v} 
                    type="button" 
                    onClick={() => setSourceType(s.v as any)}
                    className={`
                      flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all text-center
                      ${sourceType === s.v 
                        ? 'bg-cyan-500/15 border-[1.5px] border-cyan-500/60 shadow-md shadow-cyan-500/10' 
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-[1.5px] border-white/5 hover:border-white/10'}
                    `}
                  >
                    <span className="text-2xl mb-1">{s.icon}</span>
                    <span className={`text-[13px] font-extrabold ${sourceType === s.v ? 'text-cyan-400' : 'text-slate-300'}`}>{s.label}</span>
                    <span className="text-[10px] text-slate-500 block">{s.hint}</span>
                  </button>
                ))}
              </div>

              {sourceType === 'DRIVE' && (
                <div className="mt-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-1.5">🔗 Google Drive Share Link</label>
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all"
                    type="url"
                    placeholder="https://drive.google.com/file/d/xxxxxxxxxx/view?usp=sharing"
                    value={driveLink}
                    onChange={e => setDriveLink(e.target.value)}
                    required
                  />
                  {driveLink && parseDriveLink(driveLink) && (
                    <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5">
                      ✅ Valid Drive link — File ID: <code className="bg-black/30 px-1.5 py-0.5 rounded text-emerald-300">{parseDriveLink(driveLink)}</code>
                    </p>
                  )}
                  {driveLink && !parseDriveLink(driveLink) && (
                    <p className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5">❌ Invalid link. Paste full share link from Google Drive.</p>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* ── STEP 4: MATERIAL DETAILS & METADATA (Full Width Card) ── */}
        {/* ── STEP 4: MATERIAL DETAILS & METADATA (Full Width Card) ── */}
        <div className="admin-card p-6 sm:p-8" style={{ background: 'var(--clr-bg-800)', border: '1px solid var(--clr-border)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md" style={{ background: 'var(--clr-primary)', color: '#fff' }}>4</div>
            <div>
              <h3 className="text-base font-extrabold m-0" style={{ color: 'var(--clr-text-1)' }}>Material Details & Publishing Properties</h3>
              <span className="text-xs" style={{ color: 'var(--clr-text-3)' }}>Title, description, access tier, and attachments.</span>
            </div>
          </div>

          {/* NOTE Fields */}
          {(contentType === 'NOTE' || contentType === 'SOLUTION_BOOK') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: 'var(--clr-text-3)' }}>
                    {isSolutionBook ? 'Solution Book Title *' : noteType === 'PROJECT' ? 'Project Title *' : noteType === 'LAB_WORK' ? 'Lab Work Title *' : 'Note Title *'}
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

                      let generatedTitle = ''
                      let generatedDesc = ''

                      if (contentType === 'SOLUTION_BOOK') {
                        generatedTitle = `TU ${facName} ${semName} Complete Solution Book & Guide PDF (2081/2082)`
                        generatedDesc = `Complete chapterwise solution book and semester guide for TU ${facName} ${semName}. Covers model questions, syllabus solutions, and past exam papers.`
                      } else if (selectedSubject) {
                        generatedTitle = `${facName} ${semName} ${subName} Complete Notes PDF Download (TU Updated 2026)`
                        generatedDesc = `Download free ${facName} ${semName} ${subName} handwritten study notes, chapterwise solutions, and past exam question answers on TU Notes Hub.`
                      } else {
                        toast.error('Please select Faculty, Semester, and Subject first!')
                        return
                      }

                      setNoteTitle(generatedTitle)
                      setNoteDescription(generatedDesc)

                      const cleanSubSlug = (selectedSubject?.title || 'notes')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')

                      const kws = [
                        `${(facultyId || 'bca').toLowerCase()} ${semName.toLowerCase()} ${cleanSubSlug} notes`,
                        `tu ${cleanSubSlug} pdf download nepal`,
                        `${(facultyId || 'bca').toLowerCase()} ${cleanSubSlug} old questions solution tu`,
                        `tribhuvan university ${cleanSubSlug} syllabus`
                      ]
                      setSeoKeywordsList(kws)

                      const snippet = `export const metadata: Metadata = {\n  title: '${generatedTitle}',\n  description: '${generatedDesc}',\n  keywords: [\n${kws.map(k => `    "${k}"`).join(',\n')}\n  ],\n  alternates: {\n    canonical: 'https://tunoteshub.me/notes/${(facultyId || 'bca').toLowerCase()}/${cleanSubSlug}',\n  },\n}`
                      
                      setSeoCodeSnippet(snippet)
                      setShowSeoBox(true)
                      toast.success('✨ Rank #1 Auto-SEO Package Generated!')
                    }}
                    className="text-[10px] rounded-lg px-3 py-1.5 font-bold hover:opacity-90 transition-all flex items-center gap-1.5 border-none cursor-pointer btn"
                    style={{ background: 'var(--clr-primary)', color: '#fff' }}
                  >
                    ✨ Auto-SEO Generator
                  </button>
                </div>
                <input
                  className="input-field w-full"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>
                  {noteType === 'PROJECT' ? 'Project Description (Abstract & Features)' : 'Description (optional)'}
                </label>
                <textarea
                  className="input-field w-full min-h-[80px]"
                  placeholder={
                    noteType === 'PROJECT'
                      ? 'Describe what this project does. List major features, technologies used, database system, etc.'
                      : 'What does this document cover?'
                  }
                  value={noteDescription}
                  onChange={e => setNoteDescription(e.target.value)}
                />
              </div>

              {/* ✨ LIVE AUTO-SEO METADATA CODE BOX */}
              {showSeoBox && seoCodeSnippet && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <h4 className="text-[13px] font-extrabold text-indigo-400 m-0">Next.js Page Metadata Code (Google Rank #1)</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(seoCodeSnippet)
                        toast.success('📋 Next.js Metadata Code copied to clipboard!')
                      }}
                      className="text-[11px] bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-none px-3 py-1.5 rounded-lg cursor-pointer font-bold"
                    >
                      📋 Copy Metadata Code
                    </button>
                  </div>

                  <pre className="bg-[#090d16] p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto m-0 border border-white/5">
                    {seoCodeSnippet}
                  </pre>
                </div>
              )}

              {/* Project Restriction Banner */}
              {noteType === 'PROJECT' && subjectId && (
                <div>
                  {checkingRestriction ? (
                    <div className="px-4 py-3 bg-white/5 rounded-xl text-[13px] text-slate-400 flex items-center">
                      <span className="spinner w-3.5 h-3.5 mr-2" /> Checking project restrictions...
                    </div>
                  ) : projectRestriction ? (
                    <div className={`
                      p-4 rounded-xl border
                      ${projectRestriction.canUpload ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}
                    `}>
                      {projectRestriction.isRestricted ? (
                        <>
                          <p className={`font-bold mb-1.5 text-[13px] ${projectRestriction.canUpload ? 'text-emerald-400' : 'text-red-400'}`}>
                            {projectRestriction.canUpload
                              ? `✅ BCA Sem ${semesterOrder}: Slot available (0/1 project uploaded)`
                              : `❌ BCA Sem ${semesterOrder}: Project limit reached (1/1)`
                            }
                          </p>
                          {!projectRestriction.canUpload && projectRestriction.existingProjects.length > 0 && (
                            <p className="text-xs text-slate-400">
                              Existing: <strong className="text-slate-200">{projectRestriction.existingProjects[0].title}</strong>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[13px] text-emerald-400">
                          ✅ No project limit for this semester.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* 🤖 AI PROJECT FAIR PRICING & COMPLEXITY APPRAISAL CARD */}
              {(noteType === 'PROJECT' || noteType === 'PROJECT_WORK') && (
                <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/30 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[22px]">🤖</span>
                      <div>
                        <h4 className="m-0 font-extrabold text-sky-400 text-[15px]">
                          AI Project Complexity & Fair Price Evaluator
                        </h4>
                        <span className="text-xs text-slate-400">
                          Student-friendly pricing bounded strictly between <strong>Rs. 1,500 (1.5k)</strong> and <strong>Rs. 9,999 (10k)</strong>.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleEvaluateProjectPrice}
                      disabled={evaluatingPrice}
                      className="px-4 py-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-extrabold text-[13px] border-none shadow-lg shadow-sky-500/30 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
                    >
                      {evaluatingPrice ? (
                        <><span className="spinner w-3.5 h-3.5" /> Evaluating...</>
                      ) : (
                        '✨ Run Fair AI Pricing'
                      )}
                    </button>
                  </div>

                  {/* Drive Deliverables Checklist for AI Context */}
                  <div className="bg-black/20 p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={hasReportPdf} onChange={e => setHasReportPdf(e.target.checked)} className="cursor-pointer" />
                      📄 Report
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={hasDocumentation} onChange={e => setHasDocumentation(e.target.checked)} className="cursor-pointer" />
                      📘 Setup Guide
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={hasSqlScript} onChange={e => setHasSqlScript(e.target.checked)} className="cursor-pointer" />
                      🗄️ SQL DB Dump
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input type="checkbox" checked={hasDemoVideo} onChange={e => setHasDemoVideo(e.target.checked)} className="cursor-pointer" />
                      🎥 Video Link
                    </label>
                  </div>

                  {/* AI Valuation Result Card */}
                  {aiValuationResult && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/80 border border-sky-400/40 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`
                            px-2.5 py-1 rounded-md text-[11px] font-extrabold border border-white/10
                            ${aiValuationResult.complexityGrade === 'ENTERPRISE' || aiValuationResult.complexityGrade === 'ADVANCED' 
                              ? 'bg-pink-500/20 text-pink-400' 
                              : 'bg-sky-500/20 text-sky-400'}
                          `}>
                            GRADE: {aiValuationResult.complexityGrade}
                          </span>
                          <span className="text-sm font-extrabold text-emerald-400">
                            Calculated Price: Rs. {aiValuationResult.calculatedPriceNpr}
                          </span>
                          <span className="text-xs text-slate-400">
                            (Fair Range: Rs. {aiValuationResult.suggestedRange?.min} - Rs. {aiValuationResult.suggestedRange?.max})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setProjectPrice(String(aiValuationResult.calculatedPriceNpr))}
                          className="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-extrabold cursor-pointer hover:bg-emerald-500/25 transition-all"
                        >
                          ✅ Apply AI Price (Rs. {aiValuationResult.calculatedPriceNpr})
                        </button>
                      </div>

                      {/* Justification List */}
                      {aiValuationResult.justificationList && aiValuationResult.justificationList.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[11px] font-extrabold text-slate-400 block mb-1">
                            💡 Why this price? (Calculation Breakdown):
                          </span>
                          <ul className="m-0 pl-4 text-xs text-slate-300 leading-relaxed list-disc">
                            {aiValuationResult.justificationList.map((reason: string, idx: number) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Manual Editable Price Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                      💰 Selling Price (NPR) * — <span className="text-emerald-400">Editable (You can type any custom price)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-sky-400">NPR Rs.</span>
                      <input
                        className="w-full sm:w-[200px] bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-emerald-400 font-extrabold outline-none focus:border-cyan-400 focus:bg-black/40 transition-all"
                        type="number"
                        min="1500"
                        max="9999"
                        required
                        value={projectPrice}
                        onChange={e => setProjectPrice(e.target.value)}
                        placeholder="e.g. 3500"
                      />
                    </div>
                  </div>
                </div>
              )}


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isSolutionBook && <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Format</label>
                  <select className="input-field w-full cursor-pointer" value={noteType} onChange={e => setNoteType(e.target.value)}>
                    <option value="PDF_BOOK" style={{ background: 'var(--clr-bg-800)' }}>📚 PDF Book</option>
                    <option value="HANDWRITTEN" style={{ background: 'var(--clr-bg-800)' }}>✍️ Handwritten</option>
                    <option value="SLIDES_PPT" style={{ background: 'var(--clr-bg-800)' }}>🖥️ Slides/PPTX</option>
                    <option value="SHORT_NOTES" style={{ background: 'var(--clr-bg-800)' }}>📝 Short Notes</option>
                    <option value="PROJECT_WORK" style={{ background: 'var(--clr-bg-800)' }}>📁 Project Work</option>
                    <option value="PROJECT" style={{ background: 'var(--clr-bg-800)' }}>💻 Project</option>
                    <option value="GUIDE" style={{ background: 'var(--clr-bg-800)' }}>📘 Guide</option>
                    <option value="LAB_WORK" style={{ background: 'var(--clr-bg-800)' }}>🧪 Lab Work</option>
                    <option value="SYLLABUS" style={{ background: 'var(--clr-bg-800)' }}>📋 Syllabus</option>
                  </select>
                </div>}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Access Tier</label>
                  <select className="input-field w-full cursor-pointer" value={isPremium} onChange={e => setIsPremium(e.target.value)}>
                    <option value="false" style={{ background: 'var(--clr-bg-800)' }}>🔓 Free for All</option>
                    <option value="true" style={{ background: 'var(--clr-bg-800)' }}>💎 Premium Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Author / Credit (optional)</label>
                <input className="input-field w-full" placeholder="e.g. Er. Ramesh Shrestha" value={author} onChange={e => setAuthor(e.target.value)} />
              </div>

              {sourceType === 'FILE' && <FileDropZone label="Document File (PDF, DOCX, PPTX, Images)" accept=".pdf,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png" file={noteFile} onFile={setNoteFile} hint="Max 10 MB — uploads directly to Cloudinary" required />}
              {sourceType === 'FILE' && noteFile && ['jpg', 'jpeg', 'png'].includes(noteFile.name.split('.').pop()?.toLowerCase() || '') && (
                <div className="flex items-center gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/10">
                  <input type="checkbox" id="extractTextNote" checked={extractText} onChange={e => setExtractText(e.target.checked)} className="cursor-pointer w-4 h-4" />
                  <label htmlFor="extractTextNote" className="cursor-pointer text-xs text-slate-300">
                    <strong className="text-white">Convert to Text (OCR)</strong> - Extract text for SEO and readability. Uncheck if mostly diagrams.
                  </label>
                </div>
              )}
            </motion.div>
          )}

          {/* PAST_PAPER Fields */}
          {contentType === 'PAST_PAPER' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Exam Year</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all" type="number" required value={paperYear} onChange={e => setPaperYear(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Exam Category</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all cursor-pointer" value={examType} onChange={e => setExamType(e.target.value)}>
                    <option value="BOARD_EXAM" className="bg-slate-900">🎓 Board Exam</option>
                    <option value="INTERNAL_EXAM" className="bg-slate-900">🏫 Internal Exam</option>
                    <option value="BACK_PAPER" className="bg-slate-900">🔄 Back Paper</option>
                  </select>
                </div>
              </div>
              {sourceType === 'FILE' && <FileDropZone label="Question Paper (PDF / Images)" accept=".pdf,.jpg,.jpeg,.png" file={paperFile} onFile={setPaperFile} hint="Max 10 MB — uploads directly to Cloudinary" required />}
            </motion.div>
          )}

          {/* CHEATSHEET Fields */}
          {contentType === 'CHEATSHEET' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Cheatsheet Title *</label>
                <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all" placeholder="e.g. .NET Quick Revision Cheatsheet" required value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} />
              </div>
              {sourceType === 'FILE' && <MultiFileDropZone 
                label="Attach Files (PDF, Images, Word, Docs, etc.)" 
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.pptx,.ppt,.txt" 
                files={sheetFiles} 
                onFiles={setSheetFiles} 
                hint="Select multiple documents or photos to attach" 
              />}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>Markdown Content / Description</label>
                <textarea
                  className="input-field"
                  placeholder={'# Cheatsheet Title\n- Key concept\n- **Important term**'}
                  style={{ minHeight: '140px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
                  value={sheetContent}
                  onChange={e => setSheetContent(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* MCQ Fields */}
          {contentType === 'MCQ' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Exam Year</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all" type="number" required value={mcqYear} onChange={e => setMcqYear(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">Exam Category</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all cursor-pointer" value={mcqExamType} onChange={e => setMcqExamType(e.target.value)}>
                    <option value="BOARD_EXAM" className="bg-slate-900">🎓 Board Exam</option>
                    <option value="INTERNAL_EXAM" className="bg-slate-900">🏫 Internal Exam</option>
                    <option value="BACK_PAPER" className="bg-slate-900">🔄 Back Paper</option>
                  </select>
                </div>
              </div>

              {/* AI Image Upload Section */}
              {sourceType === 'FILE' && (
                <div className="bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10 border border-fuchsia-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✨</span>
                    <div>
                      <h4 className="m-0 font-extrabold text-fuchsia-400">AI Vision OCR: Extract MCQs from Photo</h4>
                      <p className="m-0 text-xs text-slate-400 mt-0.5">Upload a photo of a question paper to extract questions automatically.</p>
                    </div>
                  </div>
                  
                  <MultiFileDropZone 
                    label="Question Paper Photos (JPG, PNG, PDF)" 
                    accept=".jpg,.jpeg,.png,.webp,.pdf" 
                    files={mcqImageFiles} 
                    onFiles={setMcqImageFiles} 
                    hint="Select photos of paper pages" 
                  />

                  {mcqImageFiles.length > 0 && (
                    <button 
                      type="button" 
                      onClick={handleGenerateMcqsFromImage}
                      disabled={mcqImageGenerating || !subjectId}
                      className="mt-4 w-full p-3 rounded-xl font-extrabold border-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30 hover:opacity-90 transition-all"
                    >
                      {mcqImageGenerating ? (
                        <><span className="spinner w-4 h-4" /> Processing Images & Generating MCQs...</>
                      ) : (
                        <>✨ Auto-Generate MCQs from {mcqImageFiles.length} Photo(s)</>
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {sourceType === 'FILE' && mcqItems.map((mcq, qi) => (
                <div key={qi} className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] font-extrabold text-indigo-400">Question {qi + 1}</span>
                    {mcqItems.length > 1 && (
                      <button type="button" onClick={() => removeMcqItem(qi)} className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer hover:bg-red-500/20 transition-all">✕ Remove</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all" placeholder="e.g. Which of the following is an OOP concept?" value={mcq.question} onChange={e => updateMcqItem(qi, 'question', e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {mcq.options.map((opt: string, oi: number) => (
                        <div key={oi}>
                          <input className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-400 focus:bg-black/40 transition-all" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateMcqOption(qi, oi, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addMcqItem} className="bg-indigo-500/10 border border-dashed border-indigo-500/50 rounded-xl p-3 text-[13px] font-bold text-indigo-400 cursor-pointer w-full hover:bg-indigo-500/20 transition-all">
                + Add Another Question
              </button>
            </motion.div>
          )}
        </div>

        {/* ── SUBMIT BUTTON ── */}
        <button
          type="submit"
          disabled={uploading || savingMcqs || (noteType === 'PROJECT' && projectRestriction !== null && !projectRestriction.canUpload)}
          className={`w-full p-4 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2.5 transition-all btn`}
          style={{
            background: (uploading || savingMcqs || (noteType === 'PROJECT' && projectRestriction !== null && !projectRestriction.canUpload)) 
              ? 'rgba(255,255,255,0.1)' 
              : 'var(--clr-primary)',
            color: '#fff',
            opacity: (uploading || savingMcqs || (noteType === 'PROJECT' && projectRestriction !== null && !projectRestriction.canUpload)) ? 0.7 : 1,
            cursor: (uploading || savingMcqs || (noteType === 'PROJECT' && projectRestriction !== null && !projectRestriction.canUpload)) ? 'not-allowed' : 'pointer'
          }}
        >
          {(uploading || savingMcqs) ? (
            <>
              <span className="spinner w-[18px] h-[18px]" />
              Publishing...
            </>
          ) : isMcq ? (
            '💾 Save All MCQs'
          ) : isSolutionBook ? (
            '📚 Publish Solution Book'
          ) : sourceType === 'DRIVE' ? (
            '🔗 Save Drive Link & Publish'
          ) : (
            '📤 Upload & Publish Material'
          )}
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
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--clr-text-3)' }}>{label}</label>
      <div
        className={`
          border-2 border-dashed rounded-xl p-7 text-center relative cursor-pointer transition-all duration-300
        `}
        style={{
          background: file ? 'rgba(var(--clr-primary-rgb), 0.1)' : 'rgba(255,255,255,0.01)',
          borderColor: file ? 'var(--clr-primary)' : 'rgba(255,255,255,0.2)'
        }}
      >
        <input
          type="file" accept={accept} required={required}
          onChange={e => onFile(e.target.files?.[0] || null)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="text-3xl mb-2">{file ? '✅' : '📂'}</div>
        <p className="text-sm font-extrabold m-0" style={{ color: file ? 'var(--clr-primary)' : 'var(--clr-text-2)' }}>
          {file ? file.name : 'Click to Browse File'}
        </p>
        <p className="text-[11px] mt-1 m-0" style={{ color: 'var(--clr-text-3)' }}>{hint}</p>
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
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-400">{label}</label>
      <div
        className={`
          border-2 border-dashed rounded-xl p-7 text-center relative cursor-pointer transition-all duration-300
          ${files.length > 0 ? 'border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10' : 'border-white/20 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/30'}
        `}
      >
        <input
          type="file" accept={accept} required={required} multiple
          onChange={e => {
            if (e.target.files) {
              onFiles(Array.from(e.target.files))
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="text-3xl mb-2">{files.length > 0 ? '✅' : '📂'}</div>
        <p className={`text-sm font-extrabold m-0 ${files.length > 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
          {files.length > 0 ? `${files.length} file(s) selected` : 'Click to Browse Files'}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 m-0">{hint}</p>
        
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {files.map((f, i) => (
              <span key={i} className="text-[10px] font-bold bg-indigo-500/20 px-2.5 py-1 rounded-md text-indigo-400">
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
  const [newFacultyName, setNewFacultyName] = useState('')
  const [newFacultyIcon, setNewFacultyIcon] = useState('🎓')
  const [addingFaculty, setAddingFaculty] = useState(false)

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

  const filtered = faculties
    .filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!!a.visible === !!b.visible) return a.name.localeCompare(b.name)
      return a.visible ? -1 : 1
    })

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault()
    if (!newFacultyName) return
    setAddingFaculty(true)
    try {
      const res = await fetch('/api/admin/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFacultyName, icon: newFacultyIcon })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Faculty added successfully!')
        setNewFacultyName('')
        setNewFacultyIcon('🎓')
        fetch('/api/admin/faculties').then(r => r.json()).then(d => setFaculties(d.faculties || []))
      } else {
        toast.error(data.error || 'Failed to add faculty')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setAddingFaculty(false)
    }
  }

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

      <div style={{ background: 'var(--clr-bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-border)', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-text-2)', fontSize: '14px' }}>✨ Add New Faculty</h4>
        <form onSubmit={handleAddFaculty} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Faculty Name (e.g. B.Sc. CSIT)"
            value={newFacultyName}
            onChange={e => setNewFacultyName(e.target.value)}
            required
            style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Icon (e.g. 💻)"
            value={newFacultyIcon}
            onChange={e => setNewFacultyIcon(e.target.value)}
            required
            style={{ width: '100px', padding: '10px 14px', borderRadius: '8px', textAlign: 'center' }}
          />
          <button type="submit" className="primary-btn" disabled={addingFaculty} style={{ padding: '10px 24px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
            {addingFaculty ? 'Adding...' : '+ Add Faculty'}
          </button>
        </form>
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
  const [newSemName, setNewSemName] = useState('')
  const [newSemOrder, setNewSemOrder] = useState('')
  const [addingSem, setAddingSem] = useState(false)

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

  async function handleAddSemester(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFaculty || !newSemName || !newSemOrder) return
    setAddingSem(true)
    try {
      const res = await fetch('/api/admin/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSemName, order: newSemOrder, facultyId: selectedFaculty })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Semester added successfully!')
        setNewSemName('')
        setNewSemOrder('')
        fetch(`/api/admin/semesters?facultyId=${selectedFaculty}`)
          .then(r => r.json())
          .then(d => setSemesters(d.semesters || []))
      } else {
        toast.error(data.error || 'Failed to add semester')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setAddingSem(false)
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

        {selectedFaculty && (
          <div style={{ background: 'var(--clr-bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--clr-border)', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-text-2)', fontSize: '14px' }}>✨ Add New Semester</h4>
            <form onSubmit={handleAddSemester} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Name (e.g. 1st Semester)"
                value={newSemName}
                onChange={e => setNewSemName(e.target.value)}
                required
                style={{ flex: 1, minWidth: '180px', padding: '10px 14px', borderRadius: '8px' }}
              />
              <input
                type="number"
                className="input-field"
                placeholder="Order (e.g. 1)"
                value={newSemOrder}
                onChange={e => setNewSemOrder(e.target.value)}
                required
                style={{ width: '120px', padding: '10px 14px', borderRadius: '8px' }}
              />
              <button type="submit" className="primary-btn" disabled={addingSem} style={{ padding: '10px 24px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                {addingSem ? 'Adding...' : '+ Add Semester'}
              </button>
            </form>
          </div>
        )}

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
  const [linkedinLink, setLinkedinLink] = useState('')

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
          setLinkedinLink(d.settings.linkedinLink || '')
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
      fd.append('linkedinLink', linkedinLink)
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-full pb-16">
      <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', margin: '-16px 0 20px 0' }}>
        Manage platform-wide contact information, social links, payment QR code, and platform rules.
      </p>

      {/* ── Sleek Glass Tab Navigation Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 w-full max-w-full">
        {[
          { id: 'GENERAL',      icon: '⚙️', label: 'General Settings' },
          { id: 'TESTIMONIALS', icon: '💬', label: 'Testimonials' },
          { id: 'ABOUT',        icon: '📖', label: 'About Info' },
          { id: 'RULES',        icon: '⚖️', label: 'Platform Rules' },
        ].map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className="flex-shrink-0 whitespace-nowrap px-6 py-3 rounded-2xl text-sm sm:text-base font-extrabold flex items-center gap-3 transition-all duration-200"
              style={{
                background: isActive 
                  ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)' 
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#ffffff' : 'var(--clr-text-2)',
                border: isActive 
                  ? '1.5px solid #38bdf8' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 8px 20px rgba(14, 165, 233, 0.35)' : 'none'
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── GENERAL SETTINGS (Full Page Width Grid) ── */}
      {activeTab === 'GENERAL' && (
        <div className="w-full max-w-full">
          {loading ? (
            <div className="glass-card flex justify-center p-12 rounded-2xl">
              <div className="spinner" style={{ width: '36px', height: '36px' }} />
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-5 w-full max-w-full">
              
              {/* Unified Responsive Container */}
              <div className="admin-card w-full flex flex-col gap-6 sm:gap-8">
                
                {/* ── Contact Channels & QR Code ── */}
                <div className="w-full">
                  <div className="border-b border-white/10 pb-3 mb-5">
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--clr-text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📞</span> Direct Contact Channels
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--clr-text-3)' }}>Manage public contact information</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* WhatsApp Link */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        💬 WhatsApp Contact Link
                      </label>
                      <input
                        type="url"
                        required
                        className="admin-input w-full"
                        placeholder="https://wa.me/9779800000000"
                        value={whatsappLink}
                        onChange={e => setWhatsappLink(e.target.value)}
                      />
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        📞 Contact Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input w-full"
                        placeholder="9767776999"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                      />
                    </div>

                    {/* Contact Email */}
                    <div className="md:col-span-2">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        ✉️ Contact Email Address
                      </label>
                      <input
                        type="email"
                        required
                        className="admin-input w-full"
                        placeholder="tunoteshub@gmail.com"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment QR Code */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                      📷 Payment QR Code Image
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginBottom: '16px' }}>
                      Upload eSewa, Khalti, or Mobile Banking QR image for user checkouts.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative', border: '2px dashed rgba(99,102,241,0.4)', borderRadius: '16px', padding: '24px', textAlign: 'center', background: 'rgba(99,102,241,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📸</span>
                          <span style={{ fontSize: '14px', color: 'var(--clr-text-1)', fontWeight: 700 }}>
                            {paymentQrFile ? paymentQrFile.name : 'Click or Drag to Upload QR'}
                          </span>
                        </div>
                      </div>
                      {(paymentQrUrl || paymentQrFile) && (
                        <div style={{ width: '120px', height: '120px', position: 'relative', background: '#fff', borderRadius: '16px', padding: '8px', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                          <img src={paymentQrUrl!} alt="QR Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Social Media Handles ── */}
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
                  <div className="border-b border-white/10 pb-3 mb-5">
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--clr-text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🌐</span> Social Media Handles
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--clr-text-3)' }}>Footer & profile links displayed to students</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Facebook */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        📘 Facebook Profile
                      </label>
                      <input
                        type="url"
                        className="admin-input w-full"
                        placeholder="https://facebook.com/yourpage"
                        value={facebookLink}
                        onChange={e => setFacebookLink(e.target.value)}
                      />
                    </div>

                    {/* TikTok */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        🎵 TikTok Profile
                      </label>
                      <input
                        type="url"
                        className="admin-input w-full"
                        placeholder="https://tiktok.com/@yourusername"
                        value={tiktokLink}
                        onChange={e => setTiktokLink(e.target.value)}
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        📸 Instagram Profile
                      </label>
                      <input
                        type="url"
                        className="admin-input w-full"
                        placeholder="https://instagram.com/yourusername"
                        value={instagramLink}
                        onChange={e => setInstagramLink(e.target.value)}
                      />
                    </div>

                    {/* GitHub */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        🐱 GitHub Profile
                      </label>
                      <input
                        type="url"
                        className="admin-input w-full"
                        placeholder="https://github.com/yourusername"
                        value={githubLink}
                        onChange={e => setGithubLink(e.target.value)}
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
                        💼 LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        className="admin-input w-full"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={linkedinLink}
                        onChange={e => setLinkedinLink(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Information Tip Box */}
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#67e8f9', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                      ⚡ Quick Sync Information
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--clr-text-3)', lineHeight: 1.5 }}>
                      Saving these settings will automatically update footer contact icons, whatsapp floating widgets, and payment modal details site-wide.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button Bar */}
              <div className="p-4 sm:px-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:justify-end items-center bg-slate-900/65 border border-white/10 w-full max-w-full">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full sm:w-auto"
                  style={{
                    padding: '14px 36px',
                    borderRadius: '12px',
                    background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {saving ? (
                    <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Saving Settings…</>
                  ) : (
                    '💾 Save Settings'
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      )}

      {activeTab === 'TESTIMONIALS' && (
        <div className="glass-card p-4 sm:p-6 rounded-2xl w-full max-w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
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
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', flexWrap: 'wrap' }}>
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
        <div className="admin-card w-full max-w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 m-0 text-white">
                <span>📖</span> About Section Cards
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Customize the mission and feature cards displayed on the About page.
              </p>
            </div>
            <button
              onClick={() => setAboutItems(prev => [...prev, { id: String(Date.now()), emoji: '🎯', title: 'New Feature', description: 'Feature description' }])}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              <span>➕</span> Add New Card
            </button>
          </div>

          {aboutLoading ? (
            <div className="flex justify-center p-10"><div className="spinner" /></div>
          ) : (
            <form onSubmit={handleSaveAbout}>
              <div className="flex flex-col gap-5 mb-8">
                {aboutItems.map((item, index) => (
                  <div key={item.id} className="group relative flex flex-col gap-4 bg-slate-900/40 border border-white/5 rounded-2xl p-4 sm:p-5 w-full hover:bg-slate-900/60 transition-all duration-300 shadow-sm">
                    
                    {/* Header Row: Emoji + Title + Delete */}
                    <div className="flex items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      
                      <div className="flex flex-1 items-center gap-3 w-full">
                        {/* Emoji */}
                        <div className="w-12 h-12 flex-shrink-0 relative">
                          <input
                            type="text"
                            className="w-full h-full text-center text-xl bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400 focus:bg-white/10 transition-all shadow-inner"
                            value={item.emoji}
                            onChange={e => {
                              const updated = [...aboutItems]
                              updated[index].emoji = e.target.value
                              setAboutItems(updated)
                            }}
                            required
                            title="Emoji"
                          />
                        </div>
                        
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none text-base sm:text-lg font-bold text-white outline-none placeholder:text-white/20 px-1"
                            value={item.title}
                            onChange={e => {
                              const updated = [...aboutItems]
                              updated[index].title = e.target.value
                              setAboutItems(updated)
                            }}
                            required
                            placeholder="Card Title (e.g. Our Mission)"
                          />
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setAboutItems(prev => prev.filter(a => a.id !== item.id))}
                        className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all text-xs font-bold flex items-center gap-1.5"
                        title="Delete Card"
                      >
                        <span className="hidden sm:inline">Delete</span>
                        <span>🗑️</span>
                      </button>
                    </div>

                    {/* Description */}
                    <div className="w-full">
                      <textarea
                        className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400 focus:bg-white/[0.07] transition-all shadow-inner resize-y min-h-[90px]"
                        value={item.description}
                        onChange={e => {
                          const updated = [...aboutItems]
                          updated[index].description = e.target.value
                          setAboutItems(updated)
                        }}
                        required
                        placeholder="Brief description of the card..."
                      />
                    </div>
                  </div>
                ))}
                
                {aboutItems.length === 0 && (
                  <div className="text-center p-10 bg-white/[0.02] border border-white/[0.05] rounded-2xl border-dashed">
                    <span className="text-4xl mb-3 block opacity-50">📭</span>
                    <h4 className="text-white font-bold mb-1">No Cards Found</h4>
                    <p className="text-slate-400 text-sm">You haven't added any about cards yet. Click the button above to create one.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6 flex justify-end">
                <button 
                  type="submit" 
                  disabled={aboutSaving} 
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-extrabold text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    background: aboutSaving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                    boxShadow: aboutSaving ? 'none' : '0 8px 20px rgba(14, 165, 233, 0.35)',
                    cursor: aboutSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {aboutSaving ? (
                    <><div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff', opacity: 0.8 }} /> Saving Cards…</>
                  ) : (
                    '💾 Save About Cards'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'RULES' && (
        <div className="glass-card p-4 sm:p-6 rounded-2xl w-full max-w-full">
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>⚖️ Platform Rules & Regulations</h3>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>Customize guidelines for Buyers and Sellers shown on the About page.</p>
          </div>

          {rulesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : (
            <form onSubmit={handleSaveRules}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 w-full">
                
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
                <button type="submit" disabled={rulesSaving} className="btn btn-primary w-full sm:w-auto">
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

