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

    const userId = userPayload.userId

    const { name, avatarUrl, phone, college, gender, facultyId, semesterOrder } = await req.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    const updateData: any = {
      name: name.trim(),
      avatarUrl: avatarUrl || null,
      phone: phone || null,
      college: college || null,
      gender: gender || null,
    }

    if (facultyId !== undefined) {
      updateData.facultyId = facultyId || null
    }
    if (semesterOrder !== undefined) {
      updateData.semesterOrder = semesterOrder ? parseInt(String(semesterOrder), 10) : null
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
  } catch (error) {
    console.error('[USER_PROFILE_PATCH]', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
