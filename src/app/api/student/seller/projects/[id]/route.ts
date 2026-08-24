import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/student/seller/projects/[id]
// Allows the seller to update ONLY the sourceDriveLink of their own project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Verify the project belongs to this seller
    const project = await prisma.projectItem.findFirst({
      where: { id, sellerId: user.userId }
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const body = await req.json()
    const { sourceDriveLink } = body

    if (!sourceDriveLink || typeof sourceDriveLink !== 'string') {
      return NextResponse.json({ error: 'Invalid drive link' }, { status: 400 })
    }

    // Only allow Google Drive links
    if (!sourceDriveLink.startsWith('https://drive.google.com') && !sourceDriveLink.startsWith('https://docs.google.com')) {
      return NextResponse.json({ error: 'Only Google Drive links are allowed (must start with https://drive.google.com or https://docs.google.com)' }, { status: 400 })
    }

    const updated = await prisma.projectItem.update({
      where: { id },
      data: { sourceDriveLink },
      select: { id: true, sourceDriveLink: true }
    })

    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    console.error('[SELLER_PROJECT_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
