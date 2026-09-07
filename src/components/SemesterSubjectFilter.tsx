// src/components/SemesterSubjectFilter.tsx
'use client'

import SubjectRow from '@/components/SubjectRow'
import { toSeoSlug } from '@/lib/utils'

interface Props {
  subjects: any[]
  semesterGuides?: any[]
  facultyId: string
  semesterOrder: number
  systemType: 'SEMESTER' | 'YEARLY'
  visibleNew: boolean
  visibleOld: boolean
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
  visibleNew,
  visibleOld,
}: Props) {
  const filteredSubjects = subjects.filter((sub: any) => {
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

    if (isNew && !visibleNew) return false
    if (isOld && !visibleOld) return false
    return true
  })

  const filteredGuides = semesterGuides.filter((guide: any) => {
    const title = guide.title.toLowerCase()
    const isOldGuide = title.includes('old syllabus') || title.includes('(old)')
    const isNewGuide = title.includes('new syllabus') || title.includes('(new)')

    if (isNewGuide && !visibleNew) return false
    if (isOldGuide && !visibleOld) return false
    return true
  })

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Solution Books & Semester Guides Section */}
      {filteredGuides.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📘</span> Solution Books & Full Semester Guides ({filteredGuides.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredGuides.map((book: any) => {
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
            No subjects available for this semester.
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredSubjects.map((subject: any) => (
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
