import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SolutionBookClientView from './SolutionBookClientView'
import { extractIdFromSlug } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params
  const id = extractIdFromSlug(rawId)
  const book = await prisma.solutionBook.findUnique({
    where: { id },
    include: { semester: { include: { faculty: true } } },
  })
  if (!book) return { title: 'Solution Book Not Found' }

  return {
    title: `${book.title} — TU ${book.semester.facultyId.toUpperCase()} Solution Book PDF | TU Notes Hub`,
    description: book.description || `Download free ${book.title} PDF solution book for TU ${book.semester.facultyId.toUpperCase()} ${book.semester.order} Semester.`,
  }
}

export default async function SolutionBookDownloadPage({ params }: Props) {
  const { id: rawId } = await params
  const id = extractIdFromSlug(rawId)
  const book = await prisma.solutionBook.findUnique({
    where: { id },
    include: {
      semester: {
        include: {
          faculty: true,
        },
      },
    },
  })

  if (!book) notFound()

  return <SolutionBookClientView book={book} />
}
