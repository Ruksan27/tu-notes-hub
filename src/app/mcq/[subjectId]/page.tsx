import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
  const semName = subject.semester?.name ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) : (subject.semester?.order ? `${subject.semester.order}th Semester` : '5th Semester')
  
  const years = Array.from(new Set(subject.mcqs.map(m => m.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))
  const yearsText = years.length > 0 ? `(${years.join(', ')})` : ''

  const title = `${cleanTitle} (${subject.code}) MCQs with Answers & Solutions | ${semName} ${facultyName} — TU Notes Hub`
  const description = `Practice past year multiple choice questions (MCQs) for ${cleanTitle} (${subject.code}), ${semName}, ${facultyName} Tribhuvan University ${yearsText}. Verified answers with step-by-step explanations and PDF download.`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.me'
  const url = `${baseUrl}/mcq/${subject.id}`

  return {
    title,
    description,
    keywords: [
      `${cleanTitle} MCQs`,
      `${subject.code} MCQs`,
      `TU ${cleanTitle} questions`,
      `${semName} MCQs`,
      `${facultyName} MCQs`,
      `Tribhuvan University ${cleanTitle} MCQ answers`,
      `TU Notes Hub MCQs`
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'TU Notes Hub',
      type: 'article',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${cleanTitle} MCQs — TU Notes Hub`,
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

  const semName = subject.semester?.name ? (subject.semester.name.toLowerCase().includes('semester') ? subject.semester.name : `${subject.semester.name} Semester`) : (subject.semester?.order ? `${subject.semester.order}th Semester` : '5th Semester')
  const facultyName = subject.semester?.faculty?.name || 'Bachelor in Computer Application (BCA)'

  // Schema.org FAQ / Quiz Structured Data for Google Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${cleanTitle} (${subject.code}) MCQs — ${semName}`,
    description: `Official Tribhuvan University multiple choice questions with answers for ${cleanTitle} (${subject.code}).`,
    mainEntity: (subject.mcqs || []).slice(0, 10).map((m) => ({
      '@type': 'Question',
      name: m.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Correct Answer: ${Array.isArray(m.options) ? m.options[m.correctOption] : 'Option ' + (m.correctOption + 1)}. ${m.explanation || ''}`
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <McqPracticeClient initialSubject={subject as any} />
    </>
  )
}
