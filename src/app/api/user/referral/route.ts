import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const userPayload = await getCurrentUser()
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // 1. Fetch current user
    const dbUser = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, referredById: true, referralCode: true, rewardPoints: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Check if user already used a referral code
    if (dbUser.referredById) {
      return NextResponse.json({ error: 'You have already redeemed a referral code.' }, { status: 400 })
    }

    // 3. Prevent self-referral
    if (dbUser.referralCode === code) {
      return NextResponse.json({ error: 'You cannot use your own referral code.' }, { status: 400 })
    }

    // 4. Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code }
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code.' }, { status: 400 })
    }

    const BONUS_POINTS = 100

    // 5. Transaction: Link user, give points to both, create logs
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: dbUser.id },
        data: {
          referredById: referrer.id,
          rewardPoints: { increment: BONUS_POINTS }
        }
      }),
      prisma.user.update({
        where: { id: referrer.id },
        data: {
          rewardPoints: { increment: BONUS_POINTS }
        }
      }),
      prisma.pointTransaction.create({
        data: {
          userId: dbUser.id,
          amount: BONUS_POINTS,
          reason: `REDEEMED_REFERRAL_CODE: ${code}`
        }
      }),
      prisma.pointTransaction.create({
        data: {
          userId: referrer.id,
          amount: BONUS_POINTS,
          reason: `REFERRAL_BONUS_FROM: ${dbUser.id}`
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `🎉 Successfully redeemed referral code! +${BONUS_POINTS} PTS`,
      newPoints: updatedUser.rewardPoints
    })

  } catch (error: any) {
    console.error('[REFERRAL_REDEEM_ERROR]', error)
    return NextResponse.json({ error: 'Failed to redeem referral code' }, { status: 500 })
  }
}
