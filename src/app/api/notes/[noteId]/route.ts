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

  // 3. Robust Bulletproof Slug lookup for Notes (matches all URL variations)
  const allNotes = await prisma.note.findMany({
    include: { subject: { include: { semester: { include: { faculty: true } } } } }
  })
  const cleanRaw = rawNoteId.replace(/-notes$/, '')

  const matchedNote = allNotes.find((n) => {
    const fullSlug = getNoteSlug(n)
    const titleSlug = slugify(n.title || '')
    const subTitleSlug = slugify(`${n.subject?.title || ''} ${n.title || ''}`)

    return (
      fullSlug === rawNoteId ||
      titleSlug === rawNoteId ||
      titleSlug === cleanRaw ||
      subTitleSlug === rawNoteId ||
      subTitleSlug === cleanRaw ||
      (titleSlug.length > 2 && rawNoteId.includes(titleSlug)) ||
      (titleSlug.length > 2 && cleanRaw.includes(titleSlug))
    )
  })

  if (matchedNote) {
    await prisma.note.update({ where: { id: matchedNote.id }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(matchedNote)
  }

  // 4. Robust Bulletproof Slug lookup for Past Papers
  const allPapers = await prisma.pastPaper.findMany({
    include: { subject: { include: { semester: { include: { faculty: true } } } } }
  })
  const matchedPaper = allPapers.find((p) => {
    const fullSlug = getPaperSlug(p)
    const subTitleSlug = slugify(`${p.subject?.title || ''} ${p.year} ${p.examType}`)
    return (
      fullSlug === rawNoteId ||
      subTitleSlug === rawNoteId ||
      (p.subject?.title && rawNoteId.includes(slugify(p.subject.title)) && rawNoteId.includes(String(p.year)))
    )
  })

  if (matchedPaper) {
    return NextResponse.json({
      title: `${matchedPaper.year} ${matchedPaper.examType.replace('_', ' ')} — ${matchedPaper.subject.title}`,
      cloudinaryUrl: matchedPaper.cloudinaryUrl,
      extractedText: matchedPaper.extractedText || null
    })
  }

  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
}
