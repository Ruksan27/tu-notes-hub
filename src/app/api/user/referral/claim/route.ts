import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { milestone } = await req.json() // 'SEMESTER_PASS' | 'ELITE_AI'

    if (!milestone || (milestone !== 'SEMESTER_PASS' && milestone !== 'ELITE_AI')) {
      return NextResponse.json({ error: 'Invalid milestone selected' }, { status: 400 })
    }

    const requiredReferrals = milestone === 'SEMESTER_PASS' ? 5 : 8
    const durationMonths = milestone === 'SEMESTER_PASS' ? 6 : 12

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        successfulPaidReferrals: true,
        packageType: true,
        planExpiresAt: true
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 440 })
    }

    if (dbUser.successfulPaidReferrals < requiredReferrals) {
      return NextResponse.json({
        error: `Insufficient paid referrals! You need ${requiredReferrals} paid referrals, but you currently have ${dbUser.successfulPaidReferrals}.`
      }, { status: 400 })
    }

    // Calculate expiry date (extend if active, or start from today if expired)
    const now = new Date()
    let currentExpiry = dbUser.planExpiresAt && dbUser.planExpiresAt > now ? new Date(dbUser.planExpiresAt) : now
    currentExpiry.setMonth(currentExpiry.getMonth() + durationMonths)

    const remainingReferrals = dbUser.successfulPaidReferrals - requiredReferrals

    // Immediate auto-activation of claimed plan
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        successfulPaidReferrals: remainingReferrals,
        packageType: milestone,
        subscriptionExpiresAt: currentExpiry,
        planExpiresAt: currentExpiry,
      },
      select: {
        id: true,
        successfulPaidReferrals: true,
        packageType: true,
        planExpiresAt: true,
        subscriptionExpiresAt: true,
      }
    })

    // Log Notification
    const planName = milestone === 'SEMESTER_PASS' ? '6 Months Semester Pass' : '1 Year Elite AI Pass'
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Pass Claimed Successfully! 🥳',
        message: `You claimed your Free ${planName}! Your plan is now active. Remaining referrals: ${remainingReferrals}.`,
        link: '/dashboard'
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `🎉 Successfully claimed & activated ${planName}!`,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('[REFERRAL_CLAIM_ERROR]', error)
    return NextResponse.json({ error: 'Failed to claim referral reward' }, { status: 500 })
  }
}
