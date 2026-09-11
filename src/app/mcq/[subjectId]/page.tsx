import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { slugify, getSemesterPath } from '@/lib/slugs'
import McqPracticeClient from './McqPracticeClient'

interface Props {
  params: Promise<{ subjectId: string }>
}

async function getSubjectData(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        mcqs: { orderBy: { createdAt: 'asc' } },
        semester: { include: { faculty: true } }
      }
    })
    return subject
  } catch (error) {
    console.error('[MCQ_PAGE_FETCH]', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params
  const subject = await getSubjectData(subjectId)

  if (!subject) {
    return {
      title: 'MCQs Not Found | TU Notes Hub',
      description: 'The requested multiple choice questions could not be found.',
    }
  }

  const cleanTitle = subject.title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()

  const facultyName = subject.semester?.faculty?.name || 'Bachelor in Computer Application (BCA)'
  const semName = subject.semester?.name 
    ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) 
    : (subject.semester?.order ? `${subject.semester.order}th Semester` : '5th Semester')
  
  const years = Array.from(new Set(subject.mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
  const yearsText = years.length > 0 ? `(${years.join(', ')} Board Exam)` : ''

  const title = `TU ${facultyName} ${semName} ${cleanTitle} (${subject.code}) MCQs with Answers ${yearsText} — TU Notes Hub`
  const description = `Official Tribhuvan University (TU) ${facultyName} ${semName} ${cleanTitle} (${subject.code}) past paper MCQs ${yearsText} with verified answers, explanations, and free PDF download.`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'
  const semPath = getSemesterPath(
    subject.semester?.facultyId,
    subject.semester?.order,
    subject.semester?.faculty?.systemType
  )
  const canonicalUrl = semPath
    ? `${baseUrl}${semPath}/${slugify(subject.title) || slugify(subject.code)}/mcq`
    : `${baseUrl}/mcq/${subject.id}`

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

export default async function McqPage({ params }: Props) {
  const { subjectId } = await params
  const subject = await getSubjectData(subjectId)

  if (!subject) {
    notFound()
  }

  const cleanTitle = subject.title
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .replace(/\s*(old syllabus|new syllabus)/gi, '')
    .trim()

  const semName = subject.semester?.name 
    ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) 
    : (subject.semester?.order ? `${subject.semester.order}th Semester` : '5th Semester')
  const facultyName = subject.semester?.faculty?.name || 'Bachelor in Computer Application (BCA)'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'

  // Structured Data (FAQPage + BreadcrumbList) for maximum Google SEO Rich Snippets
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
        text: `Correct Answer: ${Array.isArray(m.options) ? m.options[m.correctOption] : 'Option ' + (m.correctOption + 1)}. ${m.explanation || ''}`
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
        item: `${baseUrl}/mcq/${subject.id}`,
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
