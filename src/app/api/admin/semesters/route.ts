// src/app/api/admin/semesters/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Ensure visible, visibleNew, visibleOld columns exist in Semester table
async function ensureVisibleColumns() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Semester\` ADD COLUMN \`visible\` BOOLEAN NOT NULL DEFAULT true;`
    )
  } catch {}
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Semester\` ADD COLUMN \`visibleNew\` BOOLEAN NOT NULL DEFAULT true;`
    )
  } catch {}
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`Semester\` ADD COLUMN \`visibleOld\` BOOLEAN NOT NULL DEFAULT true;`
    )
  } catch {}
}

export async function GET(req: NextRequest) {
  await ensureVisibleColumns()
  const facultyId = req.nextUrl.searchParams.get('facultyId')
  if (!facultyId) return NextResponse.json({ semesters: [] })

  const semesters = await prisma.semester.findMany({
    where: { facultyId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ semesters })
}

export async function PUT(req: NextRequest) {
  await ensureVisibleColumns()
  try {
    const { semesterId, visible, visibleNew, visibleOld } = await req.json()
    if (!semesterId) return NextResponse.json({ error: 'semesterId is required' }, { status: 400 })

    const updateData: any = {}
    if (visible !== undefined) updateData.visible = Boolean(visible)
    if (visibleNew !== undefined) updateData.visibleNew = Boolean(visibleNew)
    if (visibleOld !== undefined) updateData.visibleOld = Boolean(visibleOld)

    await prisma.semester.update({
      where: { id: semesterId },
      data: updateData,
    })

    return NextResponse.json({ success: true, message: 'Semester visibility updated' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update visibility' }, { status: 500 })
  }
}
