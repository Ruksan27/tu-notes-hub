// src/app/api/admin/migrate/route.ts
// One-time runtime migration to:
// 1. Set BCA as the only visible faculty (all others hidden)
// 2. The NoteType enum (LAB_WORK, PROJECT, etc.) is already in schema and
//    should be synced with `npx prisma db push` from the terminal.
//
// USAGE: Call POST /api/admin/migrate from the admin panel once.
// This is safe to call multiple times (idempotent).
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: string[] = []

    // Step 1: Ensure only BCA is visible
    const hideAll = await prisma.faculty.updateMany({ data: { visible: false } })
    results.push(`Hidden ${hideAll.count} faculties`)

    const bcaVisible = await prisma.faculty.update({
      where: { id: 'bca' },
      data: { visible: true },
    })
    results.push(`Set BCA (${bcaVisible.name}) as visible`)

    // Step 2: Count total resources for summary
    const noteCount = await prisma.note.count()
    const paperCount = await prisma.pastPaper.count()
    const cheatCount = await prisma.cheatsheet.count()
    results.push(`Database has: ${noteCount} notes, ${paperCount} past papers, ${cheatCount} cheatsheets`)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      results,
    })
  } catch (error) {
    console.error('[MIGRATE]', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const faculties = await prisma.faculty.findMany({
      select: { id: true, name: true, visible: true },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({
      status: 'Migration endpoint ready',
      faculties,
      hint: 'POST to this endpoint to set BCA-only visibility',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
