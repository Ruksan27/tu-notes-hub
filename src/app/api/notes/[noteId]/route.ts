// src/app/api/notes/[noteId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params

  // 1. Check if it's a Note
  const note = await prisma.note.findUnique({ where: { id: noteId } })
  if (note) {
    await prisma.note.update({ where: { id: noteId }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(note)
  }

  // 2. Check if it's a Past Paper
  const paper = await prisma.pastPaper.findUnique({
    where: { id: noteId },
    include: { subject: true }
  })
  if (paper) {
    return NextResponse.json({
      title: `${paper.year} ${paper.examType.replace('_', ' ')} — ${paper.subject.title}`,
      cloudinaryUrl: paper.cloudinaryUrl
    })
  }

  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
}
