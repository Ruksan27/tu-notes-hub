// src/app/api/admin/projects/check/route.ts
// Returns existing project count for a given subject (used for BCA project restrictions)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// BCA project-restricted semesters: only 1 project allowed per subject
const BCA_PROJECT_RESTRICTED_SEMS = [4, 5, 7]

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subjectId = req.nextUrl.searchParams.get('subjectId')
    if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 })

    // Find subject with its semester and faculty to check restriction rules
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        semester: {
          include: { faculty: true }
        },
        notes: {
          where: { noteType: 'PROJECT' },
          select: { id: true, title: true }
        }
      }
    })

    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

    const facultyId = subject.semester.facultyId
    const semOrder = subject.semester.order

    const isRestricted =
      facultyId === 'bca' && BCA_PROJECT_RESTRICTED_SEMS.includes(semOrder)

    const projectCount = subject.notes.length
    const existingProjects = subject.notes

    return NextResponse.json({
      facultyId,
      semesterOrder: semOrder,
      isRestricted,
      maxProjects: isRestricted ? 1 : null,
      projectCount,
      existingProjects,
      canUpload: !isRestricted || projectCount < 1
    })
  } catch (error) {
    console.error('[PROJECT_CHECK]', error)
    return NextResponse.json({ error: 'Failed to check project restrictions' }, { status: 500 })
  }
}
