import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const notes = await prisma.note.findMany({ select: { id: true, cloudinaryUrl: true } })
  const papers = await prisma.pastPaper.findMany({ select: { id: true, cloudinaryUrl: true } })
  return NextResponse.json({ notes, papers })
}
