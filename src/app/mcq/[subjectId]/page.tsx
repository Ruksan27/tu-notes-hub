'use client'
// src/app/mcq/[subjectId]/page.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AdUnit from '@/components/ads/AdUnit'

interface MCQ {
  id: string
  question: string
  options: string[]
  correctOption: number
  explanation: string | null
  year?: number | null
  examCategory?: string | null
}

interface Subject {
  id: string
  title: string
  code: string
  mcqs: MCQ[]
  semester?: {
    name?: string
    order?: number
    faculty?: { name?: string; systemType?: string }
  }
}

function formatExamType(type: string) {
  switch (type) {
    case 'BOARD_EXAM': return '🎓 Board Exam'
    case 'INTERNAL_EXAM': return '🏫 Internal Exam'
    case 'BACK_PAPER': return '🔄 Back Paper'
    default: return type
  }
}

function McqItem({ mcq, index }: { mcq: MCQ; index: number }) {
  return (
    <div style={{ marginBottom: '20px', fontSize: '11pt', textTransform: 'none' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: 'var(--clr-text-1)', lineHeight: '1.5' }}>
        {index + 1}. {mcq.question}
      </div>

      {/* Options List — Directly showing correct answer in Yellow */}
      <ul style={{ listStyleType: 'none', paddingLeft: '20px', margin: '6px 0' }}>
        {mcq.options.map((opt, idx) => {
          const isCorrect = mcq.correctOption === idx

          return (
            <li
              key={idx}
              className={isCorrect ? 'correct' : ''}
              style={{
                marginBottom: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                fontWeight: isCorrect ? 'bold' : 'normal',
                color: isCorrect ? '#10b981' : 'var(--clr-text-2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{String.fromCharCode(97 + idx)}) {opt}</span>
              {isCorrect && <span style={{ fontSize: '12px', marginLeft: 'auto' }}>✅ Correct Answer</span>}
            </li>
          )
        })}
      </ul>

      {/* Explanation shown directly */}
      {mcq.explanation && (
        <div style={{ marginTop: '8px', marginLeft: '20px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', fontSize: '10pt', color: '#334155', borderLeft: '3px solid #0284c7' }}>
          <strong>💡 Explanation:</strong> {mcq.explanation}
        </div>
      )}
    </div>
  )
}

export default function McqPracticePage() {
  const params = useParams()
  const subjectId = params?.subjectId as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterYear, setFilterYear] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isPaid, setIsPaid] = useState(false)

  // Download ad modal states
  const [downloadAdActive, setDownloadAdActive] = useState(false)
  const [downloadAdCountdown, setDownloadAdCountdown] = useState(15)

  useEffect(() => {
    setCurrentUrl(window.location.href)
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u?.packageType === 'SEMESTER_PASS' || u?.packageType === 'ELITE_AI') {
          setIsPaid(true)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!subjectId) return
    fetch(`/api/mcq/${subjectId}`)
      .then(r => r.json())
      .then(d => { setSubject(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [subjectId])

  // Download file ad countdown timer
  useEffect(() => {
    if (!downloadAdActive) return
    if (downloadAdCountdown <= 0) {
      setDownloadAdActive(false)
      triggerDownload()
      return
    }
    const t = setTimeout(() => setDownloadAdCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [downloadAdActive, downloadAdCountdown])

  const triggerDownload = () => {
    if (!subjectId) return
    const pdfUrl = `/api/mcq/${subjectId}/pdf`
    const cleanTitle = (subject?.title || 'MCQ').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
    const fileName = `TUNotes_MCQ_${cleanTitle}.pdf`

    const link = document.createElement('a')
    link.href = pdfUrl
    link.target = '_blank'
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleStartDownload = () => {
    if (isPaid) {
      triggerDownload()
      return
    }

    // Free user Ad-Blocker check
    const bait = document.createElement('div')
    bait.className = 'adsbox ad-placement doubleclick ad-placeholder'
    bait.style.position = 'absolute'
    bait.style.top = '-999px'
    bait.style.height = '10px'
    document.body.appendChild(bait)
    
    const isBlocked = window.getComputedStyle(bait).display === 'none' || bait.offsetHeight === 0
    document.body.removeChild(bait)

    if (isBlocked) {
      alert('⚠️ Ad Blocker Detected!\n\nPlease disable your Ad Blocker to download free files. We rely on ads to keep this service free for students.')
      return
    }

    setDownloadAdCountdown(15)
    setDownloadAdActive(true)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: '36px', height: '36px', display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading Exam Paper & MCQs...</p>
        </div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <p style={{ color: '#ef4444' }}>Subject not found.</p>
      </div>
    )
  }

  const mcqs = subject.mcqs || []
  const years = Array.from(new Set(mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
  const categories = Array.from(new Set(mcqs.map(m => m.examCategory).filter(Boolean)))

  const filtered = mcqs.filter(m => {
    if (filterYear !== 'all' && String(m.year) !== filterYear) return false
    if (filterCategory !== 'all' && m.examCategory !== filterCategory) return false
    return true
  })

  // Clean title — strip (Old Syllabus), (New Syllabus), (Old), (New)
  const cleanTitle = subject.title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()

  const facultyName = subject.semester?.faculty?.name || 'Faculty of Humanities & Social Sciences'
  const semName = subject.semester?.name || 'V'
  const yearText = years.length > 0 ? years[0] : new Date().getFullYear()
  const shareText = encodeURIComponent(`MCQ Answers — ${cleanTitle} (${subject.code}) | TU Notes Hub`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#0b0f19', position: 'relative' }}>
      
      {/* Top Sponsored Ad Banner */}
      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'center' }}>
        <AdUnit type="leaderboard" slot="mcq-top-banner" />
      </div>

      <div style={{ flex: 1, display: 'grid', gap: '24px', padding: '16px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%', gridTemplateColumns: 'minmax(0, 1fr) 340px', alignItems: 'stretch' }}>
        
        {/* Main Left Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Card (Matches download page header) */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-semester" style={{ marginBottom: '6px' }}>📄 TU OFFICIAL RESOURCE</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)', margin: 0 }}>
                  {cleanTitle} ({subject.code}) — MCQ Answers
                </h2>
              </div>

              {/* Download Button (Triggers 15s Ad Lock Modal for Free Users) */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={handleStartDownload}
                  className="btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                >
                  ⬇️ Download Files
                </button>
              </div>
            </div>

            {/* Social Share Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>Share Resource:</span>
              
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(37,211,102,0.12)', color: '#25D366', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
              >
                💬 WhatsApp
              </a>

              <a
                href={`viber://forward?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(115,114,242,0.12)', color: '#7372F2', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
              >
                📱 Viber
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(24,119,242,0.12)', color: '#1877F2', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
              >
                🔵 Facebook
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl)
                  alert('Link copied to clipboard!')
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--clr-text-2)', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                🔗 Copy Link
              </button>
            </div>
          </div>

          {/* PDF Viewer Style Container with Grey Background */}
          <div style={{
            background: '#525659',
            padding: '30px 0',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflowX: 'auto'
          }}>
            {/* Filter Bar inside Document Viewer */}
            {(years.length > 0 || categories.length > 0) && (
              <div style={{ width: '210mm', margin: '0 auto 20px auto', background: '#383b3d', padding: '10px 16px', borderRadius: '6px', display: 'flex', gap: '12px', alignItems: 'center', color: '#fff', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold' }}>🔍 Filter Questions:</span>
                {years.length > 1 && (
                  <select
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                    style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #555', background: '#2a2d2f', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                    <option value="all">All Years</option>
                    {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                )}
                {categories.length > 1 && (
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #555', background: '#2a2d2f', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c as string}>{formatExamType(c as string)}</option>)}
                  </select>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#ccc' }}>
                  Showing {filtered.length} of {mcqs.length}
                </span>
              </div>
            )}

            {/* Official Tribhuvan University Exam Paper Page Sheet */}
            <div style={{
              width: '210mm',
              minHeight: '297mm',
              margin: '0 auto',
              background: '#ffffff',
              padding: '25mm 20mm',
              boxSizing: 'border-box',
              boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000000',
              lineHeight: 1.5
            }}>
              {/* Official Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
                  TRIBHUVAN UNIVERSITY
                </h1>
                <h2 style={{ fontSize: '12pt', fontWeight: 'normal', margin: '0 0 4px 0' }}>
                  {facultyName}
                </h2>
                <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  OFFICE OF THE DEAN
                </h3>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                  {yearText}
                </div>
              </div>

              {/* Metadata Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt', marginBottom: '4px', fontWeight: 'bold' }}>
                <div>
                  <div style={{ marginBottom: '3px' }}>Bachelor in Computer Application</div>
                  <div style={{ marginBottom: '3px' }}>Course Title: {cleanTitle}</div>
                  <div style={{ marginBottom: '3px' }}>Code No: {subject.code}</div>
                  <div style={{ marginBottom: '3px' }}>Semester: {semName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '3px' }}>Full Marks: 60</div>
                  <div style={{ marginBottom: '3px' }}>Pass Marks: 24</div>
                  <div style={{ marginBottom: '3px' }}>Time: 3 hours</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #000', marginTop: '5px', marginBottom: '20px' }} />

              {/* Group A Header */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginTop: '10px', marginBottom: '15px' }}>
                Group A (Multiple Choice Questions)
              </div>

              <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '15px' }}>
                Attempt all questions. Correct answers are highlighted in yellow.
              </div>

              {/* Questions List */}
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}>
                  No MCQs available matching selected criteria.
                </p>
              ) : (
                filtered.map((m, i) => <McqItem key={m.id} mcq={m} index={i} />)
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Upgrade to Elite Banner */}
          <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--clr-text-1)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💎 Upgrade to Elite
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
              Tired of waiting? Get instant direct downloads, access all AI prediction models, and unlock full solutions offline.
            </p>
            <Link href="/pricing" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
              Unlock Now
            </Link>
          </div>

          {/* Sponsored Sidebar Ad Box */}
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Sponsored Advertisement
            </p>
            <AdUnit type="medium-rectangle" slot="mcq-sidebar-ad" />
          </div>

        </div>
      </div>

      {/* 10-SECOND SPONSORED AD COUNTDOWN MODAL (FOR FREE USERS) */}
      {downloadAdActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
          }}>
            <button
              onClick={() => setDownloadAdActive(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--clr-text-3)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>

            <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🔒 FREE DOWNLOAD AD GATEWAY
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>
              Preparing MCQ PDF...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
              Please wait while our server packs your file and verifies sponsor links.
            </p>

            {/* Modal Circular Countdown */}
            <div className="countdown-circle flex-center" style={{
              width: '90px',
              height: '90px',
              fontSize: '32px',
              fontWeight: 800,
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              boxShadow: '0 8px 24px rgba(6,182,212,0.4)',
              borderRadius: '50%',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {downloadAdCountdown}s
            </div>

            {/* Sponsored Advertisement Unit */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Sponsored Advertisement</p>
              <AdUnit type="medium-rectangle" slot="mcq-download-modal-ad" />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '20px' }}>
              Your file will download automatically in <strong style={{ color: 'var(--clr-accent)' }}>{downloadAdCountdown} second{downloadAdCountdown !== 1 ? 's' : ''}</strong>. Do not close this tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
