// src/components/FacultySemesterList.tsx
'use client'

import Link from 'next/link'

interface SubjectData {
  id: string
  code: string
  title: string
  notes: { id: string; noteType?: string }[]
  pastPapers: { id: string }[]
  cheatsheets: { id: string }[]
  mcqs?: { id: string }[]
}

interface SemesterData {
  id: string
  name: string
  order: number
  visible?: boolean
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

  // Only filter out hidden semesters (admin controls this)
  const filteredSemesters = faculty.semesters
    .filter((sem: any) => sem.visible !== false)
    .map((sem: any) => {
      const filteredSubjects = sem.subjects.filter((sub: any) => {
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

        if (isNew && sem.visibleNew === false) return false
        if (isOld && sem.visibleOld === false) return false
        return true
      })

      return {
        ...sem,
        subjects: filteredSubjects
      }
    })

  return (
    <div>
      {/* Semester/Year Grid (Desktop & Mobile Conditional) */}
      <div className="semester-desktop">
        {filteredSemesters.map((sem) => {
          const totalSolutionBooks = (sem.solutionBooks || []).length
          const totalNotes = sem.subjects.reduce((sum: number, s: any) => sum + s.notes.filter((n: any) => n.noteType !== 'SYLLABUS').length, 0)
          const totalPapers = sem.subjects.reduce((sum: number, s: any) => sum + s.pastPapers.length, 0)
          const totalSheets = sem.subjects.reduce((sum: number, s: any) => sum + s.cheatsheets.length, 0)
          // Count how many subjects have MCQs available (1 per subject), instead of counting every single question
          const totalMcqs = sem.subjects.reduce((sum: number, s: any) => sum + (s.mcqs && s.mcqs.length > 0 ? 1 : 0), 0)
          const totalSyllabus = sem.subjects.reduce((sum: number, s: any) => sum + s.notes.filter((n: any) => n.noteType === 'SYLLABUS').length, 0)

          const ord = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
          const periodSlug = isYearly ? `${ord}-year` : `${ord}-semester`
          const linkHref = `/faculty/${faculty.id}/${periodSlug}`

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
                      {sem.subjects.slice(0, 3).map((sub: any) => (
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
                      No subjects available
                    </p>
                  )}

                  {/* Stats Badges — Only show when count > 0 */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {totalNotes > 0 && <span className="badge badge-free" style={{ fontSize: '12px' }}>📄 {totalNotes} Notes</span>}
                    {totalPapers > 0 && <span className="badge badge-semester" style={{ fontSize: '12px' }}>📝 {totalPapers} Papers</span>}
                    {totalSolutionBooks > 0 && <span className="badge badge-primary" style={{ fontSize: '12px' }}>📘 {totalSolutionBooks} Books</span>}
                    {totalMcqs > 0 && <span className="badge badge-success" style={{ fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>✅ {totalMcqs} MCQs</span>}
                    {totalSyllabus > 0 && <span className="badge" style={{ fontSize: '12px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>📋 {totalSyllabus} Syllabus</span>}
                    {totalSheets > 0 && <span className="badge badge-elite" style={{ fontSize: '12px' }}>📋 {totalSheets} Sheets</span>}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="semester-mobile">
        {filteredSemesters.map((sem) => {
          const ord = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
          const periodSlug = isYearly ? `${ord}-year` : `${ord}-semester`
          const linkHref = `/faculty/${faculty.id}/${periodSlug}`

          return (
            <Link key={sem.id} href={linkHref} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderLeft: '4px solid var(--clr-primary)',
                borderRadius: '12px',
                transition: 'all 0.25s ease',
                margin: 0
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-text-1)', letterSpacing: '0.02em' }}>
                  {isYearly ? `${ord} Year` : `${ord} Semester`}
                </span>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: 'rgba(99, 102, 241, 0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--clr-primary-h)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .semester-desktop {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .semester-mobile {
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .semester-desktop { display: none; }
          .semester-mobile { display: flex; }
        }
      ` }} />
    </div>
  )
}
