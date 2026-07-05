// src/app/faculty/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const faculty = await prisma.faculty.findUnique({ where: { id: slug } })
  if (!faculty) return {}
  return {
    title: `${faculty.id.toUpperCase()} Notes & Past Papers — TU Notes Hub`,
    description: `Free study notes, past question papers, and AI exam predictions for TU ${faculty.name} students.`,
  }
}

export default async function FacultyPage({ params }: Props) {
  const { slug } = await params
  const faculty = await prisma.faculty.findUnique({
    where: { id: slug },
    include: {
      semesters: {
        orderBy: { order: 'asc' },
        include: {
          subjects: {
            include: {
              notes: { select: { id: true } },
              pastPapers: { select: { id: true } },
              cheatsheets: { select: { id: true } },
            },
          },
        },
      },
    },
  })
  if (!faculty) notFound()

  const isYearly = faculty.systemType === 'YEARLY'
  const periodLabel = isYearly ? 'Year' : 'Semester'

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
        <Link href="/" style={{ color: 'var(--clr-text-3)' }}>Home</Link>
        <span>/</span>
        <Link href="/faculties" style={{ color: 'var(--clr-text-3)' }}>Faculties</Link>
        <span>/</span>
        <span style={{ color: 'var(--clr-text-1)' }}>{faculty.id.toUpperCase()}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px', flexWrap: 'wrap' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: 'var(--grad-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', flexShrink: 0,
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
        }}>{faculty.icon}</div>
        <div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', marginBottom: '6px' }}>
            {faculty.id.toUpperCase()} — <span className="text-gradient">{faculty.name}</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '15px' }}>
            {faculty.semesters.length} {isYearly ? 'Years' : 'Semesters'} • Free Notes & Past Papers Available
          </p>
        </div>
      </div>

      {/* Semester/Year Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {faculty.semesters.map((sem) => {
          const totalNotes = sem.subjects.reduce((sum, s) => sum + s.notes.length, 0)
          const totalPapers = sem.subjects.reduce((sum, s) => sum + s.pastPapers.length, 0)
          const totalSheets = sem.subjects.reduce((sum, s) => sum + s.cheatsheets.length, 0)
          const totalContent = totalNotes + totalPapers + totalSheets

          return (
            <Link
              key={sem.id}
              href={`/faculty/${faculty.id}/${sem.order}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="glass-card" style={{
                padding: '28px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
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
                  <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                    {sem.subjects.length} Subject{sem.subjects.length !== 1 ? 's' : ''}
                  </h3>

                  {/* Subject names preview */}
                  {sem.subjects.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      {sem.subjects.slice(0, 3).map((sub) => (
                        <p key={sub.id} style={{ fontSize: '13px', color: 'var(--clr-text-3)', lineHeight: 1.8 }}>
                          <span style={{ color: 'var(--clr-accent)', fontWeight: 600, marginRight: '6px' }}>{sub.code}</span>
                          {sub.title}
                        </p>
                      ))}
                      {sem.subjects.length > 3 && (
                        <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '4px' }}>
                          +{sem.subjects.length - 3} more subjects...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="badge badge-free">📄 {totalNotes} Notes</span>
                    <span className="badge badge-semester">📝 {totalPapers} Papers</span>
                    {totalSheets > 0 && <span className="badge badge-elite">📋 {totalSheets} Sheets</span>}
                  </div>

                  {/* Arrow */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    fontSize: '20px',
                    color: 'var(--clr-text-3)',
                    opacity: 0.5,
                  }}>→</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
