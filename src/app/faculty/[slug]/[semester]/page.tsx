// src/app/faculty/[slug]/[semester]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string; semester: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, semester } = await params
  const order = parseInt(semester)
  const faculty = await prisma.faculty.findUnique({ where: { id: slug } })
  if (!faculty) return {}
  const isYearly = faculty.systemType === 'YEARLY'
  const label = isYearly ? `Year ${order}` : `Semester ${order}`
  return {
    title: `${faculty.id.toUpperCase()} ${label} — Notes & Past Papers | TU Notes Hub`,
    description: `Download free study notes, past papers, and cheatsheets for ${faculty.name} ${label}.`,
  }
}

export default async function SemesterPage({ params }: Props) {
  const { slug, semester } = await params
  const order = parseInt(semester)
  if (isNaN(order)) notFound()

  const faculty = await prisma.faculty.findUnique({
    where: { id: slug },
    include: {
      semesters: {
        where: { order },
        include: {
          subjects: {
            orderBy: { code: 'asc' },
            include: {
              notes: { orderBy: { createdAt: 'desc' } },
              pastPapers: { orderBy: { year: 'desc' } },
              cheatsheets: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  })
  if (!faculty || faculty.semesters.length === 0) notFound()

  const sem = faculty.semesters[0]
  const isYearly = faculty.systemType === 'YEARLY'
  const periodLabel = isYearly ? `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'} Year` : `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'} Semester`

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--clr-text-3)' }}>Home</Link>
        <span>/</span>
        <Link href="/faculties" style={{ color: 'var(--clr-text-3)' }}>Faculties</Link>
        <span>/</span>
        <Link href={`/faculty/${slug}`} style={{ color: 'var(--clr-text-3)' }}>{slug.toUpperCase()}</Link>
        <span>/</span>
        <span style={{ color: 'var(--clr-text-1)' }}>{periodLabel}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--grad-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 900, color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
          }}>{order}</div>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 36px)' }}>
              {faculty.icon} {faculty.id.toUpperCase()} — <span className="text-gradient">{periodLabel}</span>
            </h1>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginTop: '4px' }}>
              {sem.subjects.length} Subject{sem.subjects.length !== 1 ? 's' : ''} • {faculty.name}
            </p>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      {sem.subjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ marginBottom: '8px', fontSize: '22px' }}>No Subjects Added Yet</h3>
          <p style={{ color: 'var(--clr-text-2)', maxWidth: '420px', margin: '0 auto' }}>
            Subjects for this {isYearly ? 'year' : 'semester'} haven&apos;t been added yet. Check back soon or contact the admin!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sem.subjects.map((subject) => {
            const totalContent = subject.notes.length + subject.pastPapers.length + subject.cheatsheets.length
            return (
              <div key={subject.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Subject Header */}
                <div style={{
                  padding: '24px 28px',
                  borderBottom: '1px solid var(--clr-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(6,182,212,0.12)',
                      color: 'var(--clr-accent)',
                      fontWeight: 700,
                      fontSize: '13px',
                      fontFamily: 'var(--font-display)',
                    }}>{subject.code}</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{subject.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-free">📄 {subject.notes.length}</span>
                    <span className="badge badge-semester">📝 {subject.pastPapers.length}</span>
                    <span className="badge badge-elite">📋 {subject.cheatsheets.length}</span>
                  </div>
                </div>

                {/* Content */}
                {totalContent === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--clr-text-3)', fontSize: '14px' }}>
                    📭 No content uploaded yet for this subject.
                  </div>
                ) : (
                  <div style={{ padding: '20px 28px' }}>
                    {/* Notes */}
                    {subject.notes.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--clr-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📄 Study Notes</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                          {subject.notes.map((note) => (
                            <Link key={note.id} href={`/download/${note.id}?type=note`} style={{ textDecoration: 'none' }}>
                              <div style={{
                                padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px', lineHeight: 1.4 }}>{note.title}</p>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>
                                    {note.noteType.replace('_', ' ')}
                                  </span>
                                  {note.isPremium && <span className="badge badge-elite" style={{ fontSize: '9px', padding: '1px 6px' }}>PREMIUM</span>}
                                  <span style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>⬇ {note.downloadCount}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Papers */}
                    {subject.pastPapers.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--clr-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Past Papers</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                          {subject.pastPapers.map((pp) => (
                            <Link key={pp.id} href={`/download/${pp.id}?type=paper`} style={{ textDecoration: 'none' }}>
                              <div style={{
                                padding: '14px 16px',
                                background: 'rgba(6,182,212,0.05)',
                                border: '1px solid rgba(6,182,212,0.15)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '4px' }}>{pp.year} {pp.examType.replace('_', ' ')}</p>
                                <span style={{ fontSize: '11px', color: 'var(--clr-accent)' }}>View Paper →</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cheatsheets */}
                    {subject.cheatsheets.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '14px', color: 'var(--clr-text-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Cheatsheets</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                          {subject.cheatsheets.map((cs) => (
                            <div key={cs.id} style={{
                              padding: '14px 16px',
                              background: 'rgba(99,102,241,0.05)',
                              border: '1px solid rgba(99,102,241,0.15)',
                              borderRadius: 'var(--radius-sm)',
                            }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text-1)' }}>{cs.title}</p>
                              <span className="badge badge-elite" style={{ fontSize: '9px', marginTop: '6px' }}>ELITE AI ONLY</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
