import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, avatarUrl } = await req.json()

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Name must be at least 3 characters' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        avatarUrl: true
      }
    })

    return NextResponse.json({ 
      user: updatedUser, 
      message: 'Profile updated successfully!' 
    })
  } catch (error) {
    console.error('[USER_PROFILE_PATCH]', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
