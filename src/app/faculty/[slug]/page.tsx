// src/app/faculty/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import FacultySemesterList from '@/components/FacultySemesterList'

// Dynamic page (revalidate on every request in dev)
export const revalidate = 0

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
          solutionBooks: { select: { id: true, title: true } },
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

  // Fetch raw semester visibility flags directly from MySQL
  let rawSemesters: any[] = []
  try {
    rawSemesters = await prisma.$queryRawUnsafe(
      `SELECT id, \`visible\`, \`visibleNew\`, \`visibleOld\` FROM \`Semester\` WHERE \`facultyId\` = ?;`,
      slug
    )
  } catch {}

  function parseBool(val: any, fallback = true): boolean {
    if (val === undefined || val === null) return fallback
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val !== 0
    if (Buffer.isBuffer(val)) return val.length > 0 && val[0] !== 0
    if (typeof val === 'string') return val === 'true' || val === '1'
    return Boolean(val)
  }

  const semestersWithVisibility = faculty.semesters.map((sem: any) => {
    const raw = rawSemesters.find((r: any) => r.id === sem.id)
    return {
      ...sem,
      visible: raw ? parseBool(raw.visible, sem.visible ?? true) : (sem.visible ?? true),
      visibleNew: raw ? parseBool(raw.visibleNew, sem.visibleNew ?? true) : (sem.visibleNew ?? true),
      visibleOld: raw ? parseBool(raw.visibleOld, sem.visibleOld ?? true) : (sem.visibleOld ?? true),
    }
  })

  const facultyData = {
    ...faculty,
    semesters: semestersWithVisibility,
  }

  const isYearly = faculty.systemType === 'YEARLY'
  const periodLabel = isYearly ? 'Year' : 'Semester'

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
        <Link href="/" style={{ color: 'var(--clr-text-3)' }}>Home</Link>
        <span>/</span>
        <Link href="/faculties" style={{ color: 'var(--clr-text-3)' }}>Faculties</Link>
        <span>/</span>
        <span style={{ color: 'var(--clr-text-1)' }}>{faculty.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ fontSize: '40px' }}>{faculty.icon}</span>
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
              {faculty.name} <span className="text-gradient">({faculty.id.toUpperCase()})</span>
            </h1>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '15px', marginTop: '4px' }}>
              Select a {periodLabel.toLowerCase()} below to access free study notes, question papers, and solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Semester Grid Component */}
      <FacultySemesterList faculty={facultyData as any} />
    </div>
  )
}
