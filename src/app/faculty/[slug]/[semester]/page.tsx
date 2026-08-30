// src/app/faculty/[slug]/[semester]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SubjectRow from '@/components/SubjectRow'
import AdUnit from '@/components/ads/AdUnit'

export const revalidate = 3600

export async function generateStaticParams() {
  const semesters = await prisma.semester.findMany({
    select: {
      order: true,
      facultyId: true,
      faculty: { select: { systemType: true } }
    },
  })

  const params: { slug: string; semester: string }[] = []
  
  for (const sem of semesters) {
    const isYearly = sem.faculty?.systemType === 'YEARLY'
    const ord = sem.order === 1 ? '1st' : sem.order === 2 ? '2nd' : sem.order === 3 ? '3rd' : `${sem.order}th`
    const periodSlug = isYearly ? `${ord}-year` : `${ord}-semester`

    // Primary SEO friendly URL
    params.push({ slug: sem.facultyId, semester: periodSlug })
    // Legacy numeric fallback
    params.push({ slug: sem.facultyId, semester: sem.order.toString() })
  }

  return params
}

interface Props { params: Promise<{ slug: string; semester: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, semester } = await params
  const order = parseInt(semester, 10)
  const faculty = await prisma.faculty.findUnique({ where: { id: slug } })
  if (!faculty || isNaN(order)) return {}
  const isYearly = faculty.systemType === 'YEARLY'
  const ord = order === 1 ? '1st' : order === 2 ? '2nd' : order === 3 ? '3rd' : `${order}th`
  const label = isYearly ? `${ord} Year` : `${ord} Semester`
  const canonicalSlug = isYearly ? `${ord.toLowerCase()}-year` : `${ord.toLowerCase()}-semester`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'

  return {
    title: `${faculty.id.toUpperCase()} ${label} — Notes & Past Papers | TU Notes Hub`,
    description: `Download free study notes, past papers, and cheatsheets for ${faculty.name} ${label}.`,
    alternates: {
      canonical: `${baseUrl}/faculty/${slug}/${canonicalSlug}`,
    },
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
      <div style={{ marginBottom: '28px' }}>
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

      {/* Top Banner Ad */}
      <AdUnit type="banner" slot="semester-top-banner" />

      {/* Subjects List */}
      {sem.subjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ marginBottom: '8px', fontSize: '22px' }}>No Subjects Added Yet</h3>
          <p style={{ color: 'var(--clr-text-2)', maxWidth: '420px', margin: '0 auto' }}>
            Subjects for this {isYearly ? 'year' : 'semester'} haven&apos;t been added yet. Check back soon or contact the admin!
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sem.subjects.map((subject) => (
            <SubjectRow key={subject.id} subject={subject as any} />
          ))}

          {/* Bottom Ad Unit for Free Tier users */}
          <div style={{ marginTop: '16px' }}>
            <AdUnit type="inline" slot="semester-bottom-ad" />
          </div>
        </div>
      )}
    </div>
  )
}
