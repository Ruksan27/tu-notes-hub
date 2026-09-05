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

    // Filter subjects based on courseType
    let subjectsToReturn = semester?.subjects || []
    
    if (dbUser.courseType === 'OLD') {
      // For old course, exclude subjects that have "(New" in their title
      subjectsToReturn = subjectsToReturn.filter(sub => !sub.title.toLowerCase().includes('(new'))
    } else if (dbUser.courseType === 'NEW') {
      // For new course, exclude subjects that have "(Old" in their title
      subjectsToReturn = subjectsToReturn.filter(sub => !sub.title.toLowerCase().includes('(old'))
    }

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
