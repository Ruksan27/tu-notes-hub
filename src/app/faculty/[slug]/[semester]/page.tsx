// src/app/faculty/[slug]/[semester]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import AdUnit from '@/components/ads/AdUnit'

import SemesterSubjectFilter from '@/components/SemesterSubjectFilter'

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

interface Props {
  params: Promise<{ slug: string; semester: string }>
}

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
              linkedSubject: {
                include: {
                  notes: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      cloudinaryUrl: true,
                      fileSize: true,
                      noteType: true,
                      isPremium: true,
                      downloadCount: true,
                    }
                  },
                  pastPapers: {
                    orderBy: { year: 'desc' },
                    select: {
                      id: true,
                      year: true,
                      examType: true,
                      cloudinaryUrl: true,
                    }
                  },
                  cheatsheets: {
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, title: true, content: true, subjectId: true, createdAt: true }
                  },
                  mcqs: {
                    orderBy: { createdAt: 'asc' },
                  },
                  solutionBooks: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      cloudinaryUrl: true,
                      fileSize: true,
                      isPremium: true,
                      author: true,
                      subjectId: true,
                    }
                  }
                }
              },
              notes: {
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  cloudinaryUrl: true,
                  fileSize: true,
                  noteType: true,
                  isPremium: true,
                  downloadCount: true,
                }
              },
              pastPapers: {
                orderBy: { year: 'desc' },
                select: {
                  id: true,
                  year: true,
                  examType: true,
                  cloudinaryUrl: true,
                }
              },
              cheatsheets: {
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, content: true, subjectId: true, createdAt: true }
              },
              mcqs: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
    },
  })
  if (!faculty || faculty.semesters.length === 0) notFound()

  const sem = faculty.semesters[0]

  // Fetch solution books separately (lean query) to avoid bloating main query
  const solutionBooks = await prisma.solutionBook.findMany({
    where: { semesterId: sem.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      cloudinaryUrl: true,
      fileSize: true,
      isPremium: true,
      author: true,
      subjectId: true,
      semester: {
        select: {
          order: true,
          facultyId: true,
        }
      },
    }
  })

  const isYearly = faculty.systemType === 'YEARLY'
  const periodLabel = isYearly
    ? `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'} Year`
    : `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : order === 3 ? 'rd' : 'th'} Semester`

  // Separate full semester guides vs subject-specific solution books
  const semesterGuides = solutionBooks.filter((b: any) => !b.subjectId)
  
  // Filter subjects based on visibleNew/visibleOld to get accurate count
  const visibleSubjects = sem.subjects.filter((sub: any) => {
    const isNew = sub.title.includes('New Syllabus') || sub.code.startsWith('BCA ')
    const isOld = sub.title.includes('Old Syllabus') || 
                  sub.code.startsWith('CACS') || sub.code.startsWith('CAMT') || 
                  sub.code.startsWith('CASO') || sub.code.startsWith('CAEN') || 
                  sub.code.startsWith('CAAC') || sub.code.startsWith('CAST') || 
                  sub.code.startsWith('CAPJ') || sub.code.startsWith('CAEC') || 
                  sub.code.startsWith('CAMG') || sub.code.startsWith('CAIN') || 
                  sub.code.startsWith('CAOR')
                  
    if (isNew && sem.visibleNew === false) return false
    if (isOld && sem.visibleOld === false) return false
    return true
  })
  const subjectsCount = visibleSubjects.length

  const subjectsWithBooks = sem.subjects.map((sub: any) => {
    const linked = sub.linkedSubject
    
    // Direct materials
    let notes = [...sub.notes]
    let pastPapers = [...sub.pastPapers]
    let cheatsheets = [...sub.cheatsheets]
    let mcqs = [...(sub.mcqs || [])]
    let directBooks = solutionBooks.filter((b: any) => b.subjectId === sub.id)

    // Blend linked materials if sharing flags are true
    if (linked) {
      if (linked.notes) {
        const filteredLinkedNotes = linked.notes.filter((n: any) => {
          if (n.noteType === 'LAB_WORK') return sub.linkIncludeLabWork !== false
          if (n.noteType === 'PROJECT_WORK') return sub.linkIncludeProjectWork !== false
          if (n.noteType === 'PROJECT') return sub.linkIncludeProjects !== false
          if (n.noteType === 'GUIDE') return sub.linkIncludeGuides !== false
          if (n.noteType === 'SYLLABUS') return sub.linkIncludeSyllabus !== false
          return sub.linkIncludeNotes !== false
        }).map((n: any) => ({ ...n, isFromOldSyllabus: true }))

        notes = [...notes, ...filteredLinkedNotes]
      }

      if (sub.linkIncludeCheatsheets !== false && linked.cheatsheets) {
        const linkedCheatsheets = linked.cheatsheets.map((c: any) => ({ ...c, isFromOldSyllabus: true }))
        cheatsheets = [...cheatsheets, ...linkedCheatsheets]
      }
      if (sub.linkIncludePastPapers !== false && linked.pastPapers) {
        const linkedPapers = linked.pastPapers.map((p: any) => ({ ...p, isFromOldSyllabus: true }))
        pastPapers = [...pastPapers, ...linkedPapers]
      }
      if (sub.linkIncludeMCQs !== false && linked.mcqs) {
        const linkedMcqs = linked.mcqs.map((m: any) => ({ ...m, isFromOldSyllabus: true }))
        mcqs = [...mcqs, ...linkedMcqs]
      }
      if (sub.linkIncludeBooks !== false && linked.solutionBooks) {
        const linkedBooks = linked.solutionBooks.map((b: any) => ({ ...b, isFromOldSyllabus: true }))
        directBooks = [...directBooks, ...linkedBooks]
      }
    }

    return {
      ...sub,
      notes,
      pastPapers,
      cheatsheets,
      mcqs,
      solutionBooks: directBooks
    }
  })

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
              {subjectsCount} Subject{subjectsCount !== 1 ? 's' : ''} • {faculty.name}
            </p>
          </div>
        </div>
      </div>

      {/* Top Banner Ad */}
      <AdUnit type="leaderboard" slot="semester-top-banner" />

      {/* Subjects List with Syllabus Filter */}
      <SemesterSubjectFilter
        subjects={subjectsWithBooks as any}
        semesterGuides={semesterGuides as any}
        facultyId={faculty.id}
        semesterOrder={order}
        systemType={faculty.systemType}
        visibleNew={sem.visibleNew}
        visibleOld={sem.visibleOld}
      />

      {/* Bottom Ad Unit */}
      <div style={{ marginTop: '24px' }}>
        <AdUnit type="large-rectangle" slot="semester-bottom-ad" />
      </div>
    </div>
  )
}
