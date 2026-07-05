// src/app/api/admin/subjects/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const semesterId = req.nextUrl.searchParams.get('semesterId')
  if (!semesterId) return NextResponse.json({ subjects: [] })

  const subjects = await prisma.subject.findMany({
    where: { semesterId },
    orderBy: { code: 'asc' },
  })
  return NextResponse.json({ subjects })
}
