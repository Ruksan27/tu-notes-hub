// src/app/api/admin/faculties/set-defaults/route.ts
// One-time POST call to set BCA as visible and all others as hidden.
// This helps migrate existing data without needing a raw SQL migration.
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hide all faculties first
    await prisma.faculty.updateMany({ data: { visible: false } })

    // Make only BCA visible
    const bca = await prisma.faculty.update({
      where: { id: 'bca' },
      data: { visible: true },
    })

    return NextResponse.json({
      message: 'Visibility reset: BCA is now the only visible faculty.',
      bca,
    })
  } catch (error) {
    console.error('[SET_DEFAULTS]', error)
    return NextResponse.json({ error: 'Failed to set faculty defaults' }, { status: 500 })
  }
}
