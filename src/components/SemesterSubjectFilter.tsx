// src/components/SemesterSubjectFilter.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import SubjectRow from '@/components/SubjectRow'

import { toSeoSlug } from '@/lib/utils'

interface Props {
  subjects: any[]
  semesterGuides?: any[]
  facultyId: string
  semesterOrder: number
  systemType: 'SEMESTER' | 'YEARLY'
  initialSyllabus?: string
}

/** Strip "(Old Syllabus)", "(New Syllabus)", "(Old)", "(New)" from a display title */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()
}

export default function SemesterSubjectFilter({
  subjects,
  semesterGuides = [],
  facultyId,
  semesterOrder,
  systemType,
  initialSyllabus = 'new',
}: Props) {
  // Automatically detect if there are both new and old syllabus subjects in this semester
  const hasNewAndOld = useMemo(() => {
    let hasNew = false
    let hasOld = false
    for (const sub of subjects) {
      if (sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ')) hasNew = true
      if (
        sub.title.includes('Old Syllabus') ||
        sub.code.startsWith('CACS') ||
        sub.code.startsWith('CAMT') ||
        sub.code.startsWith('CASO') ||
        sub.code.startsWith('CAEN') ||
        sub.code.startsWith('CAAC') ||
        sub.code.startsWith('CAST')
      ) hasOld = true
    }
    return hasNew && hasOld
  }, [subjects])

  const [activeTab, setActiveTab] = useState<'new' | 'old'>(
    initialSyllabus === 'old' ? 'old' : 'new'
  )

  useEffect(() => {
    setActiveTab(initialSyllabus === 'old' ? 'old' : 'new')
  }, [initialSyllabus])

  const filteredSubjects = useMemo(() => {
    if (!hasNewAndOld) return subjects

    return subjects.filter((sub) => {
      const isNew = sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ')
      const isOld =
        sub.title.includes('Old Syllabus') ||
        sub.code.startsWith('CACS') ||
        sub.code.startsWith('CAMT') ||
        sub.code.startsWith('CASO') ||
        sub.code.startsWith('CAEN') ||
        sub.code.startsWith('CAAC') ||
        sub.code.startsWith('CAST') ||
        sub.code.startsWith('CAPJ') ||
        sub.code.startsWith('CAEC') ||
        sub.code.startsWith('CAMG') ||
        sub.code.startsWith('CAIN') ||
        sub.code.startsWith('CAOR')

      if (activeTab === 'new') return isNew
      if (activeTab === 'old') return isOld
      return true
    })
  }, [subjects, activeTab, hasNewAndOld])

  const filteredGuides = useMemo(() => {
    if (!hasNewAndOld || semesterGuides.length === 0) return semesterGuides

    return semesterGuides.filter((guide) => {
      const title = guide.title.toLowerCase()
      const isOld = title.includes('old syllabus') || title.includes('(old)')
      const isNew = title.includes('new syllabus') || title.includes('(new)')

      if (activeTab === 'new') return isNew || (!isOld && !title.includes('old'))
      if (activeTab === 'old') return isOld || (!isNew && title.includes('old'))
      return true
    })
  }, [semesterGuides, activeTab, hasNewAndOld])

  return (
    <div style={{ marginTop: '24px' }}>
      {/* ── Syllabus Toggle ── */}
      {hasNewAndOld && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 20px',
          borderRadius: '16px',
          background: 'rgba(15, 18, 36, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: '28px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--clr-text-1)', letterSpacing: '0.02em' }}>
              🎓 Curriculum Version
            </span>
            <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>
              {activeTab === 'new' ? 'Showing new curriculum subjects' : 'Showing old curriculum subjects'}
            </span>
          </div>

          {/* Toggle Switch */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            gap: '4px',
          }}>
            <button
              id="syllabus-toggle-new"
              onClick={() => setActiveTab('new')}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.22s ease',
                background: activeTab === 'new'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'transparent',
                color: activeTab === 'new' ? '#fff' : 'var(--clr-text-3)',
                boxShadow: activeTab === 'new' ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>✨</span>
              <span>New</span>
            </button>
            <button
              id="syllabus-toggle-old"
              onClick={() => setActiveTab('old')}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.22s ease',
                background: activeTab === 'old'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'transparent',
                color: activeTab === 'old' ? '#fff' : 'var(--clr-text-3)',
                boxShadow: activeTab === 'old' ? '0 4px 14px rgba(245,158,11,0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📜</span>
              <span>Old</span>
            </button>
          </div>
        </div>
      )}

      {/* Solution Books & Semester Guides Section */}
      {filteredGuides.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📘</span> Solution Books & Full Semester Guides ({filteredGuides.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredGuides.map((book) => {
              const bookTitle = cleanTitle(book.title || '')
              const slug = toSeoSlug(bookTitle) || book.id
              const ord = semesterOrder === 1 ? '1st' : semesterOrder === 2 ? '2nd' : semesterOrder === 3 ? '3rd' : `${semesterOrder}th`
              const periodSlug = systemType === 'YEARLY' ? `${ord}-year` : `${ord}-semester`
              const href = `/faculty/${facultyId.toLowerCase()}/${periodSlug}/solution-book/${slug}`
              return (
                <div
                  key={book.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    border: '1px solid rgba(99,102,241,0.25)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.08) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>📘 SOLUTION BOOK</span>
                      {book.isPremium ? (
                        <span className="badge badge-elite" style={{ fontSize: '11px' }}>⚡ ELITE / PREMIER</span>
                      ) : (
                        <span className="badge badge-free" style={{ fontSize: '11px' }}>FREE</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                      {bookTitle}
                    </h3>
                    {book.description && (
                      <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                        {book.description}
                      </p>
                    )}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={href}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', textAlign: 'center', textDecoration: 'none', fontWeight: 700, padding: '10px' }}
                    >
                      📖 Read Solution Book
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subjects List */}
      {filteredSubjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ marginBottom: '8px', fontSize: '20px' }}>No Subjects Found</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            No subjects matching the selected curriculum version for this semester.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSubjects.map((subject) => (
            <SubjectRow
              key={subject.id}
              subject={subject}
              facultyId={facultyId}
              semesterOrder={semesterOrder}
              systemType={systemType}
            />
          ))}
        </div>
      )}
    </div>
  )
}
