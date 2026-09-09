// src/app/api/admin/semesters/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const facultyId = req.nextUrl.searchParams.get('facultyId')
  if (!facultyId) return NextResponse.json({ semesters: [] })

  try {
    const semesters = await prisma.semester.findMany({
      where: { facultyId },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ semesters })
  } catch (err) {
    console.error('[SEMESTERS_GET]', err)
    return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { semesterId, visible, visibleNew, visibleOld } = await req.json()
    if (!semesterId) return NextResponse.json({ error: 'semesterId is required' }, { status: 400 })

    const updateData: any = {}
    if (visible !== undefined) updateData.visible = visible
    if (visibleNew !== undefined) updateData.visibleNew = visibleNew
    if (visibleOld !== undefined) updateData.visibleOld = visibleOld

    if (Object.keys(updateData).length > 0) {
      await prisma.semester.update({
        where: { id: semesterId },
        data: updateData
      })
    }

    return NextResponse.json({ success: true, message: 'Semester visibility updated' })
  } catch (error: any) {
    console.error('[SEMESTER_VISIBILITY_ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to update visibility' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await import('@/lib/auth').then(m => m.getCurrentUser())
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, order, facultyId } = await req.json()
    if (!name || !order || !facultyId) {
      return NextResponse.json({ error: 'Name, order, and facultyId are required' }, { status: 400 })
    }

    const semester = await prisma.semester.create({
      data: {
        name,
        order: parseInt(order),
        facultyId,
        visible: true,
        visibleNew: true,
        visibleOld: true,
      }
    })

    return NextResponse.json({ semester, message: 'Semester created successfully! 🎉' })
  } catch (error) {
    console.error('[SEMESTER_POST]', error)
    return NextResponse.json({ error: 'Failed to create semester' }, { status: 500 })
  }
}
