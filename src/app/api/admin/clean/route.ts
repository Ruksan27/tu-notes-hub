import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notes = await prisma.note.findMany({ select: { id: true, cloudinaryUrl: true } })
  const papers = await prisma.pastPaper.findMany({ select: { id: true, cloudinaryUrl: true } })
  return NextResponse.json({ notes, papers })
}
