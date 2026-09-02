// src/components/FacultySemesterList.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface SubjectData {
  id: string
  code: string
  title: string
  notes: { id: string }[]
  pastPapers: { id: string }[]
  cheatsheets: { id: string }[]
}

interface SemesterData {
  id: string
  name: string
  order: number
  solutionBooks: { id: string }[]
  subjects: SubjectData[]
}

interface FacultyData {
  id: string
  name: string
  icon: string | null
  systemType: 'SEMESTER' | 'YEARLY'
  semesters: SemesterData[]
}

export default function FacultySemesterList({ faculty }: { faculty: FacultyData }) {
  const isYearly = faculty.systemType === 'YEARLY'

  // Automatically detect if this faculty has both New and Old Syllabus subjects
  const hasNewAndOld = useMemo(() => {
    let hasNew = false
    let hasOld = false
    for (const sem of faculty.semesters) {
      for (const sub of sem.subjects) {
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
    }
    return hasNew && hasOld
  }, [faculty])

  const [activeTab, setActiveTab] = useState<'new' | 'old' | 'all'>('new')

  // Filter subjects according to active syllabus tab
  const filteredSemesters = useMemo(() => {
    return faculty.semesters.map((sem) => {
      const filteredSubjects = sem.subjects.filter((sub) => {
        if (activeTab === 'all' || !hasNewAndOld) return true

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

        if (activeTab === 'new') return isNew || (!isOld && !sub.title.includes('Old'))
        if (activeTab === 'old') return isOld || (!isNew && sub.title.includes('Old'))
        return true
      })

      return {
        ...sem,
        subjects: filteredSubjects,
      }
    })
  }, [faculty, activeTab, hasNewAndOld])

  return (
    <div>
      {/* Syllabus Toggle Selector Bar if faculty has both old and new syllabus */}
      {hasNewAndOld && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px 24px',
          borderRadius: '16px',
          background: 'rgba(18, 21, 38, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          backdropFilter: 'blur(20px)',
          marginBottom: '36px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--clr-text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓</span>
              <span>Course Curriculum Version</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-2)', marginTop: '2px' }}>
              Select your syllabus version to view your exact semester subjects
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '6px',
          }}>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === 'new' ? 'var(--grad-brand)' : 'transparent',
                color: activeTab === 'new' ? '#ffffff' : 'var(--clr-text-2)',
                boxShadow: activeTab === 'new' ? '0 4px 16px rgba(99,102,241,0.5)' : 'none',
              }}
            >
              ✨ New Syllabus (2080+)
            </button>
            <button
              onClick={() => setActiveTab('old')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === 'old' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                color: activeTab === 'old' ? '#ffffff' : 'var(--clr-text-2)',
                boxShadow: activeTab === 'old' ? '0 4px 16px rgba(245,158,11,0.5)' : 'none',
              }}
            >
              📜 Old Syllabus (2074)
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--clr-text-3)',
              }}
            >
              🌐 Show All
            </button>
          </div>
        </div>
      )}

      {/* Semester/Year Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
      }}>
        {filteredSemesters.map((sem) => {
          const totalSolutionBooks = sem.solutionBooks ? sem.solutionBooks.length : 0
          const totalNotes = sem.subjects.reduce((sum, s) => sum + s.notes.length, 0)
          const totalPapers = sem.subjects.reduce((sum, s) => sum + s.pastPapers.length, 0)
          const totalSheets = sem.subjects.reduce((sum, s) => sum + s.cheatsheets.length, 0)

          const ord = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
          const periodSlug = isYearly ? `${ord}-year` : `${ord}-semester`
          const linkHref = `/faculty/${faculty.id}/${periodSlug}${hasNewAndOld ? `?syllabus=${activeTab}` : ''}`

          return (
            <Link
              key={sem.id}
              href={linkHref}
              style={{ textDecoration: 'none' }}
            >
              <div className="glass-card hover-lift" style={{
                padding: '28px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '20px',
                border: '1px solid var(--clr-border)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                {/* Decorative number */}
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-5px',
                  fontSize: '100px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  color: 'rgba(99,102,241,0.06)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>{sem.order}</div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Semester badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(99,102,241,0.12)',
                    marginBottom: '16px',
                  }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'var(--grad-brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 800, color: '#fff',
                    }}>{sem.order}</span>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--clr-primary-h)' }}>
                      {isYearly ? `${sem.order}${sem.order === 1 ? 'st' : sem.order === 2 ? 'nd' : sem.order === 3 ? 'rd' : 'th'} Year` : `${sem.order}${sem.order === 1 ? 'st' : sem.order === 2 ? 'nd' : sem.order === 3 ? 'rd' : 'th'} Semester`}
                    </span>
                  </div>

                  {/* Subjects count */}
                  <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>
                    {sem.subjects.length} Subject{sem.subjects.length !== 1 ? 's' : ''}
                  </h3>

                  {/* Subject names preview */}
                  {sem.subjects.length > 0 ? (
                    <div style={{ marginBottom: '20px' }}>
                      {sem.subjects.slice(0, 3).map((sub) => (
                        <p key={sub.id} style={{ fontSize: '13px', color: 'var(--clr-text-3)', lineHeight: 1.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--clr-accent)', fontWeight: 700, marginRight: '6px' }}>{sub.code}</span>
                          {sub.title.replace(' (New Syllabus)', '').replace(' (Old Syllabus)', '')}
                        </p>
                      ))}
                      {sem.subjects.length > 3 && (
                        <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px', fontWeight: 600 }}>
                          +{sem.subjects.length - 3} more subjects...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '20px', fontStyle: 'italic' }}>
                      No subjects under selected syllabus
                    </p>
                  )}

                  {/* Stats Badges */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-free" style={{ fontSize: '12px' }}>📄 {totalNotes} Notes</span>
                    <span className="badge badge-semester" style={{ fontSize: '12px' }}>📝 {totalPapers} Papers</span>
                    {totalSolutionBooks > 0 && <span className="badge badge-primary" style={{ fontSize: '12px' }}>📘 {totalSolutionBooks} Books</span>}
                    {totalSheets > 0 && <span className="badge badge-elite" style={{ fontSize: '12px' }}>📋 {totalSheets} Sheets</span>}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
