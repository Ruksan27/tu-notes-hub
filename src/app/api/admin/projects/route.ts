// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, technologies, originalPrice, discountPercentage, thumbnailUrl, demoUrl, features } = body

    if (!title || !description || !technologies || originalPrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const project = await prisma.projectItem.create({
      data: {
        title,
        description,
        technologies,
        originalPrice,
        discountPercentage: discountPercentage || 0,
        thumbnailUrl,
        demoUrl,
        features,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error) {
    console.error('[ADMIN_PROJECTS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
