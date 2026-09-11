'use client'
// src/app/mcq/[subjectId]/McqPracticeClient.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdUnit from '@/components/ads/AdUnit'

export interface MCQ {
  id: string
  question: string
  options: string[]
  correctOption: number
  explanation: string | null
  year?: number | null
  examCategory?: string | null
}

export interface Subject {
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

function McqItem({
  mcq,
  index,
  paperTheme,
}: {
  mcq: MCQ
  index: number
  paperTheme: 'light' | 'dark'
}) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const isLight = paperTheme === 'light'

  return (
    <div
      id={`question-${index + 1}`}
      style={{
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Question Text */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 800,
          color: isLight ? '#0f172a' : '#f8fafc',
          lineHeight: 1.6,
          margin: '0 0 14px 0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {index + 1}. {mcq.question}
      </h3>

      {/* Options List matching official paper format */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
        {mcq.options.map((opt, idx) => {
          const isCorrect = idx === mcq.correctOption
          const isSelected = selectedOption === idx
          const optionLetter = String.fromCharCode(97 + idx) // 'a', 'b', 'c', 'd'

          let bg = 'transparent'
          let border = '1px solid transparent'
          let textColor = isLight ? '#334155' : '#cbd5e1'
          let fontWeight = 500
          let badgeText = ''
          let badgeBg = ''

          if (isCorrect) {
            bg = isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.16)'
            border = isLight ? '1px solid #86efac' : '1px solid rgba(16, 185, 129, 0.4)'
            textColor = isLight ? '#15803d' : '#34d399'
            fontWeight = 700
            badgeText = '✓ Correct Answer'
            badgeBg = isLight ? '#16a34a' : 'rgba(16, 185, 129, 0.3)'
          } else if (selectedOption !== null && isSelected && !isCorrect) {
            bg = isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)'
            border = isLight ? '1px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.4)'
            textColor = isLight ? '#b91c1c' : '#f87171'
            fontWeight = 600
            badgeText = '✕ Your Choice'
            badgeBg = isLight ? '#dc2626' : 'rgba(239, 68, 68, 0.3)'
          }

          return (
            <div
              key={idx}
              onClick={() => setSelectedOption(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: bg,
                border,
                color: textColor,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, minWidth: '20px' }}>{optionLetter})</span>
                <span style={{ lineHeight: 1.5 }}>{opt}</span>
              </div>
              {badgeText && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: badgeBg,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {badgeText}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Explanation Box */}
      {mcq.explanation && (
        <div
          style={{
            marginTop: '12px',
            marginLeft: '12px',
            padding: '12px 16px',
            background: isLight ? '#f8fafc' : 'rgba(56, 189, 248, 0.08)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(56, 189, 248, 0.25)',
            borderLeft: `4px solid ${isLight ? '#0284c7' : '#38bdf8'}`,
            borderRadius: '6px',
            fontSize: '13px',
            color: isLight ? '#334155' : '#7dd3fc',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ fontWeight: 700, color: isLight ? '#0369a1' : '#38bdf8' }}>💡 Explanation:</strong>{' '}
          <span style={{ fontStyle: 'italic' }}>{mcq.explanation}</span>
        </div>
      )}
    </div>
  )
}

export default function McqPracticeClient({ initialSubject }: { initialSubject: Subject }) {
  const [subject] = useState<Subject>(initialSubject)
  const [filterYear, setFilterYear] = useState('all')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const paperTheme = 'light'

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
    } catch { }
  }, [])

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
    if (!subject?.id) return
    const pdfUrl = `/api/mcq/${subject.id}/pdf`
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

  const mcqs = subject.mcqs || []
  const years = Array.from(new Set(mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))

  const filtered = mcqs.filter(m => {
    if (filterYear !== 'all' && String(m.year) !== filterYear) return false
    return true
  })

  const cleanTitle = subject.title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()

  const facultyName = subject.semester?.faculty?.name || 'Bachelor of Computer Application'
  const semName = subject.semester?.name
    ? subject.semester.name.toLowerCase().includes('semester')
      ? subject.semester.name
      : `${subject.semester.name} Semester`
    : subject.semester?.order
    ? `${subject.semester.order}th Semester`
    : '5th Semester'

  const shareText = encodeURIComponent(
    `TU ${facultyName} ${semName} ${cleanTitle} (${subject.code}) MCQs with Answers — TU Notes Hub`
  )

  const isLight = paperTheme === 'light'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--clr-bg)',
        position: 'relative',
      }}
    >
      <style>{`
        @media (max-width: 992px) {
          .mcq-page-grid { grid-template-columns: 1fr !important; padding: 12px 16px !important; }
          .mcq-sidebar { display: none !important; }
          .tu-paper-sheet { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Top Leaderboard Ad */}
      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'center' }}>
        <AdUnit type="leaderboard" slot="mcq-top-banner" />
      </div>

      <div
        className="mcq-page-grid"
        style={{
          flex: 1,
          display: 'grid',
          gap: '24px',
          padding: '20px 24px',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Main Left Column (Official TU Paper Sheet Format) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top Control Bar (Theme & Download Actions) */}
          <div
            className="glass-card"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              borderRadius: '12px',
            }}
          >
            {/* Breadcrumb Info */}
            <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link href="/" style={{ color: 'var(--clr-text-3)', textDecoration: 'none' }}>Home</Link>
              <span>/</span>
              <span>{semName}</span>
              <span>/</span>
              <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{cleanTitle} ({subject.code})</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {years.length > 1 && (
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px', fontSize: '13px', minWidth: '120px', cursor: 'pointer', borderRadius: '8px' }}
                >
                  <option value="all">All Years</option>
                  {years.map(y => (
                    <option key={String(y)} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={handleStartDownload}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: 'none',
                }}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 📜 Official TU Question Paper Sheet Container */}
          <div
            className="tu-paper-sheet"
            style={{
              background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
              color: isLight ? '#0f172a' : '#ffffff',
              padding: '40px 48px',
              borderRadius: '16px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.25)' : '0 10px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Header Title Centered */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  fontFamily: 'serif, Georgia, Times, sans-serif',
                  color: isLight ? '#000000' : '#ffffff',
                }}
              >
                TRIBHUVAN UNIVERSITY
              </h1>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  margin: '0 0 2px 0',
                  color: isLight ? '#334155' : '#94a3b8',
                  fontFamily: 'sans-serif',
                }}
              >
                {facultyName}
              </p>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  color: isLight ? '#000000' : '#e2e8f0',
                  fontFamily: 'sans-serif',
                }}
              >
                OFFICE OF THE DEAN
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  margin: 0,
                  color: isLight ? '#000000' : '#fbbf24',
                  fontFamily: 'sans-serif',
                }}
              >
                {years.length > 0 ? years.join(', ') : '2026'}
              </p>
            </div>

            {/* Official Meta Info Table */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: `2px solid ${isLight ? '#0f172a' : 'rgba(255,255,255,0.2)'}`,
                paddingBottom: '16px',
                marginBottom: '20px',
                fontSize: '14px',
                lineHeight: 1.6,
                fontFamily: 'sans-serif',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Bachelor in Computer Application</strong></div>
                <div><strong>Course Title:</strong> {cleanTitle}</div>
                <div><strong>Code No:</strong> {subject.code}</div>
                <div><strong>Semester:</strong> {semName}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                <div><strong>Full Marks: 60</strong></div>
                <div><strong>Pass Marks: 24</strong></div>
                <div><strong>Time: 3 hours</strong></div>
              </div>
            </div>

            {/* Group A Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 900,
                  margin: '0 0 4px 0',
                  color: isLight ? '#0f172a' : '#ffffff',
                }}
              >
                Group A (Multiple Choice Questions)
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: isLight ? '#475569' : '#94a3b8',
                  margin: 0,
                }}
              >
                Attempt all questions. Correct answers are highlighted in yellow.
              </p>
            </div>

            {/* Questions List */}
            {filtered.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                No MCQs available for the selected filter.
              </div>
            ) : (
              <div>
                {filtered.map((m, i) => (
                  <div key={m.id}>
                    <McqItem mcq={m} index={i} paperTheme={paperTheme} />

                    {/* High CPM In-Feed Ad every 5 questions */}
                    {(i + 1) % 5 === 0 && i !== filtered.length - 1 && (
                      <div style={{ margin: '20px 0' }}>
                        <AdUnit type="inline" slot={`mcq-infeed-ad-${i + 1}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer Share Bar inside Paper */}
            <div
              style={{
                borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                paddingTop: '16px',
                marginTop: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: isLight ? '#64748b' : 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Share Official Resource:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#128c7e', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
                >
                  WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#E1306C', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}
                >
                  Instagram
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(currentUrl); alert('Link copied!') }}
                  style={{ background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)', color: isLight ? '#0f172a' : '#cbd5e1', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)', fontWeight: 700, padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar (Ads & Upgrade) ── */}
        <div
          className="mcq-sidebar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'sticky',
            top: '80px',
          }}
        >
          {/* Top High CTR Ad Slot */}
          <div
            className="glass-card"
            style={{ padding: '16px', textAlign: 'center', borderRadius: '16px' }}
          >
            <p
              style={{
                fontSize: '10px',
                color: 'var(--clr-text-3)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                margin: '0 0 10px 0',
                fontWeight: 700,
              }}
            >
              SPONSORED ADVERTISEMENT
            </p>
            <AdUnit type="medium-rectangle" slot="mcq-sidebar-top-ad" />
          </div>

          {/* High CPM Half-Page / Skyscraper Ad Slot (300x600 - Highest RPM) */}
          <div
            className="glass-card"
            style={{ padding: '16px', textAlign: 'center', borderRadius: '16px' }}
          >
            <p
              style={{
                fontSize: '10px',
                color: 'var(--clr-text-3)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                margin: '0 0 10px 0',
                fontWeight: 700,
              }}
            >
              SPONSORED CONTENT
            </p>
            <AdUnit type="half-page" slot="mcq-sidebar-skyscraper-ad" />
          </div>

          {/* Upgrade to Elite Banner */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--clr-text-1)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              💎 Upgrade to Elite Pass
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--clr-text-3)',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              Instant PDF downloads, AI Exam Predictor, unlimited MCQ practice & zero ads.
            </p>
            <Link
              href="/pricing"
              className="btn btn-primary"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              }}
            >
              Unlock Now →
            </Link>
          </div>
        </div>
      </div>

      {/* Download Ad Countdown Modal */}
      {downloadAdActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              position: 'relative',
            }}
          >
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

            <span
              className="badge badge-primary"
              style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}
            >
              🔒 FREE DOWNLOAD
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>
              Preparing MCQ PDF...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
              Please wait while the server packs your file.
            </p>

            <div
              style={{
                width: '90px',
                height: '90px',
                fontSize: '32px',
                fontWeight: 800,
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                boxShadow: '0 8px 24px rgba(6,182,212,0.35)',
                borderRadius: '50%',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {downloadAdCountdown}s
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '24px',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--clr-text-3)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Sponsored Advertisement
              </p>
              <AdUnit type="medium-rectangle" slot="mcq-download-modal-ad" />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '20px' }}>
              Your file downloads in{' '}
              <strong style={{ color: 'var(--clr-accent)' }}>
                {downloadAdCountdown} second{downloadAdCountdown !== 1 ? 's' : ''}
              </strong>
              . Do not close this tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
