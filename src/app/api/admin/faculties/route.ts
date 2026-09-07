// src/app/api/admin/faculties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const faculties = await prisma.faculty.findMany({
    orderBy: [
      { visible: 'desc' },
      { name: 'asc' },
    ],
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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, icon } = await req.json()
    if (!name || !icon) {
      return NextResponse.json({ error: 'Name and icon are required' }, { status: 400 })
    }

    // Generate a simple ID from name (e.g., 'B.Sc. CSIT' -> 'bsc-csit')
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const existing = await prisma.faculty.findUnique({ where: { id } })
    if (existing) {
      return NextResponse.json({ error: 'A faculty with a similar name already exists' }, { status: 400 })
    }

    const faculty = await prisma.faculty.create({
      data: {
        id,
        name,
        icon,
        slug: id,
        visible: true,
      },
    })

    return NextResponse.json({ faculty, message: 'Faculty created successfully! 🎉' })
  } catch (error) {
    console.error('[FACULTY_POST]', error)
    return NextResponse.json({ error: 'Failed to create faculty' }, { status: 500 })
  }
}
