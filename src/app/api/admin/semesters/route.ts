// src/app/api/admin/semesters/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const facultyId = req.nextUrl.searchParams.get('facultyId')
  if (!facultyId) return NextResponse.json({ semesters: [] })

  const semesters = await prisma.semester.findMany({
    where: { facultyId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ semesters })
}
