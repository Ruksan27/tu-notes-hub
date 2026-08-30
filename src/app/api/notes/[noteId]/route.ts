import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractProjectId, slugify, getPaperSlug, getNoteSlug } from '@/lib/slugs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId: rawNoteId } = await params
  const noteId = extractProjectId(rawNoteId)

  // 1. Direct ID lookup for Note
  const note = await prisma.note.findUnique({ where: { id: noteId } })
  if (note) {
    await prisma.note.update({ where: { id: note.id }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(note)
  }

  // 2. Direct ID lookup for Past Paper
  const paper = await prisma.pastPaper.findUnique({
    where: { id: noteId },
    include: { subject: true }
  })
  if (paper) {
    return NextResponse.json({
      title: `${paper.year} ${paper.examType.replace('_', ' ')} — ${paper.subject.title}`,
      cloudinaryUrl: paper.cloudinaryUrl,
      extractedText: paper.extractedText || null
    })
  }

  // 3. Slug lookup for Notes
  const allNotes = await prisma.note.findMany()
  const matchedNote = allNotes.find(n => getNoteSlug(n) === rawNoteId || slugify(n.title) === rawNoteId)
  if (matchedNote) {
    await prisma.note.update({ where: { id: matchedNote.id }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(matchedNote)
  }

  // 4. Slug lookup for Past Papers
  const allPapers = await prisma.pastPaper.findMany({ include: { subject: true } })
  const matchedPaper = allPapers.find(p => getPaperSlug(p) === rawNoteId)
  if (matchedPaper) {
    return NextResponse.json({
      title: `${matchedPaper.year} ${matchedPaper.examType.replace('_', ' ')} — ${matchedPaper.subject.title}`,
      cloudinaryUrl: matchedPaper.cloudinaryUrl,
      extractedText: matchedPaper.extractedText || null
    })
  }

  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
}
