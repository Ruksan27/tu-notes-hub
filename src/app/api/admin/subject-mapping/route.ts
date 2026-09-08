// src/app/api/admin/subject-mapping/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch all subjects that are mapped/linked or available for mapping with detailed content counts
export async function GET(req: NextRequest) {
  try {
    const facultyId = req.nextUrl.searchParams.get('facultyId')
    const semesterId = req.nextUrl.searchParams.get('semesterId')

    const whereClause: any = {}
    if (semesterId) {
      whereClause.semesterId = semesterId
    } else if (facultyId) {
      whereClause.semester = { facultyId }
    }

    const subjectsRaw = await prisma.subject.findMany({
      where: whereClause,
      include: {
        semester: {
          include: {
            faculty: true,
          },
        },
        linkedSubject: {
          include: {
            semester: {
              include: {
                faculty: true,
              },
            },
            notes: {
              select: {
                id: true,
                noteType: true,
              },
            },
            cheatsheets: { select: { id: true } },
            pastPapers: { select: { id: true } },
            mcqs: { select: { id: true } },
            solutionBooks: { select: { id: true } },
          },
        },
        notes: {
          select: {
            id: true,
            noteType: true,
          },
        },
        cheatsheets: { select: { id: true } },
        pastPapers: { select: { id: true } },
        mcqs: { select: { id: true } },
        solutionBooks: { select: { id: true } },
      },
      orderBy: { code: 'asc' },
    })

    // Process counts breakdown for each subject
    const subjects = subjectsRaw.map((sub: any) => {
      const getBreakdown = (notes: any[], papers: any[], mcqsList: any[], books: any[], cheatsheetsList: any[]) => {
        const notesCount = notes.filter((n) => !['LAB_WORK', 'PROJECT_WORK', 'PROJECT', 'GUIDE', 'SYLLABUS'].includes(n.noteType)).length
        const labWorkCount = notes.filter((n) => n.noteType === 'LAB_WORK').length
        const projectWorkCount = notes.filter((n) => n.noteType === 'PROJECT_WORK').length
        const projectsCount = notes.filter((n) => n.noteType === 'PROJECT').length
        const guidesCount = notes.filter((n) => n.noteType === 'GUIDE').length
        const syllabusCount = notes.filter((n) => n.noteType === 'SYLLABUS').length

        return {
          notes: notesCount,
          labWork: labWorkCount,
          projectWork: projectWorkCount,
          projects: projectsCount,
          guides: guidesCount,
          syllabus: syllabusCount,
          pastPapers: papers.length,
          mcqs: mcqsList.length,
          solutionBooks: books.length,
          cheatsheets: cheatsheetsList.length,
          total: notes.length + papers.length + mcqsList.length + books.length + cheatsheetsList.length,
        }
      }

      const ownBreakdown = getBreakdown(
        sub.notes || [],
        sub.pastPapers || [],
        sub.mcqs || [],
        sub.solutionBooks || [],
        sub.cheatsheets || []
      )

      let linkedBreakdown = null
      if (sub.linkedSubject) {
        linkedBreakdown = getBreakdown(
          sub.linkedSubject.notes || [],
          sub.linkedSubject.pastPapers || [],
          sub.linkedSubject.mcqs || [],
          sub.linkedSubject.solutionBooks || [],
          sub.linkedSubject.cheatsheets || []
        )
      }

      return {
        ...sub,
        materialBreakdown: ownBreakdown,
        linkedSubject: sub.linkedSubject
          ? {
              ...sub.linkedSubject,
              materialBreakdown: linkedBreakdown,
            }
          : null,
      }
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('[GET_SUBJECT_MAPPING]', error)
    return NextResponse.json({ error: 'Failed to fetch subject mappings' }, { status: 500 })
  }
}

// POST: Link a target subject to a source subject (with content sharing flags and circular link prevention)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      targetSubjectId,
      sourceSubjectId,
      linkIncludeNotes = true,
      linkIncludeLabWork = true,
      linkIncludeProjectWork = true,
      linkIncludeProjects = true,
      linkIncludeGuides = true,
      linkIncludeSyllabus = true,
      linkIncludePastPapers = true,
      linkIncludeMCQs = true,
      linkIncludeBooks = true,
      linkIncludeCheatsheets = true,
    } = body

    if (!targetSubjectId) {
      return NextResponse.json({ error: 'Target subject ID is required' }, { status: 400 })
    }

    // 1. Self-link check
    if (sourceSubjectId && targetSubjectId === sourceSubjectId) {
      return NextResponse.json({ error: 'A subject cannot be linked to itself' }, { status: 400 })
    }

    // 2. Circular reference prevention (If sourceSubject is already linked to targetSubject)
    if (sourceSubjectId) {
      const sourceSub = await prisma.subject.findUnique({
        where: { id: sourceSubjectId },
        select: { linkedSubjectId: true },
      })

      if (sourceSub?.linkedSubjectId === targetSubjectId) {
        return NextResponse.json(
          { error: 'Circular reference detected: Target subject is already linked back to source subject!' },
          { status: 400 }
        )
      }
    }

    // 3. Update target subject link & flags
    const updatedSubject = await prisma.subject.update({
      where: { id: targetSubjectId },
      data: {
        linkedSubjectId: sourceSubjectId || null,
        linkIncludeNotes: Boolean(linkIncludeNotes),
        linkIncludeLabWork: Boolean(linkIncludeLabWork),
        linkIncludeProjectWork: Boolean(linkIncludeProjectWork),
        linkIncludeProjects: Boolean(linkIncludeProjects),
        linkIncludeGuides: Boolean(linkIncludeGuides),
        linkIncludeSyllabus: Boolean(linkIncludeSyllabus),
        linkIncludePastPapers: Boolean(linkIncludePastPapers),
        linkIncludeMCQs: Boolean(linkIncludeMCQs),
        linkIncludeBooks: Boolean(linkIncludeBooks),
        linkIncludeCheatsheets: Boolean(linkIncludeCheatsheets),
      },
      include: {
        linkedSubject: {
          include: {
            semester: true,
          },
        },
      },
    })

    return NextResponse.json({
      subject: updatedSubject,
      message: sourceSubjectId ? 'Subject successfully linked' : 'Subject link cleared',
    })
  } catch (error) {
    console.error('[POST_SUBJECT_MAPPING]', error)
    return NextResponse.json({ error: 'Failed to map subject' }, { status: 500 })
  }
}

// DELETE: Unlink a subject
export async function DELETE(req: NextRequest) {
  try {
    const targetSubjectId = req.nextUrl.searchParams.get('targetSubjectId')
    if (!targetSubjectId) {
      return NextResponse.json({ error: 'Target subject ID is required' }, { status: 400 })
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: targetSubjectId },
      data: {
        linkedSubjectId: null,
      },
    })

    return NextResponse.json({ subject: updatedSubject, message: 'Subject unlinked successfully' })
  } catch (error) {
    console.error('[DELETE_SUBJECT_MAPPING]', error)
    return NextResponse.json({ error: 'Failed to unlink subject' }, { status: 500 })
  }
}
