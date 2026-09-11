// src/app/api/notes/[noteId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractProjectId, slugify, getPaperSlug, getNoteSlug } from '@/lib/slugs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId: rawNoteId } = await params
  const noteId = extractProjectId(rawNoteId)

  // 1. Direct ID lookup for Note
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      subject: {
        include: {
          semester: {
            include: { faculty: true }
          }
        }
      }
    }
  })
  if (note) {
    await prisma.note.update({ where: { id: note.id }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(note)
  }

  // 2. Direct ID lookup for Past Paper
  const paper = await prisma.pastPaper.findUnique({
    where: { id: noteId },
    include: {
      subject: {
        include: {
          semester: {
            include: { faculty: true }
          }
        }
      }
    }
  })
  if (paper) {
    const facCode = paper.subject?.semester?.faculty?.id?.toUpperCase() || 'TU'
    const semName = paper.subject?.semester?.name
      ? (paper.subject.semester.name.toLowerCase().includes('semester') ? paper.subject.semester.name : `${paper.subject.semester.name} Semester`)
      : (paper.subject?.semester?.order ? `${paper.subject.semester.order}th Semester` : '')
    const examText = paper.examType ? paper.examType.replace(/_/g, ' ') : 'BOARD EXAM'
    const yearText = `${paper.year} ${examText}`
    const cleanSubTitle = paper.subject?.title
      ? paper.subject.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()
      : 'Question Paper'

    const title = [
      `TU ${facCode}`,
      semName,
      yearText,
      `${cleanSubTitle} Question Paper`
    ].filter(Boolean).join(' — ')

    return NextResponse.json({
      id: paper.id,
      title,
      year: paper.year,
      examType: paper.examType,
      subject: paper.subject,
      cloudinaryUrl: paper.cloudinaryUrl,
      extractedText: paper.extractedText || null,
      isPastPaper: true
    })
  }

  // 3. Robust Bulletproof Slug lookup for Notes
  const allNotes = await prisma.note.findMany({
    include: { subject: { include: { semester: { include: { faculty: true } } } } }
  })
  const cleanRaw = rawNoteId.replace(/-notes$/, '')

  const matchedNote = allNotes.find((n) => {
    const fullSlug = getNoteSlug(n)
    const titleSlug = slugify(n.title || '')
    const subTitleSlug = slugify(`${n.subject?.title || ''} ${n.title || ''}`)
    const subCodeSlug = n.subject?.code ? slugify(`${n.subject.code} ${n.title || ''}`) : ''

    return (
      fullSlug === rawNoteId ||
      titleSlug === rawNoteId ||
      titleSlug === cleanRaw ||
      subTitleSlug === rawNoteId ||
      subTitleSlug === cleanRaw ||
      subCodeSlug === rawNoteId ||
      subCodeSlug === cleanRaw ||
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
    const subCodeSlug = p.subject?.code ? slugify(`${p.subject.code} ${p.year} ${p.examType}`) : ''
    return (
      fullSlug === rawNoteId ||
      subTitleSlug === rawNoteId ||
      subCodeSlug === rawNoteId ||
      (p.subject?.title && rawNoteId.includes(slugify(p.subject.title)) && rawNoteId.includes(String(p.year))) ||
      (p.subject?.code && rawNoteId.includes(slugify(p.subject.code)) && rawNoteId.includes(String(p.year)))
    )
  })

  if (matchedPaper) {
    const facCode = matchedPaper.subject?.semester?.faculty?.id?.toUpperCase() || 'TU'
    const semName = matchedPaper.subject?.semester?.name
      ? (matchedPaper.subject.semester.name.toLowerCase().includes('semester') ? matchedPaper.subject.semester.name : `${matchedPaper.subject.semester.name} Semester`)
      : (matchedPaper.subject?.semester?.order ? `${matchedPaper.subject.semester.order}th Semester` : '')
    const examText = matchedPaper.examType ? matchedPaper.examType.replace(/_/g, ' ') : 'BOARD EXAM'
    const yearText = `${matchedPaper.year} ${examText}`
    const cleanSubTitle = matchedPaper.subject?.title
      ? matchedPaper.subject.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()
      : 'Question Paper'

    const title = [
      `TU ${facCode}`,
      semName,
      yearText,
      `${cleanSubTitle} Question Paper`
    ].filter(Boolean).join(' — ')

    return NextResponse.json({
      id: matchedPaper.id,
      title,
      year: matchedPaper.year,
      examType: matchedPaper.examType,
      subject: matchedPaper.subject,
      cloudinaryUrl: matchedPaper.cloudinaryUrl,
      extractedText: matchedPaper.extractedText || null,
      isPastPaper: true
    })
  }

  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
}
