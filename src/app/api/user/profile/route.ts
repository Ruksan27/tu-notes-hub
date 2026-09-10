import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  try {
    const userPayload = await getCurrentUser()
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = userPayload.userId || (userPayload as any).id
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing from session' }, { status: 401 })
    }

    const body = await req.json()
    const { name, avatarUrl, phone, college, gender } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    const updateData: any = {
      name: name.trim(),
      avatarUrl: avatarUrl ? String(avatarUrl) : null,
      phone: phone ? String(phone) : null,
      college: college ? String(college) : null,
      gender: gender ? String(gender) : null,
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        facultyId: true,
        semesterOrder: true,
        avatarUrl: true,
        phone: true,
        college: true,
        gender: true,
        rewardPoints: true,
        referralCode: true,
        referredById: true,
        successfulPaidReferrals: true,
      }
    })

    return NextResponse.json({ 
      user: updatedUser, 
      message: 'Profile updated successfully! 🎉' 
    })
  } catch (error: any) {
    console.error('[USER_PROFILE_PATCH_ERROR]', error)
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 })
  }
}
