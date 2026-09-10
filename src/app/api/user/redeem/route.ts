import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { targetPlan } = await req.json() // "SEMESTER_PASS" | "ELITE_AI"

    if (!targetPlan || (targetPlan !== 'SEMESTER_PASS' && targetPlan !== 'ELITE_AI')) {
      return NextResponse.json({ error: 'Invalid target plan selected' }, { status: 400 })
    }

    const requiredPoints = targetPlan === 'SEMESTER_PASS' ? 1200 : 2500
    const durationMonths = targetPlan === 'SEMESTER_PASS' ? 6 : 12

    // Fetch latest user points
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { rewardPoints: true, packageType: true, planExpiresAt: true }
    })

    if (!dbUser || dbUser.rewardPoints < requiredPoints) {
      return NextResponse.json({
        error: `Insufficient points! You need ${requiredPoints} points, but you have ${dbUser?.rewardPoints || 0} points.`
      }, { status: 400 })
    }

    // Calculate expiry date
    const now = new Date()
    let currentExpiry = dbUser.planExpiresAt && dbUser.planExpiresAt > now ? new Date(dbUser.planExpiresAt) : now
    currentExpiry.setMonth(currentExpiry.getMonth() + durationMonths)

    // Execute atomic transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          rewardPoints: { decrement: requiredPoints },
          packageType: targetPlan,
          subscriptionExpiresAt: currentExpiry,
          planExpiresAt: currentExpiry,
        },
        select: {
          id: true,
          rewardPoints: true,
          packageType: true,
          planExpiresAt: true,
        }
      }),
      prisma.pointTransaction.create({
        data: {
          userId: user.id as string,
          amount: -requiredPoints,
          reason: `REDEEM_${targetPlan}`
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `🎉 Successfully unlocked ${targetPlan === 'SEMESTER_PASS' ? 'Semester Pass' : 'Elite AI Plan'}!`,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('[USER_REDEEM_ERROR]', error)
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
  }
}
