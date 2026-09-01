import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SolutionBookClientView from '@/app/download/book/[id]/SolutionBookClientView'
import { extractIdFromSlug, toSeoSlug } from '@/lib/utils'

interface Props {
  params: Promise<{
    slug: string
    semester: string
    bookId: string
  }>
}

async function findBookBySlugOrId(rawBookId: string) {
  const extractedId = extractIdFromSlug(rawBookId)
  
  // Try unique ID lookup first
  let book = await prisma.solutionBook.findUnique({
    where: { id: extractedId },
    include: { semester: { include: { faculty: true } } },
  })

  if (book) return book

  // Try title slug lookup across all solution books
  const allBooks = await prisma.solutionBook.findMany({
    include: { semester: { include: { faculty: true } } },
  })

  const targetSlug = rawBookId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  book = allBooks.find((b) => {
    const slug = toSeoSlug(b.title)
    return slug === targetSlug || b.id === rawBookId
  }) || null

  return book
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId: rawBookId } = await params
  const book = await findBookBySlugOrId(rawBookId)
  if (!book) return { title: 'Solution Book Not Found' }

  const facultyUpper = book.semester.facultyId.toUpperCase()
  const ord = book.semester.order === 1 ? '1st' : book.semester.order === 2 ? '2nd' : book.semester.order === 3 ? '3rd' : `${book.semester.order}th`

  return {
    title: `${book.title} — ${facultyUpper} ${ord} Semester Solution Book | TU Notes Hub`,
    description: book.description || `Read and study ${book.title} online for TU ${facultyUpper} ${ord} Semester on TU Notes Hub.`,
    openGraph: {
      title: `${book.title} — TU ${facultyUpper} ${ord} Semester Solution Book`,
      description: book.description || `Read ${book.title} online for TU ${facultyUpper} ${ord} Semester.`,
    },
  }
}

export default async function FacultySolutionBookPage({ params }: Props) {
  const { bookId: rawBookId } = await params
  const book = await findBookBySlugOrId(rawBookId)

  if (!book) notFound()

  return <SolutionBookClientView book={book} />
}
