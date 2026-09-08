// src/app/api/admin/subject-mapping/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch all subjects that are mapped/linked or available for mapping
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

    const subjects = await prisma.subject.findMany({
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
            _count: {
              select: {
                notes: true,
                pastPapers: true,
                mcqs: true,
                solutionBooks: true,
              },
            },
          },
        },
        _count: {
          select: {
            notes: true,
            pastPapers: true,
            mcqs: true,
            solutionBooks: true,
          },
        },
      },
      orderBy: { code: 'asc' },
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
      linkIncludePastPapers = true,
      linkIncludeMCQs = true,
      linkIncludeBooks = true,
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
        linkIncludePastPapers: Boolean(linkIncludePastPapers),
        linkIncludeMCQs: Boolean(linkIncludeMCQs),
        linkIncludeBooks: Boolean(linkIncludeBooks),
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
