// src/app/api/admin/faculties/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: 'asc' },
    include: {
      semesters: { orderBy: { order: 'asc' } },
    },
  })
  return NextResponse.json({ faculties })
}
