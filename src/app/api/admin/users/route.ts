// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Fetch all users
export async function GET() {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        subscriptionExpiresAt: true,
        isEmailVerified: true,
        facultyId: true,
        semesterOrder: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Update a user's plan
export async function PUT(req: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, packageType, months } = body

    if (!userId || !packageType) {
      return NextResponse.json({ error: 'userId and packageType are required' }, { status: 400 })
    }

    // Compute subscription expiry if premium
    let subscriptionExpiresAt: Date | null = null
    if (packageType !== 'FREE' && months) {
      subscriptionExpiresAt = new Date()
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + parseInt(months))
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        packageType: packageType as 'FREE' | 'SEMESTER_PASS' | 'ELITE_AI',
        subscriptionExpiresAt,
      },
      select: { id: true, name: true, email: true, packageType: true, subscriptionExpiresAt: true },
    })

    return NextResponse.json({ user: updatedUser, message: 'User plan updated!' })
  } catch (error) {
    console.error('[ADMIN_USERS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
