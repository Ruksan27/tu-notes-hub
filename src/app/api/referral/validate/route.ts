import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const userPayload = await getCurrentUser()
    if (!userPayload) {
      return NextResponse.json({ error: 'Please log in to use a referral code' }, { status: 401 })
    }

    const currentUserId = userPayload.userId || (userPayload as any).id

    const { referralCode } = await req.json()

    if (!referralCode || typeof referralCode !== 'string' || !referralCode.trim()) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const trimmedCode = referralCode.trim()

    // 1. Fetch current user from DB
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, referredById: true, referralCode: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Anti-Abuse: Prevent multiple referral code redemptions per account
    if (currentUser.referredById) {
      return NextResponse.json({
        error: 'You have already used a referral code previously. Referral codes can only be used once per account.'
      }, { status: 400 })
    }

    const existingPaymentReferral = await prisma.payment.findFirst({
      where: {
        userId: currentUserId,
        referralCode: { not: null },
        status: { in: ['PENDING', 'APPROVED'] }
      }
    })

    if (existingPaymentReferral) {
      return NextResponse.json({
        error: 'You have already used a referral code on a payment. Referral codes can only be used once per account.'
      }, { status: 400 })
    }

    // 3. Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: trimmedCode },
      select: { id: true, name: true, referralCode: true }
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code.' }, { status: 404 })
    }

    // 4. Anti-Self Referral: Block using own code
    if (referrer.id === currentUserId || (currentUser.referralCode && referrer.referralCode === currentUser.referralCode)) {
      return NextResponse.json({ error: 'You cannot use your own referral code!' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      discountPercentage: 10,
      referrerName: referrer.name,
      message: `🎉 10% Discount applied! Referral code from ${referrer.name} is valid.`
    })
  } catch (error: any) {
    console.error('[REFERRAL_VALIDATE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to validate referral code' }, { status: 500 })
  }
}
