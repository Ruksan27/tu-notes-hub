// src/app/api/admin/semesters/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

let isColumnChecked = false

// Ensure visible, visibleNew, visibleOld columns exist in Semester table
async function ensureVisibleColumns() {
  if (isColumnChecked) return
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
  isColumnChecked = true
}

export async function GET(req: NextRequest) {
  await ensureVisibleColumns()
  const facultyId = req.nextUrl.searchParams.get('facultyId')
  if (!facultyId) return NextResponse.json({ semesters: [] })

  try {
    const rawSemesters: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM \`Semester\` WHERE \`facultyId\` = ? ORDER BY \`order\` ASC;`,
      facultyId
    )
    const semesters = rawSemesters.map(s => ({
      ...s,
      visible: Boolean(s.visible !== 0 && s.visible !== false),
      visibleNew: Boolean(s.visibleNew !== 0 && s.visibleNew !== false),
      visibleOld: Boolean(s.visibleOld !== 0 && s.visibleOld !== false),
    }))
    return NextResponse.json({ semesters })
  } catch (err) {
    const semesters = await prisma.semester.findMany({
      where: { facultyId },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ semesters })
  }
}

export async function PUT(req: NextRequest) {
  await ensureVisibleColumns()
  try {
    const { semesterId, visible, visibleNew, visibleOld } = await req.json()
    if (!semesterId) return NextResponse.json({ error: 'semesterId is required' }, { status: 400 })

    if (visible !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`Semester\` SET \`visible\` = ? WHERE \`id\` = ?;`,
        visible ? 1 : 0,
        semesterId
      )
    }

    if (visibleNew !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`Semester\` SET \`visibleNew\` = ? WHERE \`id\` = ?;`,
        visibleNew ? 1 : 0,
        semesterId
      )
    }

    if (visibleOld !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE \`Semester\` SET \`visibleOld\` = ? WHERE \`id\` = ?;`,
        visibleOld ? 1 : 0,
        semesterId
      )
    }

    return NextResponse.json({ success: true, message: 'Semester visibility updated' })
  } catch (error: any) {
    console.error('[SEMESTER_VISIBILITY_ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to update visibility' }, { status: 500 })
  }
}
