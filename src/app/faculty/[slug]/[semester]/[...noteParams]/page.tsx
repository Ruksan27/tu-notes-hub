// src/app/faculty/[slug]/[semester]/[...noteParams]/page.tsx
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugs'
import McqPracticeClient from '@/app/mcq/[subjectId]/McqPracticeClient'
import DownloadPage from '@/app/download/[noteId]/page'

const KNOWN_TYPES = ['cheatsheet', 'past-paper', 'note', 'mcq', 'notes', 'lab-work', 'project-work', 'projects', 'books', 'question-paper', 'solution-book', 'syllabus', 'guides', 'pdf-books']

interface Props {
  params: Promise<{
    slug: string
    semester: string
    noteParams: string[]
  }>
}

async function resolveSubject(slug: string, semesterStr: string, noteParams: string[]) {
  const match = semesterStr.match(/\d+/)
  const semesterOrder = match ? parseInt(match[0], 10) : 1
  const subjectSlug = noteParams.length >= 2 ? noteParams[0] : ''

  const semester = await prisma.semester.findFirst({
    where: {
      facultyId: slug.toLowerCase(),
      order: semesterOrder,
    },
    include: {
      faculty: true,
      subjects: {
        include: {
          mcqs: { orderBy: { createdAt: 'asc' } },
          semester: { include: { faculty: true } }
        }
      }
    }
  })

  if (!semester || !semester.subjects.length) {
    const allSubjects = await prisma.subject.findMany({
      include: {
        mcqs: { orderBy: { createdAt: 'asc' } },
        semester: { include: { faculty: true } }
      }
    })
    return allSubjects.find(s => 
      slugify(s.title) === subjectSlug || 
      slugify(s.code) === subjectSlug || 
      s.id === subjectSlug
    ) || null
  }

  const subjects = semester.subjects
  if (!subjectSlug) return subjects[0] || null

  const target = subjects.find(s => 
    slugify(s.title) === subjectSlug || 
    slugify(s.code) === subjectSlug || 
    s.id === subjectSlug
  )

  if (target) return target

  const partial = subjects.find(s => 
    slugify(s.title).includes(subjectSlug) || 
    subjectSlug.includes(slugify(s.title))
  )

  return partial || subjects[0] || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, semester, noteParams } = await params
  const isMcq = Array.isArray(noteParams) && noteParams[noteParams.length - 1] === 'mcq'

  if (isMcq) {
    const subject = await resolveSubject(slug, semester, noteParams)
    if (subject) {
      const cleanTitle = subject.title
        .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
        .replace(/\s*(old syllabus|new syllabus)/gi, '')
        .trim()
      const facultyName = subject.semester?.faculty?.name || slug.toUpperCase()
      const semName = subject.semester?.name 
        ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) 
        : `${semester}`
      
      const years = Array.from(new Set((subject.mcqs || []).map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
      const yearsText = years.length > 0 ? `(${years.join(', ')} Board Exam)` : ''

      const title = `TU ${facultyName} ${semName} ${cleanTitle} (${subject.code}) MCQs with Answers ${yearsText} — TU Notes Hub`
      const description = `Official Tribhuvan University (TU) ${facultyName} ${semName} ${cleanTitle} (${subject.code}) past paper MCQs ${yearsText} with verified answers, explanations, and free PDF download.`
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'
      const canonicalUrl = `${baseUrl}/faculty/${slug}/${semester}/${slugify(subject.title) || slugify(subject.code)}/mcq`

      return {
        title,
        description,
        keywords: [
          `TU ${cleanTitle} MCQs`,
          `${facultyName} ${semName} MCQs`,
          `${cleanTitle} ${subject.code} past paper MCQs`,
          `TU ${subject.code} solved MCQs`,
          `${cleanTitle} multiple choice questions with answers`,
          `Tribhuvan University ${cleanTitle} ${yearsText}`,
          `TU Notes Hub MCQs`
        ],
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title,
          description,
          url: canonicalUrl,
          siteName: 'TU Notes Hub',
          type: 'article',
          images: [
            {
              url: `${baseUrl}/og-image.png`,
              width: 1200,
              height: 630,
              alt: `${cleanTitle} (${subject.code}) MCQs — TU Notes Hub`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [`${baseUrl}/og-image.png`],
          site: '@tunoteshub',
        },
      }
    }
  }

  const subject = await resolveSubject(slug, semester, noteParams)
  if (subject) {
    const cleanTitle = subject.title
      .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
      .replace(/\s*(old syllabus|new syllabus)/gi, '')
      .trim()
    const facultyName = subject.semester?.faculty?.name || slug.toUpperCase()
    const semName = subject.semester?.name 
      ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) 
      : `${semester}`

    const lastSeg = Array.isArray(noteParams) ? noteParams[noteParams.length - 1] : ''
    let typeLabel = 'Study Notes & Materials'
    let keywordLabel = 'study notes'

    if (lastSeg === 'lab-work') { typeLabel = 'Lab Reports & Practical Works'; keywordLabel = 'lab reports' }
    else if (lastSeg === 'project-work') { typeLabel = 'Project Work Reports & Documentation'; keywordLabel = 'project works' }
    else if (lastSeg === 'projects') { typeLabel = 'Projects & Source Code'; keywordLabel = 'projects' }
    else if (lastSeg === 'books' || lastSeg === 'guides') { typeLabel = 'Exam Guides'; keywordLabel = 'guides' }
    else if (lastSeg === 'pdf-books') { typeLabel = 'Reference Books'; keywordLabel = 'books' }
    else if (lastSeg === 'syllabus') { typeLabel = 'Official Course Syllabus'; keywordLabel = 'syllabus' }
    else if (lastSeg === 'question-paper' || lastSeg === 'past-paper') { typeLabel = 'Past Question Papers'; keywordLabel = 'past paper questions' }
    else if (lastSeg === 'cheatsheet') { typeLabel = 'Exam Revision Cheatsheet'; keywordLabel = 'cheatsheet' }
    else if (lastSeg === 'solution-book') { typeLabel = 'Solution Book'; keywordLabel = 'solution book' }

    const title = `TU ${facultyName} ${semName} ${cleanTitle} (${subject.code}) ${typeLabel} PDF — TU Notes Hub`
    const description = `Download official Tribhuvan University (TU) ${facultyName} ${semName} ${cleanTitle} (${subject.code}) ${keywordLabel} PDF, exam guides, lab solutions, and project reports for free on TU Notes Hub.`
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'
    const canonicalUrl = `${baseUrl}/faculty/${slug}/${semester}/${slugify(subject.title) || slugify(subject.code)}/${lastSeg || 'notes'}`

    return {
      title,
      description,
      keywords: [
        `TU ${cleanTitle} ${typeLabel}`,
        `${facultyName} ${semName} ${cleanTitle} ${keywordLabel}`,
        `TU ${subject.code} ${keywordLabel} PDF`,
        `Tribhuvan University ${cleanTitle} ${subject.code}`,
        `TU Notes Hub ${cleanTitle}`
      ],
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'TU Notes Hub',
        type: 'article',
      },
    }
  }

  return {
    title: 'Download Study Material | TU Notes Hub',
    description: 'Download verified Tribhuvan University study notes, past papers, and solutions.',
  }
}

export default async function DynamicNoteOrMcqPage({ params }: Props) {
  const resolvedParams = await params
  const { slug, semester, noteParams } = resolvedParams
  const isMcq = Array.isArray(noteParams) && noteParams[noteParams.length - 1] === 'mcq'

  if (isMcq) {
    const subject = await resolveSubject(slug, semester, noteParams)
    if (!subject) {
      notFound()
    }

    const cleanTitle = subject.title
      .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
      .replace(/\s*(old syllabus|new syllabus)/gi, '')
      .trim()

    const semName = subject.semester?.name 
      ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) 
      : `${semester}`
    const facultyName = subject.semester?.faculty?.name || slug.toUpperCase()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'
    const canonicalUrl = `${baseUrl}/faculty/${slug}/${semester}/${slugify(subject.title) || slugify(subject.code)}/mcq`

    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: `TU ${facultyName} ${semName} ${cleanTitle} (${subject.code}) MCQs`,
      description: `Official Tribhuvan University past paper multiple choice questions with verified answers and explanations for ${cleanTitle} (${subject.code}).`,
      mainEntity: (subject.mcqs || []).slice(0, 15).map((m) => ({
        '@type': 'Question',
        name: m.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Correct Answer: ${Array.isArray(m.options) ? (m.options as string[])[m.correctOption] : 'Option ' + (m.correctOption + 1)}. ${m.explanation || ''}`
        }
      }))
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: facultyName,
          item: `${baseUrl}/faculties`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: semName,
          item: `${baseUrl}/faculties`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: `${cleanTitle} (${subject.code}) MCQs`,
          item: canonicalUrl,
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <McqPracticeClient initialSubject={subject as any} />
      </>
    )
  }

  const noteParamsArr = noteParams || []
  if (noteParamsArr.length === 2 && KNOWN_TYPES.includes(noteParamsArr[1] as any) && noteParamsArr[1] !== 'mcq') {
    redirect(`/faculty/${slug}/${semester}`)
  }

  return <DownloadPage />
}
