// src/app/api/student/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        packageType: true,
        role: true,
        facultyId: true,
        semesterOrder: true,
        courseType: true,
        sellerProfile: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!dbUser.facultyId || !dbUser.semesterOrder) {
      return NextResponse.json({
        user: dbUser,
        message: 'Please complete your profile selection in settings',
        subjects: [],
      })
    }

    // Find the faculty details
    const faculty = await prisma.faculty.findUnique({
      where: { id: dbUser.facultyId },
    })

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 })
    }

    // Find the semester belonging to this faculty at the user's semesterOrder
    const semester = await prisma.semester.findFirst({
      where: {
        facultyId: dbUser.facultyId,
        order: dbUser.semesterOrder,
      },
      include: {
        subjects: {
          include: {
            notes: {
              where: { status: { not: 'REJECTED' } },
              orderBy: { createdAt: 'desc' },
            },
            pastPapers: {
              orderBy: { year: 'desc' },
            },
            cheatsheets: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    // Filter subjects based on semester.visibleNew, semester.visibleOld and dbUser.courseType
    const visibleNew = semester?.visibleNew !== false
    const visibleOld = semester?.visibleOld !== false

    let subjectsToReturn = semester?.subjects || []

    subjectsToReturn = subjectsToReturn.filter(sub => {
      const titleLower = sub.title.toLowerCase()
      const codeUpper = sub.code.toUpperCase()

      const isNew =
        titleLower.includes('new syllabus') ||
        titleLower.includes('(new') ||
        titleLower.includes('[new') ||
        codeUpper.startsWith('BCA ')

      const isOld =
        titleLower.includes('old syllabus') ||
        titleLower.includes('(old') ||
        titleLower.includes('[old') ||
        codeUpper.startsWith('CACS') ||
        codeUpper.startsWith('CAMT') ||
        codeUpper.startsWith('CASO') ||
        codeUpper.startsWith('CAEN') ||
        codeUpper.startsWith('CAAC') ||
        codeUpper.startsWith('CAST') ||
        codeUpper.startsWith('CAPJ') ||
        codeUpper.startsWith('CAEC') ||
        codeUpper.startsWith('CAMG') ||
        codeUpper.startsWith('CAIN') ||
        codeUpper.startsWith('CAOR')

      // 1. Admin visibility settings for this semester take top priority
      if (isNew && !visibleNew) return false
      if (isOld && !visibleOld) return false

      // 2. If both syllabi are active for this semester, filter by user's courseType preference
      if (visibleNew && visibleOld) {
        if (dbUser.courseType === 'OLD' && isNew) return false
        if (dbUser.courseType === 'NEW' && isOld) return false
      }

      return true
    })

    return NextResponse.json({
      user: dbUser,
      faculty,
      semesterName: semester?.name || `${dbUser.semesterOrder}th period`,
      subjects: subjectsToReturn,
    })
  } catch (error) {
    console.error('[STUDENT_DASHBOARD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
