// src/app/api/notes/[noteId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractProjectId, slugify, getPaperSlug, getNoteSlug } from '@/lib/slugs'
import { fixCloudinaryUrl } from '@/lib/utils'

function buildCheatsheetResponse(cs: any) {
  const rawFiles = Array.isArray(cs.files) ? (cs.files as any[]) : []
  const filesArr = rawFiles.map((f: any) =>
    typeof f === 'object' && f?.url ? { ...f, url: fixCloudinaryUrl(f.url) } : f
  )
  const firstFileUrl =
    filesArr.length > 0 ? (typeof filesArr[0] === 'string' ? filesArr[0] : filesArr[0].url) : ''
  return NextResponse.json({
    id: cs.id,
    title: cs.title,
    content: cs.content || null,
    files: filesArr,
    cloudinaryUrl: fixCloudinaryUrl(firstFileUrl) || '',
    subject: cs.subject,
    isCheatsheet: true,
  })
}

function buildPaperResponse(paper: any) {
  const facCode = paper.subject?.semester?.faculty?.id?.toUpperCase() || 'TU'
  const semName = paper.subject?.semester?.name
    ? paper.subject.semester.name.toLowerCase().includes('semester')
      ? paper.subject.semester.name
      : `${paper.subject.semester.name} Semester`
    : paper.subject?.semester?.order
    ? `${paper.subject.semester.order}th Semester`
    : ''
  const examText = paper.examType ? paper.examType.replace(/_/g, ' ') : 'BOARD EXAM'
  const yearText = `${paper.year} ${examText}`
  const cleanSubTitle = paper.subject?.title
    ? paper.subject.title.replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '').trim()
    : 'Question Paper'
  const title = [`TU ${facCode}`, semName, yearText, `${cleanSubTitle} Question Paper`]
    .filter(Boolean)
    .join(' — ')
  return NextResponse.json({
    id: paper.id,
    title,
    year: paper.year,
    examType: paper.examType,
    subject: paper.subject,
    cloudinaryUrl: paper.cloudinaryUrl,
    extractedText: paper.extractedText || null,
    isPastPaper: true,
  })
}

const subjectInclude = { subject: { include: { semester: { include: { faculty: true } } } } }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId: rawNoteId } = await params
  const noteId = extractProjectId(rawNoteId)

  // ?type hint from the URL structure — when the URL contains /cheatsheet/ or /past-paper/
  // we skip irrelevant DB lookups to avoid false positives from loose slug matching.
  const typeHint = new URL(_req.url).searchParams.get('type') || ''
  const cleanRaw = rawNoteId.replace(/-notes$/, '')

  // ── When type=cheatsheet jump directly to cheatsheet lookups ──
  if (typeHint === 'cheatsheet') {
    // Direct ID
    const cs = await prisma.cheatsheet.findUnique({ where: { id: noteId }, include: subjectInclude })
    if (cs) return buildCheatsheetResponse(cs)

    // Slug lookup
    const all = await prisma.cheatsheet.findMany({ include: subjectInclude })
    const matched = all.find((c) => {
      const titleSlug = slugify(c.title || '')
      const subTitleSlug = slugify(`${c.subject?.title || ''} ${c.title || ''}`)
      const subCodeSlug = c.subject?.code ? slugify(`${c.subject.code} ${c.title || ''}`) : ''
      return (
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
    if (matched) return buildCheatsheetResponse(matched)
    return NextResponse.json({ error: 'Cheatsheet not found' }, { status: 404 })
  }

  // ── When type=past-paper jump directly to past paper lookups ──
  if (typeHint === 'past-paper') {
    const paper = await prisma.pastPaper.findUnique({ where: { id: noteId }, include: subjectInclude })
    if (paper) return buildPaperResponse(paper)

    const allPapers = await prisma.pastPaper.findMany({ include: subjectInclude })
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
    if (matchedPaper) return buildPaperResponse(matchedPaper)
    return NextResponse.json({ error: 'Past paper not found' }, { status: 404 })
  }

  // ── Default: try all types in order ──

  // 1. Direct ID lookup for Note
  const note = await prisma.note.findFirst({
    where: { id: noteId, status: { not: 'REJECTED' } },
    include: subjectInclude,
  })
  if (note) {
    await prisma.note.update({ where: { id: note.id }, data: { downloadCount: { increment: 1 } } })
    return NextResponse.json(note)
  }

  // 2. Direct ID lookup for Past Paper
  const paper = await prisma.pastPaper.findUnique({ where: { id: noteId }, include: subjectInclude })
  if (paper) return buildPaperResponse(paper)

  // 3. Direct ID lookup for Cheatsheet
  const cheatsheet = await prisma.cheatsheet.findUnique({ where: { id: noteId }, include: subjectInclude })
  if (cheatsheet) return buildCheatsheetResponse(cheatsheet)

  // 4. Slug lookup for Notes
  const allNotes = await prisma.note.findMany({
    where: { status: { not: 'REJECTED' } },
    include: subjectInclude
  })
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

  // 5. Slug lookup for Past Papers
  const allPapers = await prisma.pastPaper.findMany({ include: subjectInclude })
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
  if (matchedPaper) return buildPaperResponse(matchedPaper)

  // 6. Slug lookup for Cheatsheets
  const allCheatsheets = await prisma.cheatsheet.findMany({ include: subjectInclude })
  const matchedCs = allCheatsheets.find((cs) => {
    const titleSlug = slugify(cs.title || '')
    const subTitleSlug = slugify(`${cs.subject?.title || ''} ${cs.title || ''}`)
    const subCodeSlug = cs.subject?.code ? slugify(`${cs.subject.code} ${cs.title || ''}`) : ''
    return (
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
  if (matchedCs) return buildCheatsheetResponse(matchedCs)

  return NextResponse.json({ error: 'Document not found' }, { status: 404 })
}
