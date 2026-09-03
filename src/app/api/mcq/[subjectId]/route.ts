import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        mcqs: { orderBy: { createdAt: 'asc' } },
        semester: { include: { faculty: true } }
      }
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error('[MCQ API]', error)
    return NextResponse.json({ error: 'Failed to fetch MCQs' }, { status: 500 })
  }
}
