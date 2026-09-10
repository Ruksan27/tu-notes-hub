'use client'
// src/app/mcq/[subjectId]/McqPracticeClient.tsx
import { useEffect, useState, useCallback } from 'react'
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

function formatExamType(type: string) {
  switch (type) {
    case 'BOARD_EXAM': return 'Board Exam'
    case 'INTERNAL_EXAM': return 'Internal Exam'
    case 'BACK_PAPER': return 'Back Paper'
    default: return type || 'Board Exam'
  }
}

function McqCard({
  mcq,
  index,
  practiceMode,
}: {
  mcq: MCQ
  index: number
  practiceMode: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = useCallback(
    (idx: number) => {
      if (!practiceMode) return
      if (revealed) return
      setSelected(idx)
      setRevealed(true)
    },
    [practiceMode, revealed]
  )

  const reset = () => {
    setSelected(null)
    setRevealed(false)
  }

  const isCorrect = selected !== null && selected === mcq.correctOption
  const isWrong = selected !== null && selected !== mcq.correctOption

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${revealed && isWrong ? 'rgba(239,68,68,0.3)' : revealed && isCorrect ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '16px',
        padding: '22px 24px',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Question header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <span
          style={{
            minWidth: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            fontWeight: 800,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--clr-text-1)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {mcq.question}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {mcq.year && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: 'rgba(245,158,11,0.12)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                📅 {mcq.year}
              </span>
            )}
            {mcq.examCategory && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}
              >
                {formatExamType(mcq.examCategory)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mcq.options.map((opt, idx) => {
          const isThis = idx === mcq.correctOption
          const isThisSelected = selected === idx

          let bg = 'rgba(255,255,255,0.03)'
          let border = '1px solid rgba(255,255,255,0.08)'
          let color = 'var(--clr-text-2)'
          let labelBg = 'rgba(255,255,255,0.06)'
          let labelColor = 'var(--clr-text-3)'
          let cursor = practiceMode && !revealed ? 'pointer' : 'default'

          if (revealed) {
            if (isThis) {
              bg = 'rgba(16,185,129,0.12)'
              border = '1px solid rgba(16,185,129,0.4)'
              color = '#34d399'
              labelBg = 'rgba(16,185,129,0.2)'
              labelColor = '#34d399'
            } else if (isThisSelected && !isThis) {
              bg = 'rgba(239,68,68,0.1)'
              border = '1px solid rgba(239,68,68,0.35)'
              color = '#f87171'
              labelBg = 'rgba(239,68,68,0.2)'
              labelColor = '#f87171'
            }
          } else if (!practiceMode) {
            // Static mode — always highlight correct
            if (isThis) {
              bg = 'rgba(16,185,129,0.1)'
              border = '1px solid rgba(16,185,129,0.35)'
              color = '#34d399'
              labelBg = 'rgba(16,185,129,0.18)'
              labelColor = '#34d399'
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={!practiceMode || revealed}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: bg,
                border,
                color,
                cursor,
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: 1.5,
              }}
              onMouseEnter={(e) => {
                if (practiceMode && !revealed) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (practiceMode && !revealed) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = bg
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = border.replace('1px solid ', '')
                }
              }}
            >
              <span
                style={{
                  minWidth: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: labelBg,
                  color: labelColor,
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {revealed && isThis && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(16,185,129,0.25)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.4)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  ✓ Correct
                </span>
              )}
              {revealed && isThisSelected && !isThis && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(239,68,68,0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.35)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  ✗ Wrong
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {revealed && mcq.explanation && (
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: '10px',
            borderLeft: '3px solid #06b6d4',
          }}
        >
          <p style={{ fontSize: '12px', fontWeight: 800, color: '#22d3ee', marginBottom: '4px' }}>
            💡 Explanation
          </p>
          <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', margin: 0, lineHeight: 1.6 }}>
            {mcq.explanation}
          </p>
        </div>
      )}

      {/* Static mode explanation */}
      {!practiceMode && mcq.explanation && (
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.15)',
            borderRadius: '10px',
            borderLeft: '3px solid rgba(6,182,212,0.5)',
          }}
        >
          <p style={{ fontSize: '12px', fontWeight: 800, color: '#22d3ee', marginBottom: '4px' }}>
            💡 Explanation
          </p>
          <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', margin: 0, lineHeight: 1.6 }}>
            {mcq.explanation}
          </p>
        </div>
      )}

      {/* Try Again (practice mode) */}
      {practiceMode && revealed && (
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={reset}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--clr-text-3)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            🔄 Try Again
          </button>
          {isCorrect ? (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
              🎉 Correct! Great job.
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
              ❌ Wrong! The correct answer is{' '}
              <strong>{String.fromCharCode(65 + mcq.correctOption)}</strong>.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function McqPracticeClient({ initialSubject }: { initialSubject: Subject }) {
  const [subject] = useState<Subject>(initialSubject)
  const [filterYear, setFilterYear] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)

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
  const categories = Array.from(new Set(mcqs.map(m => m.examCategory).filter(Boolean)))

  const filtered = mcqs.filter(m => {
    if (filterYear !== 'all' && String(m.year) !== filterYear) return false
    if (filterCategory !== 'all' && m.examCategory !== filterCategory) return false
    return true
  })

  const cleanTitle = subject.title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()

  const facultyName = subject.semester?.faculty?.name || 'Bachelor in Computer Application (BCA)'
  const semName = subject.semester?.name
    ? subject.semester.name.toLowerCase().includes('semester')
      ? subject.semester.name
      : `${subject.semester.name} Semester`
    : subject.semester?.order
    ? `${subject.semester.order}th Semester`
    : '5th Semester'
  const yearText = years.length > 0 ? years.join(', ') : 'Past Board Exams'
  const shareText = encodeURIComponent(
    `MCQ Answers & Solutions — ${cleanTitle} (${subject.code}), ${semName} | TU Notes Hub`
  )

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
        @media (max-width: 768px) {
          .mcq-page-grid { grid-template-columns: 1fr !important; padding: 12px 16px !important; }
          .mcq-sidebar { display: none !important; }
        }
        .mcq-option-btn:hover:not(:disabled) {
          transform: translateX(2px);
        }
      `}</style>

      {/* Top Ad */}
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
        {/* ── Main Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header Card */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                className="badge badge-semester"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                🎓 {facultyName}
              </span>
              <span
                className="badge badge-primary"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                📚 {semName}
              </span>
              {years.length > 0 && (
                <span
                  className="badge"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(16,185,129,0.12)',
                    color: '#34d399',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  📅 {years.join(', ')}
                </span>
              )}
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(6,182,212,0.12)',
                  color: '#22d3ee',
                  border: '1px solid rgba(6,182,212,0.25)',
                }}
              >
                📝 {filtered.length} Questions
              </span>
            </div>

            {/* Title row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    color: 'var(--clr-text-1)',
                    margin: '0 0 6px 0',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cleanTitle}{' '}
                  <span style={{ color: 'var(--clr-text-3)', fontWeight: 600 }}>
                    ({subject.code})
                  </span>
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', margin: 0, lineHeight: 1.5 }}>
                  Official Tribhuvan University (TU) past paper MCQs with verified answers — {semName}
                </p>
              </div>
              <button
                onClick={handleStartDownload}
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                ⬇️ Download PDF
              </button>
            </div>

            {/* Share Bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--clr-text-3)',
                  display: 'block',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Share Resource:
              </span>
              <div className="flex items-center gap-3 max-md:gap-1.5 max-md:w-full">
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm max-md:!px-1 max-md:!text-[9px] max-md:flex-1"
                  style={{ background: '#128c7e', color: '#fff', textDecoration: 'none', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center' }}
                >
                  <span className="truncate">WhatsApp</span>
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm max-md:!px-1 max-md:!text-[9px] max-md:flex-1"
                  style={{ background: '#E1306C', color: '#fff', textDecoration: 'none', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center' }}
                >
                  <span className="truncate">Instagram</span>
                </a>
                <a
                  href={`fb-messenger://share/?link=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm max-md:!px-1 max-md:!text-[9px] max-md:flex-1"
                  style={{ background: '#00B2FF', color: '#fff', textDecoration: 'none', fontWeight: 700, border: 'none', display: 'flex', justifyContent: 'center' }}
                >
                  <span className="truncate">Messenger</span>
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(currentUrl); alert('Link copied!') }}
                  className="btn btn-sm max-md:!px-1 max-md:!text-[9px] max-md:flex-1"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--clr-text-2)', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 700, display: 'flex', justifyContent: 'center' }}
                >
                  <span className="truncate">Copy Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Controls bar */}
          <div
            className="glass-card"
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {years.length > 1 && (
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px', fontSize: '13px', minWidth: '120px', cursor: 'pointer' }}
                >
                  <option value="all">All Years</option>
                  {years.map(y => (
                    <option key={String(y)} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
              {categories.length > 1 && (
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px', fontSize: '13px', minWidth: '140px', cursor: 'pointer' }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={String(c)} value={String(c)}>
                      {formatExamType(String(c))}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mode Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => setPracticeMode(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: !practiceMode
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))'
                    : 'transparent',
                  color: !practiceMode ? '#fff' : 'var(--clr-text-3)',
                  transition: 'all 0.2s',
                }}
              >
                📄 Study Mode
              </button>
              <button
                onClick={() => setPracticeMode(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: practiceMode
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.8))'
                    : 'transparent',
                  color: practiceMode ? '#fff' : 'var(--clr-text-3)',
                  transition: 'all 0.2s',
                }}
              >
                🎯 Practice Mode
              </button>
            </div>
          </div>

          {/* Mode hint */}
          {practiceMode && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#34d399',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🎯</span>
              <span>Practice Mode: Tap an option to check your answer. Correct answers reveal instantly!</span>
            </div>
          )}

          {/* MCQ List */}
          {filtered.length === 0 ? (
            <div
              className="glass-card"
              style={{ padding: '60px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '15px' }}>
                No MCQs match the selected filters.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((m, i) => (
                <McqCard
                  key={m.id}
                  mcq={m}
                  index={i}
                  practiceMode={practiceMode}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="mcq-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '80px' }}>

          {/* Upgrade card */}
          <div
            className="glass-card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(168,85,247,0.07))',
              border: '1px solid rgba(99,102,241,0.18)',
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
              💎 Upgrade to Elite
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--clr-text-3)',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              Instant PDF downloads, AI Exam Predictor, unlimited MCQ practice — no ads.
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
              }}
            >
              Unlock Now →
            </Link>
          </div>

          {/* Quick Stats */}
          <div
            className="glass-card"
            style={{ padding: '20px' }}
          >
            <p
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--clr-text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '14px',
              }}
            >
              Quick Stats
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Total Questions', value: mcqs.length, color: '#a5b4fc' },
                { label: 'Years Covered', value: years.length > 0 ? years.join(', ') : '—', color: '#fbbf24' },
                { label: 'Showing Now', value: filtered.length, color: '#34d399' },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>
                    {stat.label}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ad */}
          <div
            className="glass-card"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            <p
              style={{
                fontSize: '10px',
                color: 'var(--clr-text-3)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Sponsored
            </p>
            <AdUnit type="medium-rectangle" slot="mcq-sidebar-ad-1" />
          </div>

          <div
            className="glass-card"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            <p
              style={{
                fontSize: '10px',
                color: 'var(--clr-text-3)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Sponsored
            </p>
            <AdUnit type="medium-rectangle" slot="mcq-sidebar-ad-2" />
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
