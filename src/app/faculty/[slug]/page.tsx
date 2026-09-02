// src/app/faculty/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import FacultySemesterList from '@/components/FacultySemesterList'

// We revalidate this page every 1 hour (ISR)
export const revalidate = 3600

// Pre-render all faculty index paths to make them load instantly
export async function generateStaticParams() {
  const faculties = await prisma.faculty.findMany({
    where: { visible: true },
    select: { id: true }
  })
  return faculties.map((f) => ({
    slug: f.id,
  }))
}

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const faculty = await prisma.faculty.findUnique({ where: { id: slug, visible: true } })
  if (!faculty) return {}
  return {
    title: `${faculty.id.toUpperCase()} Notes & Past Papers — TU Notes Hub`,
    description: `Free study notes, past question papers, and AI exam predictions for TU ${faculty.name} students.`,
  }
}

export default async function FacultyPage({ params }: Props) {
  const { slug } = await params
  const faculty = await prisma.faculty.findUnique({
    where: { id: slug, visible: true },
    include: {
      semesters: {
        orderBy: { order: 'asc' },
        include: {
          solutionBooks: { select: { id: true } },
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

      {/* Semester/Year Grid with Interactive Syllabus Toggle */}
      <FacultySemesterList faculty={faculty as any} />
    </div>
  )
}
}
