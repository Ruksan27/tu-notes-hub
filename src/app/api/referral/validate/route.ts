import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Please log in to use a referral code' }, { status: 401 })
    }

    const { referralCode } = await req.json()

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const trimmedCode = referralCode.trim()

    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: trimmedCode },
      select: { id: true, name: true, referralCode: true }
    })

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Anti-Spam: Block Self-Referrals
    if (referrer.id === user.id) {
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
