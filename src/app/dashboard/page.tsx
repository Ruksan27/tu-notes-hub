'use client'
// src/app/dashboard/page.tsx — Premium student dashboard with Tailwind CSS
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { toast } from 'react-toastify'
import { motion, useDragControls } from 'framer-motion'
import { Sparkles, Brain, FileText, BookOpen, Clock, Plus, X, Send, Bot, Check, ChevronDown, Zap, HelpCircle, RefreshCw } from 'lucide-react'
import { DashboardSkeleton } from '@/components/SkeletonLoader'
import BecomeSellerTab from '@/components/dashboard/BecomeSellerTab'
import SellerCenterTab from '@/components/dashboard/SellerCenterTab'
import ProfileTab from '@/components/dashboard/ProfileTab'
import { getNoteSlug, getPaperSlug } from '@/lib/slugs'

type Tab = 'overview' | 'compare' | 'payment' | 'become-seller' | 'seller-center' | 'profile'

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
      if (urlTab === 'payment' || urlTab === 'compare' || urlTab === 'overview' || urlTab === 'profile') {
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
                {tab === 'overview' ? '📚 My Dashboard' : tab === 'compare' ? '🤖 AI Exam Predictor' : tab === 'payment' ? '💎 Upgrade Plan' : tab === 'become-seller' ? '🛍️ Become a Seller' : tab === 'seller-center' ? '🏬 Seller Center' : '👤 Profile Settings'}
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
          <main className="admin-content-inner" style={{ paddingBottom: '800px' }}>
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

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl md:text-3xl">{faculty?.icon ?? '🎓'}</span>
                      <div>
                        <h2 className="text-xl md:text-2xl font-extrabold m-0 leading-tight">
                          Welcome back, <span className="text-gradient">{user.name.split(' ')[0]}</span> 👋
                        </h2>
                        <p className="text-xs md:text-sm text-gray-400 m-0 mt-1">
                          {faculty ? `${faculty.name} · ` : ''}<span style={{ color: 'var(--clr-primary-h)', fontWeight: 600 }}>{semesterName || 'No semester set'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between md:justify-start gap-3 mt-2 md:mt-0">
                    <span className="whitespace-nowrap flex-shrink-0" style={{ background: pkg.gradient, border: `1px solid ${isPremium ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`, padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, color: isPremium ? '#a5b4fc' : 'var(--clr-text-3)' }}>
                      {pkg.label}
                    </span>
                    {user.packageType !== 'ELITE_AI' && user.role !== 'ADMIN' && (
                      <button className="btn btn-primary flex-1 md:flex-none w-full md:w-auto justify-center" style={{ fontSize: '13px', padding: '8px 20px' }} onClick={() => window.location.href = '/pricing'}>
                        💎 Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
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
                      borderRadius: '16px', padding: '16px 20px',
                      boxShadow: `0 4px 20px ${s.glow}`,
                      transition: 'all 0.25s ease',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)' }}>{s.label}</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{s.icon}</div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
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
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{
                            padding: '16px 20px',
                            background: `linear-gradient(90deg, ${accentColor}18, transparent)`,
                            borderBottom: `1px solid ${accentColor}20`,
                          }}>
                            <div className="flex items-start sm:items-center gap-3">
                              <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}40`, letterSpacing: '0.05em' }}>
                                {sub.code}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--clr-text-1)', lineHeight: 1.3 }}>{sub.title}</span>
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
                                      <Link key={note.id} href={`/note/${getNoteSlug({ ...note, subject: { title: sub.title, code: sub.code } })}`} style={{ textDecoration: 'none' }}>
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
                                      <Link key={paper.id} href={`/paper/${getPaperSlug({ ...paper, subject: { title: sub.title, code: sub.code } })}`} style={{ textDecoration: 'none' }}>
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

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ProfileTab />
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
  const [mcqs, setMcqs] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingMcqs, setGeneratingMcqs] = useState(false)
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
      if (res.ok) {
        setReport({ ...data.report, fromCache: data.fromCache })
        if (data.fromCache) toast.info('⚡ Loaded from cache instantly!')
        else toast.success('AI Report Generated! 🎉')
      } else toast.error(data.error || 'Failed to generate report')
    } catch { toast.error('AI request failed') }
    finally { setLoading(false) }
  }

  async function handleGenerateMcqs() {
    if (selectedPaperIds.length < 2) { toast.error('Select at least 2 papers'); return }
    setGeneratingMcqs(true); setMcqs(null)
    try {
      const res = await fetch('/api/ai/mcq-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubjectId, paperIds: selectedPaperIds }),
      })
      const data = await res.json()
      if (res.ok) {
        setMcqs(data.mcqs)
        toast.success('Generated 10 MCQs successfully! 🎉')
      } else {
        toast.error(data.error || 'Failed to generate MCQs')
      }
    } catch { toast.error('MCQ request failed') }
    finally { setGeneratingMcqs(false) }
  }

  async function downloadPDF() {
    const reportEl = document.getElementById('ai-report-container')
    if (!reportEl) { toast.error('Report not found'); return }

    const clone = reportEl.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.hide-on-print').forEach(el => (el as HTMLElement).style.display = 'none')
    clone.querySelectorAll('.print-watermark').forEach(el => (el as HTMLElement).style.display = 'block')
    clone.querySelectorAll('.print-qr-footer').forEach(el => (el as HTMLElement).style.display = 'block')

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) { toast.error('Popup blocked. Allow popups and try again.'); return }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TU Notes Hub — AI Exam Report</title>
        <meta charset="utf-8"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #080a12 !important; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
          
          /* Watermark on every page */
          .print-watermark {
            display: block !important;
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-40deg);
            font-size: 72px; font-weight: 900;
            color: rgba(99,102,241,0.06);
            white-space: nowrap; pointer-events: none; z-index: 9999;
            letter-spacing: 0.05em;
          }

          /* Layout */
          h3 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 20px; }
          .topic-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 10px; margin-bottom: 12px; page-break-inside: avoid; }
          .topic-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
          .topic-name { font-weight: 700; font-size: 14px; color: #fff; flex: 1; }
          .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
          .badge-strong, .badge-high { background: rgba(16,185,129,0.2); color: #10b981; }
          .badge-medium { background: rgba(245,158,11,0.2); color: #f59e0b; }
          .badge-low { background: rgba(239,68,68,0.2); color: #ef4444; }
          .prob-bar-track { background: rgba(255,255,255,0.06); height: 6px; border-radius: 999px; overflow: hidden; margin-bottom: 10px; }
          .prob-bar-fill { height: 100%; border-radius: 999px; }
          .prob-bar-fill.strong, .prob-bar-fill.high { background: linear-gradient(90deg, #10b981, #34d399); }
          .prob-bar-fill.medium { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
          .prob-bar-fill.low { background: linear-gradient(90deg, #ef4444, #f87171); }
          .reasoning { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.6; }
          .study-points { margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; }
          .study-points p { font-size: 11px; font-weight: 700; color: #818cf8; margin-bottom: 6px; }
          .study-points ul { padding-left: 16px; }
          .study-points li { font-size: 12px; color: #e2e8f0; margin-bottom: 3px; }
          .predictions-section { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; margin-top: 16px; }
          .predictions-section h4 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; }
          .pred-card { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 14px; margin-bottom: 10px; page-break-inside: avoid; }
          .pred-q { font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 8px; }
          .pred-meta { display: flex; gap: 10px; font-size: 11px; }
          .pred-tag { background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px; color: rgba(255,255,255,0.5); }
          .pred-tag strong { color: #fff; }

          /* QR Footer */
          .print-qr-footer { display: flex !important; margin-top: 24px; border-top: 2px solid rgba(99,102,241,0.4); padding-top: 16px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
          .qr-brand p { color: #fff; font-weight: 800; font-size: 16px; margin-bottom: 4px; }
          .qr-brand .sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
          .qr-brand .hint { font-size: 11px; color: rgba(255,255,255,0.3); }
          .qr-img { text-align: center; }
          .qr-img img { width: 90px; height: 90px; border-radius: 8px; border: 2px solid rgba(99,102,241,0.4); }
          .qr-img p { font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 4px; }
          
          @page { size: A4; margin: 12mm; }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()

    // Explicitly wait for images to load, then print
    const images = printWindow.document.getElementsByTagName('img')
    let loadedCount = 0
    const totalImages = images.length
    
    if (totalImages === 0) {
      setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
    } else {
      const onLoadOrError = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
        }
      }
      for (let i = 0; i < totalImages; i++) {
        const img = images[i]
        if (img.complete) {
          onLoadOrError()
        } else {
          img.onload = onLoadOrError
          img.onerror = onLoadOrError
        }
      }
    }

    // Ultimate fallback if things hang
    setTimeout(() => {
      try { printWindow.print(); printWindow.close() } catch {}
    }, 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Form card — hidden once report is generated */}
      {!report && (
        <div className="glass-card p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-[var(--clr-border)]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-extrabold text-xl text-[var(--clr-text-1)]">Predict Exam Pattern</h3>
                <span className="badge badge-elite text-[10px]">
                  <Sparkles className="w-3 h-3" /> AI Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--clr-text-2)]">
                Select a subject and 2+ past papers to generate automated exam topic predictions.
              </p>
            </div>
          </div>

          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-[var(--clr-text-3)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> SELECT SUBJECT
            </label>
            <select
              className="input-field cursor-pointer font-semibold"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="">— Choose a subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>[{s.code}] {s.title}</option>
              ))}
            </select>
          </div>

          {/* Paper Selector */}
          {currentSubject && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-[var(--clr-text-3)] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> SELECT PAST PAPERS
                </label>
                <span className="badge badge-semester text-[10px]">
                  {selectedPaperIds.length} Selected
                </span>
              </div>

              {currentSubject.pastPapers.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  ⚠️ No past papers uploaded for this subject yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {currentSubject.pastPapers.map((paper) => {
                    const checked = selectedPaperIds.includes(paper.id)
                    return (
                      <button key={paper.id} type="button"
                        onClick={() => setSelectedPaperIds(p => p.includes(paper.id) ? p.filter(id => id !== paper.id) : [...p, paper.id])}
                        className={`btn btn-sm ${checked ? 'btn-primary' : 'btn-outline'}`}
                      >
                        <span>{checked ? '✓' : '＋'}</span>
                        <span>{paper.year} Paper ({paper.examType.replace(/_/g, ' ')})</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedPaperIds.length > 0 && (
                <p className="text-xs font-semibold mt-2 flex items-center gap-1.5">
                  {selectedPaperIds.length >= 2
                    ? <span className="text-emerald-400 flex items-center gap-1">✓ Ready for AI analysis ({selectedPaperIds.length} selected)</span>
                    : <span className="text-amber-400 flex items-center gap-1">⚠️ Select at least 1 more paper to run analysis</span>
                  }
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={runAIAnalysis}
              disabled={loading || generatingMcqs || selectedPaperIds.length < 2}
              className="btn btn-lg btn-primary justify-center text-sm font-bold"
            >
              {loading ? (
                <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Analyzing with AI…</>
              ) : (
                <><Brain className="w-4 h-4" /> Run AI Analysis {selectedPaperIds.length > 0 ? `(${selectedPaperIds.length})` : ''}</>
              )}
            </button>

            <button
              onClick={handleGenerateMcqs}
              disabled={loading || generatingMcqs || selectedPaperIds.length < 2}
              className="btn btn-lg btn-outline justify-center text-sm font-bold"
            >
              {generatingMcqs ? (
                <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Generating MCQs…</>
              ) : (
                <><FileText className="w-4 h-4" /> Generate MCQs {selectedPaperIds.length > 0 ? `(${selectedPaperIds.length})` : ''}</>
              )}
            </button>
          </div>

          {/* Feature hints */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3.5 pt-5 mt-2 border-t border-white/10">
            {[
              { icon: Brain, text: 'Topic Probability', color: 'from-blue-500/15 to-indigo-500/15 text-blue-400 border-blue-500/30' },
              { icon: Sparkles, text: 'Exam Questions', color: 'from-purple-500/15 to-pink-500/15 text-purple-300 border-purple-500/30' },
              { icon: Zap, text: 'Quick Study Points', color: 'from-amber-500/15 to-orange-500/15 text-amber-300 border-amber-500/30' },
              { icon: FileText, text: 'PDF Export', color: 'from-cyan-500/15 to-teal-500/15 text-cyan-300 border-cyan-500/30' },
            ].map(f => (
              <div 
                key={f.text} 
                className={`flex-1 min-w-[130px] sm:min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${f.color} border text-xs sm:text-sm font-bold shadow-sm hover:scale-[1.02] transition-all duration-200`}
              >
                <f.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{f.text}</span>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* MCQs View */}
      {mcqs && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" id="ai-mcq-container" style={{ padding: '32px', marginBottom: '24px' }}>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h3 className="text-xl font-bold">📝 Generated MCQs for {currentSubject?.title}</h3>
            <div style={{ display: 'flex', gap: '8px' }} className="hide-on-print">
              <button className="btn btn-outline" onClick={downloadPDF} style={{ fontSize: '12px', padding: '6px 14px' }}>💾 Save PDF</button>
              <button className="btn btn-outline" onClick={() => setMcqs(null)} style={{ fontSize: '12px', padding: '6px 14px' }}>← Close MCQs</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mcqs.map((m: any, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>{i + 1}. {m.question}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {m.options.map((opt: string, idx: number) => (
                    <div key={idx} style={{ 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      background: m.correctOption === idx ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: m.correctOption === idx ? '1px solid var(--clr-success)' : '1px solid transparent',
                      color: m.correctOption === idx ? 'var(--clr-success)' : 'var(--clr-text-2)',
                      fontSize: '13px'
                    }}>
                      {String.fromCharCode(65 + idx)}. {opt} {m.correctOption === idx && '✓'}
                    </div>
                  ))}
                </div>
                {m.explanation && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px' }}>
                    <strong style={{ color: 'var(--clr-primary-h)' }}>Explanation:</strong> {m.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Print Watermark & Footer */}
          <div className="print-watermark" aria-hidden="true">TU Notes Hub</div>
          <div className="print-qr-footer">
            <div style={{ borderTop: '2px solid rgba(99,102,241,0.4)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', width: '100%' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px', color: '#fff' }}>📚 TU Notes Hub</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>AI-Generated MCQ Solution Set</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Scan QR to visit our website</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&bgcolor=080a12&color=ffffff&data=${encodeURIComponent('https://tunoteshub.vercel.app')}`}
                  alt="QR Code"
                  style={{ width: '90px', height: '90px', borderRadius: '8px', border: '2px solid rgba(99,102,241,0.4)' }}
                />
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>tunoteshub.vercel.app</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: report && isElite ? 'minmax(0,1fr) auto' : '1fr',
        gap: '20px',
        alignItems: 'start',
      }}>

        {/* Left: Report */}
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" id="ai-report-container" style={{ padding: '32px' }}>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 className="text-xl font-bold">📊 {report.subject} — AI Report</h3>
                {report.fromCache && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)' }}>⚡ Cached</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }} className="hide-on-print">
                <button className="btn btn-outline" onClick={() => { setReport(null); setSelectedPaperIds([]) }} style={{ fontSize: '12px', padding: '6px 14px' }}>← New Analysis</button>
                {isElite && <button className="btn btn-outline" onClick={downloadPDF} style={{ fontSize: '12px', padding: '6px 14px' }}>💾 Save PDF</button>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {report.topicAnalysis?.map((topic: any, idx: number) => {
                const level = topic.classification.toLowerCase()
                return (
                  <motion.div key={topic.topic} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '18px', borderRadius: '12px' }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <span className="font-bold text-sm">{topic.topic}</span>
                      <span className={`badge badge-${level}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                        {topic.probability}% — {topic.classification}
                      </span>
                    </div>
                    <div className="prob-bar-track mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${topic.probability}%` }} transition={{ duration: 1, delay: 0.5 }}
                        className={`prob-bar-fill ${level}`} />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.6, margin: 0 }}>
                      <strong>Reasoning:</strong> {topic.reasoning}
                    </p>
                    {topic.cheatsheetPoints?.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clr-primary-h)', marginBottom: '6px' }}>💡 Quick Study Points:</p>
                        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {topic.cheatsheetPoints.map((pt: string, i: number) => (
                            <li key={i} style={{ fontSize: '12px', color: 'var(--clr-text-1)' }}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {report.topPredictions?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🔮 Predicted Questions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {report.topPredictions.map((pred: any, idx: number) => (
                    <motion.div key={idx} whileHover={{ scale: 1.01 }}
                      style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px' }}
                    >
                      <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--clr-text-1)', marginBottom: '8px' }}>{pred.predictedQuestion}</p>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--clr-text-3)' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: '4px' }}>
                          Chance: <strong style={{ color: '#fff' }}>{pred.probability}%</strong>
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: '4px' }}>
                          Weight: <strong style={{ color: '#fff' }}>{pred.marks} Marks</strong>
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Print-only: Watermark + QR Footer ── */}
            <div className="print-watermark" aria-hidden="true">TU Notes Hub</div>
            <div className="print-qr-footer">
              <div style={{ borderTop: '2px solid rgba(99,102,241,0.4)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px', color: '#fff' }}>📚 TU Notes Hub</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>AI-Powered Exam Prediction</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Scan QR to visit our website</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {/* QR Code via free API - points to website */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&bgcolor=080a12&color=ffffff&data=${encodeURIComponent('https://tunoteshub.vercel.app')}`}
                    alt="QR Code"
                    style={{ width: '90px', height: '90px', borderRadius: '8px', border: '2px solid rgba(99,102,241,0.4)' }}
                  />
                  <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>tunoteshub.vercel.app</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Right: AI Chat Panel (Elite only) */}
        {isElite && <AIChatPanel report={report} />}
      </div>
    </div>
  )
}

/* ── AI Chat Panel ── */
function AIChatPanel({ report }: { report: any }) {
  const [sessionId, setSessionId] = useState(() => `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessions, setSessions] = useState<{ session_id: string; last_message: string; created_at: string }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const dragControls = useDragControls()

  // Chat bot visibility state
  const [isOpen, setIsOpen] = useState(false)

  // Custom resizing state
  const [panelSize, setPanelSize] = useState({ width: 750, height: 500 })

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth < 640
        setPanelSize({
          width: isMobile ? Math.min(360, window.innerWidth - 32) : 750,
          height: isMobile ? Math.min(520, window.innerHeight - 100) : 500,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [report, isOpen])

  const handleResizeDrag = (e: React.MouseEvent, edges: string[]) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = panelSize.width
    const startHeight = panelSize.height

    const onMouseMove = (ev: MouseEvent) => {
      let newW = startWidth
      let newH = startHeight
      
      if (edges.includes('right')) newW = startWidth + (ev.clientX - startX)
      if (edges.includes('left')) newW = startWidth - (ev.clientX - startX)
      if (edges.includes('bottom')) newH = startHeight + (ev.clientY - startY)
      if (edges.includes('top')) newH = startHeight - (ev.clientY - startY)

      setPanelSize({
        width: Math.max(300, Math.min(newW, window.innerWidth - 32)),
        height: Math.max(380, Math.min(newH, window.innerHeight - 60))
      })
    }

    const onMouseUp = () => {
      document.body.style.cursor = 'default'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.body.style.cursor = edges.includes('left') || edges.includes('right') ? 'ew-resize' : 'ns-resize'
    if (edges.length > 1) document.body.style.cursor = edges.includes('left') === edges.includes('top') ? 'nwse-resize' : 'nesw-resize'
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll inside chat container ONLY (does not scroll main page/window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, sending])

  async function loadSessions() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/ai/chat-history')
      const data = await res.json()
      setSessions(data.sessions || [])
      setShowHistory(true)
    } catch { toast.error('Failed to load history') }
    finally { setLoadingHistory(false) }
  }

  async function loadSession(sid: string) {
    try {
      const res = await fetch(`/api/ai/chat-history?sessionId=${sid}`)
      const data = await res.json()
      setMessages((data.messages || []).map((m: any) => ({ role: m.role, text: m.message })))
      setSessionId(sid)
      setShowHistory(false)
    } catch { toast.error('Failed to load session') }
  }

  async function deleteSession(sid: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/ai/chat-history?sessionId=${sid}`, { method: 'DELETE' })
    setSessions(s => s.filter(x => x.session_id !== sid))
    toast.success('Session deleted')
  }

  function startNewChat() {
    setMessages([])
    setShowHistory(false)
    setSessionId(`s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  }

  async function sendMessage(textToSend?: string) {
    const queryText = textToSend || input
    if (!queryText.trim() || sending) return
    if (!textToSend) setInput('')
    setMessages(prev => [...prev, { role: 'user', text: queryText.trim() }])
    setSending(true)
    try {
      const reportContext = report
        ? `Subject: ${report.subject}\nTop Topics: ${report.topicAnalysis?.slice(0, 5).map((t: any) => `${t.topic} (${t.probability}%)`).join(', ')}`
        : undefined

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText.trim(), sessionId, reportContext }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }])
      } else {
        toast.error(data.error || 'Chat failed')
        setMessages(prev => [...prev, { role: 'model', text: '❌ ' + (data.error || 'Something went wrong.') }])
      }
    } catch {
      toast.error('Chat request failed')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="hide-on-print"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 100,
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-2xl shadow-purple-500/30 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#0d0f19] flex items-center justify-center overflow-hidden">
            <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.5)', pointerEvents: 'none' }} />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden"
        onClick={() => setIsOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="hide-on-print fixed bottom-0 left-0 right-0 sm:bottom-5 sm:right-5 sm:left-auto z-[100] flex flex-col bg-[#0d0f19] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        style={{
          height: `${panelSize.height}px`,
          width: `${panelSize.width}px`,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100vh - 40px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(168,85,247,0.15)',
        }}
      >
        {/* Mobile top handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* ── Custom Resize Handles (desktop) ── */}
        <div className="hidden sm:block" onMouseDown={(e) => handleResizeDrag(e, ['left'])} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 50 }} />
        <div className="hidden sm:block" onMouseDown={(e) => handleResizeDrag(e, ['right'])} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 50 }} />
        <div className="hidden sm:block" onMouseDown={(e) => handleResizeDrag(e, ['top'])} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', cursor: 'ns-resize', zIndex: 50 }} />
        <div className="hidden sm:block" onMouseDown={(e) => handleResizeDrag(e, ['bottom'])} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', cursor: 'ns-resize', zIndex: 50 }} />
        
        {/* Corners */}
        <div className="hidden sm:block" onMouseDown={(e) => handleResizeDrag(e, ['bottom', 'right'])} style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', cursor: 'nwse-resize', zIndex: 51 }} />

        {/* Header */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="px-4 py-3 bg-[#151724] border-b border-white/5 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 shrink-0 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full rounded-[10px] bg-[#0d0f19] flex items-center justify-center overflow-hidden">
                <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain scale-125 pointer-events-none" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-sm text-white tracking-tight leading-tight">Scholar AI</p>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                {report ? `Analyzing: ${report.subject}` : 'Academic AI Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={loadSessions} title="History" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </button>
            <button onClick={startNewChat} title="New chat" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={() => setIsOpen(false)} title="Close" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Past Sessions</p>
              <button onClick={() => setShowHistory(false)} className="text-xs text-indigo-400 hover:underline">← Back to chat</button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No chat history yet</p>
            ) : sessions.map(s => (
              <div key={s.session_id} onClick={() => loadSession(s.session_id)}
                className="p-3 rounded-xl bg-[#151724] border border-white/5 hover:border-purple-500/30 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 font-semibold truncate mb-0.5">{s.last_message || 'Chat session'}</p>
                  <p className="text-[10px] text-slate-500">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={e => deleteSession(s.session_id, e)} className="text-slate-500 hover:text-rose-400 text-xs p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {!showHistory && (
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {messages.length === 0 && !sending && (
              <div className="h-full flex flex-col items-center justify-center text-center p-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/10 overflow-hidden">
                  <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain scale-125 pointer-events-none" />
                </div>
                <p className="text-sm font-bold text-white leading-snug max-w-[260px]">
                  {report ? `How can I help with ${report.subject}?` : 'How can I help with your studies today?'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                  Ask questions about your syllabus, notes, or exam preparation.
                </p>

                {/* Quick prompt chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-xs">
                  {[
                    '📊 Predict exam topics',
                    '📝 Generate 10 MCQs',
                    '💡 Quick study summary',
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => sendMessage(promptText.slice(2))}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-slate-300 hover:text-white transition-all active:scale-95"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5 overflow-hidden">
                    <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain scale-125 pointer-events-none" />
                  </div>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-100 rounded-tr-xs'
                    : 'bg-white/[0.04] border border-white/8 text-slate-100 rounded-tl-xs shadow-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {sending && (
              <div className="flex items-start gap-2 justify-start">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                  <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline className="w-full h-full object-contain scale-125 pointer-events-none" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  Analyzing…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Form */}
        {!showHistory && (
          <div className="p-3 bg-[#151724] border-t border-white/5 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-purple-500/50 transition-all">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask about your syllabus, notes, or past papers..."
                rows={1}
                className="flex-1 bg-transparent border-none text-xs text-white placeholder:text-slate-500 outline-none resize-none py-1 max-h-20"
              />
              <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-30 disabled:bg-slate-800 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 shadow-md shadow-purple-500/20 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-500 mt-1">
              Powered by Scholar AI • Optimized for Mobile
            </p>
          </div>
        )}
      </motion.div>
    </>
  )
}
