import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await prisma.projectItem.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[PROJECTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
