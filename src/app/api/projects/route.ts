import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await prisma.projectItem.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        category: true,
        subcategory: true,
        projectType: true,
        technologies: true,
        frontend: true,
        backend: true,
        dbType: true,
        originalPrice: true,
        discountPercentage: true,
        thumbnailUrl: true,
        demoUrl: true,
        features: true,
        status: true,
        createdAt: true,
        _count: { select: { orders: true } },
        user: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[PROJECTS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
