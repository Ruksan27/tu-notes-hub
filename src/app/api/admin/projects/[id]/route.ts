// src/app/api/admin/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title, description, technologies, originalPrice,
      discountPercentage, thumbnailUrl, demoUrl, features, status,
    } = body

    const updated = await prisma.projectItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(technologies !== undefined && { technologies }),
        ...(originalPrice !== undefined && { originalPrice }),
        ...(discountPercentage !== undefined && { discountPercentage }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(demoUrl !== undefined && { demoUrl }),
        ...(features !== undefined && { features }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    console.error('[ADMIN_PROJECT_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.projectItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_PROJECT_DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
