'use client'
// src/app/dashboard/page.tsx — Premium student dashboard with Tailwind CSS
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { toast } from 'react-toastify'
import { motion } from 'motion/react'
import { DashboardSkeleton } from '@/components/SkeletonLoader'
import BecomeSellerTab from '@/components/dashboard/BecomeSellerTab'
import SellerCenterTab from '@/components/dashboard/SellerCenterTab'

type Tab = 'overview' | 'compare' | 'payment' | 'become-seller' | 'seller-center'

interface User {
  id: string; name: string; email: string
  packageType: string; role: string
  facultyId: string | null; semesterOrder: number | null
  sellerProfile: { id: string; status: string; isVerified: boolean } | null
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Set initial tab from query parameter if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlTab = params.get('tab') as Tab
      if (urlTab === 'payment' || urlTab === 'compare' || urlTab === 'overview') {
        setTab(urlTab)
      }
    }

    const controller = new AbortController()
    let isTimeout = false
    const timeout = setTimeout(() => {
      isTimeout = true
      controller.abort()
    }, 60000) // 60s timeout for cold start

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
          if (isTimeout) {
            setError('Request timed out. Please check your connection.')
            setLoading(false)
          }
          // If not a timeout, it was aborted by React StrictMode cleanup, so do nothing.
        } else {
          setError(err.message || 'Failed to load dashboard')
          toast.error(err.message || 'Failed to load dashboard')
          setLoading(false)
        }
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
    const isTimeout = error?.includes('timed out') || error?.includes('Failed to fetch')
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100vh', gap: '20px', textAlign: 'center', backgroundColor: '#080a12' }}>
        <div style={{ fontSize: '64px', marginBottom: '10px' }}>⚠️</div>
        <h2 className="text-3xl font-bold text-white">Something went wrong</h2>
        <p style={{ color: 'var(--clr-text-2)', maxWidth: '400px', marginBottom: '20px' }}>
          {error || 'Session expired. Please log in again.'}
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-outline" style={{ padding: '12px 24px' }} onClick={() => window.location.reload()}>↻ Try Again</button>
          {!isTimeout && <button className="btn btn-primary" style={{ padding: '12px 24px' }} onClick={() => router.push('/login')}>Go to Login</button>}
        </div>
      </div>
    )
  }

  const isPremium = user.packageType !== 'FREE' || user.role === 'ADMIN'
  const isElite = user.packageType === 'ELITE_AI' || user.role === 'ADMIN'
  const totalNotes = subjects.reduce((a, s) => a + s.notes.length, 0)
  const totalPapers = subjects.reduce((a, s) => a + s.pastPapers.length, 0)
  const totalSheets = subjects.reduce((a, s) => a + s.cheatsheets.length, 0)

  const pkgConfig: Record<string, { label: string; cls: string; gradient: string }> = {
    FREE: { label: '🆓 Free Tier', cls: 'badge-free', gradient: 'rgba(100,116,139,0.2)' },
    SEMESTER_PASS: { label: '⚡ Semester Pass', cls: 'badge-semester', gradient: 'rgba(6,182,212,0.15)' },
    ELITE_AI: { label: '🤖 Elite AI Pass', cls: 'badge-elite', gradient: 'rgba(99,102,241,0.2)' },
  }
  const pkg = user.role === 'ADMIN' ? { label: '👑 Admin (Full Access)', cls: 'badge-elite', gradient: 'rgba(99,102,241,0.2)' } : (pkgConfig[user.packageType] ?? pkgConfig.FREE)

  const navItems = [
    { id: 'overview', icon: '📚', label: 'My Subjects' },
    { id: 'compare', icon: '🤖', label: 'AI Exam Predictor' },
    // Show Upgrade Plan for everyone except Elite
    ...(user.packageType !== 'ELITE_AI' && user.role !== 'ADMIN' ? [{ id: 'payment', icon: '💎', label: 'Upgrade Plan' }] : []),
  ]
  
  // Add Seller Tab
  if (!user.sellerProfile || user.sellerProfile.status === 'REJECTED') {
    navItems.push({ id: 'become-seller', icon: '🛍️', label: 'Become a Seller' })
  } else {
    navItems.push({ id: 'seller-center', icon: '🏬', label: 'Seller Center' })
  }

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
            <div className="nav-logo-icon">🎓</div>
            <div>
              <span className="font-bold text-sm uppercase tracking-wider block" style={{ color: 'var(--clr-text-3)', fontSize: '10px' }}>STUDENT PORTAL</span>
              <span className="font-extrabold text-lg block" style={{ color: 'var(--clr-text-1)', marginTop: '-2px' }}>TU Notes Hub</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="admin-nav-menu">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item${tab === item.id ? ' active' : ''}`}
                onClick={() => { 
                  if (item.id === 'payment') {
                    window.location.href = '/pricing'
                  } else {
                    setTab(item.id as Tab); 
                    setSidebarOpen(false); 
                  }
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            <div style={{ height: '1px', background: 'var(--clr-border)', margin: '16px 20px' }} />
            
            <button onClick={() => router.push('/faculties')} className="sidebar-item">
              <span className="text-lg">🏫</span> Browse Faculties
            </button>
            
            {!faculty && (
              <button onClick={() => router.push('/settings')} className="sidebar-item" style={{ color: 'var(--clr-warning)' }}>
                <span className="text-lg">⚙️</span> Setup Profile
              </button>
            )}
            
            {user.role === 'ADMIN' && (
              <button onClick={() => router.push('/admin')} className="sidebar-item" style={{ color: 'var(--clr-primary-h)' }}>
                <span className="text-lg">⚙️</span> Admin Panel
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Main Content Area ── */}
      <div className="admin-content-wrapper">
        
        {/* ── Top App Bar ── */}
        <header className="admin-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>
                {tab === 'overview' ? '📚 My Dashboard' : tab === 'compare' ? '🤖 AI Exam Predictor' : tab === 'payment' ? '💎 Upgrade Plan' : tab === 'become-seller' ? '🛍️ Become a Seller' : '🏬 Seller Center'}
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user.role === 'ADMIN' && (
              <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => router.push('/admin')}>
                ⚙️ Admin
              </button>
            )}
          </div>
        </header>

        {/* ── Content Scroll Area ── */}
        <div className="admin-scrollable-content">
          <main className="admin-content-inner">
          {/* ── Overview Tab ── */}
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

              {/* ── Hero Welcome Banner ── */}
              <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'relative', overflow: 'hidden', borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.12) 50%, rgba(192,132,252,0.1) 100%)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  padding: '28px 32px', marginBottom: '28px',
                  boxShadow: '0 8px 40px rgba(99,102,241,0.15)',
                }}
              >
                {/* Glowing orbs */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '32px' }}>{faculty?.icon ?? '🎓'}</span>
                      <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
                          Welcome back, <span className="text-gradient">{user.name.split(' ')[0]}</span> 👋
                        </h2>
                        <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: 0 }}>
                          {faculty ? `${faculty.name} · ` : ''}<span style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>{semesterName || 'No semester set'}</span>
                        </p>
                      </div>
                    </div>
                    {!faculty && (
                      <Link href="/settings" className="btn btn-outline" style={{ marginTop: '8px', fontSize: '12px', padding: '6px 16px', display: 'inline-flex', gap: '6px' }}>
                        ⚙️ Setup Profile
                      </Link>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ background: pkg.gradient, border: `1px solid ${isPremium ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: isPremium ? '#a5b4fc' : 'var(--clr-text-3)' }}>
                      {pkg.label}
                    </span>
                    {user.packageType !== 'ELITE_AI' && user.role !== 'ADMIN' && (
                      <button className="btn btn-primary" style={{ fontSize: '12px', padding: '7px 16px' }} onClick={() => window.location.href = '/pricing'}>
                        💎 Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Stats Grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                  { label: 'Notes Available', value: totalNotes, icon: '📄', color: '#6366f1', glow: 'rgba(99,102,241,0.25)' },
                  { label: 'Past Papers', value: totalPapers, icon: '📝', color: '#06b6d4', glow: 'rgba(6,182,212,0.25)' },
                  { label: 'AI Cheatsheets', value: totalSheets, icon: '📋', color: '#c084fc', glow: 'rgba(192,132,252,0.25)' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    whileHover={{ y: -3, boxShadow: `0 12px 32px ${s.glow}` }}
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
                      border: `1px solid ${s.color}30`,
                      borderRadius: '16px', padding: '20px 22px',
                      boxShadow: `0 4px 20px ${s.glow}`,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)' }}>{s.label}</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{s.icon}</div>
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* ── Course Materials ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)' }}>📚 Course Materials</h3>
                  {subjects.length > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--clr-accent-h)', background: 'rgba(6,182,212,0.1)', padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(6,182,212,0.2)', fontWeight: 600 }}>
                      {subjects.length} subjects
                    </span>
                  )}
                </div>

                {subjects.length === 0 ? (
                  <div style={{ padding: '64px', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px' }}>📭</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No materials yet</h3>
                    <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '8px' }}>
                      {faculty ? `No study materials uploaded for ${semesterName} yet.` : 'Select your faculty and semester in Settings to see your materials.'}
                    </p>
                    {!faculty && <Link href="/settings" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>⚙️ Setup Profile</Link>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {subjects.map((sub, idx) => {
                      const total = sub.notes.length + sub.pastPapers.length + sub.cheatsheets.length
                      const accentColors = ['#6366f1', '#06b6d4', '#c084fc', '#f59e0b', '#10b981', '#ef4444']
                      const accentColor = accentColors[idx % accentColors.length]

                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          style={{
                            borderRadius: '18px', overflow: 'hidden',
                            border: `1px solid ${accentColor}20`,
                            boxShadow: `0 4px 20px ${accentColor}10`,
                            background: 'rgba(255,255,255,0.025)',
                          }}
                        >
                          {/* Subject Header Strip */}
                          <div style={{
                            padding: '14px 22px',
                            background: `linear-gradient(90deg, ${accentColor}18, transparent)`,
                            borderBottom: `1px solid ${accentColor}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}40`, letterSpacing: '0.05em' }}>
                                {sub.code}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--clr-text-1)' }}>{sub.title}</span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>
                              {total === 0 ? 'No resources yet' : `${total} resource${total !== 1 ? 's' : ''}`}
                            </span>
                          </div>

                          {total === 0 ? (
                            <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${accentColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📂</div>
                              <div>
                                <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', margin: 0 }}>No files uploaded yet</p>
                                <p style={{ color: 'var(--clr-text-3)', fontSize: '11px', margin: '2px 0 0', opacity: 0.6 }}>Admin will add materials soon</p>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

                              {/* Study Notes */}
                              {sub.notes.length > 0 && (
                                <div>
                                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)', marginBottom: '12px' }}>
                                    📄 Study Notes
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                                    {sub.notes.map((note) => (
                                      <Link key={note.id} href={`/download/${note.id}`} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                          whileHover={{ scale: 1.025, y: -2, boxShadow: '0 8px 24px rgba(99,102,241,0.15)' }}
                                          style={{
                                            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                                            borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                          }}
                                        >
                                          <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-text-1)', lineHeight: 1.45, marginBottom: '10px' }}>
                                            {note.title}
                                          </p>
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', textTransform: 'uppercase' }}>
                                              {note.noteType.replace(/_/g, ' ')}
                                            </span>
                                            {note.isPremium
                                              ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>💎 Premium</span>
                                              : <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>View →</span>
                                            }
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
                                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)', marginBottom: '12px' }}>
                                    📝 Question Papers
                                  </p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {sub.pastPapers.map((paper) => (
                                      <Link key={paper.id} href={`/download/${paper.id}`} style={{ textDecoration: 'none' }}>
                                        <motion.div
                                          whileHover={{ scale: 1.05, y: -2 }}
                                          style={{
                                            background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
                                            borderRadius: '10px', padding: '10px 16px', cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', gap: '4px',
                                            transition: 'all 0.2s ease',
                                          }}
                                        >
                                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-1)' }}>
                                            📅 {paper.year}
                                          </span>
                                          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--clr-accent-h)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {paper.examType.replace(/_/g, ' ')}
                                          </span>
                                          <span style={{ fontSize: '10px', color: 'var(--clr-accent-h)', marginTop: '2px' }}>Download →</span>
                                        </motion.div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cheatsheets */}
                              {sub.cheatsheets.length > 0 && (
                                <div>
                                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)', marginBottom: '12px' }}>
                                    📋 AI Cheatsheets
                                  </p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                    {sub.cheatsheets.map((sheet) => (
                                      <motion.div
                                        key={sheet.id}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        style={{
                                          background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.2)',
                                          borderRadius: '12px', padding: '14px 16px',
                                          cursor: isElite ? 'pointer' : 'default',
                                          position: 'relative', overflow: 'hidden',
                                        }}
                                      >
                                        {!isElite && (
                                          <div
                                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,10,18,0.7)', backdropFilter: 'blur(3px)', zIndex: 2, borderRadius: '12px' }}
                                          >
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#c084fc' }}>🔒 Elite Only</span>
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



          {/* ── Become a Seller Tab ── */}
          {tab === 'become-seller' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <BecomeSellerTab user={user} />
            </motion.div>
          )}

          {/* ── Seller Center Tab ── */}
          {tab === 'seller-center' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SellerCenterTab user={user} />
            </motion.div>
          )}
          </main>
        </div>
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

  async function downloadPDF() {
    const element = document.getElementById('ai-report-container')
    if (!element) return

    if (!(window as any).html2pdf) {
      toast.error('PDF library is loading, please try again in a moment.')
      return
    }
    toast.info('Generating PDF...')
    const opt = {
      margin:       10,
      filename:     `${report.subject.replace(/[^a-zA-Z0-9]/g, '_')}_AI_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#080a12' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    ;(window as any).html2pdf().from(element).set(opt).save().then(() => {
       toast.success('PDF Saved Successfully! 🎉')
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" id="ai-report-container" style={{ padding: '40px' }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <h3 className="text-2xl font-bold">📊 {report.subject} — AI Report</h3>
            {isElite && <button className="btn btn-outline" onClick={downloadPDF} data-html2canvas-ignore="true">💾 Save as PDF</button>}
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
