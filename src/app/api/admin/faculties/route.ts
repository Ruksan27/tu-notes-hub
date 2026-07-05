// src/app/api/admin/faculties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: 'asc' },
    include: {
      semesters: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json({ faculties })
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { facultyId, visible } = await req.json()
    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 })
    }

    const faculty = await prisma.faculty.update({
      where: { id: facultyId },
      data: { visible: !!visible },
    })

    return NextResponse.json({ faculty, message: 'Faculty visibility updated successfully' })
  } catch (error) {
    console.error('[FACULTY_PUT]', error)
    return NextResponse.json({ error: 'Failed to update faculty visibility' }, { status: 500 })
  }
}
