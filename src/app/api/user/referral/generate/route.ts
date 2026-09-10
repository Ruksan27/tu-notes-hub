import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'TU-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST() {
  try {
    const userPayload = await getCurrentUser()
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, referralCode: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate unique code if missing or ugly UUID
    let uniqueCode = generateShortCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({ where: { referralCode: uniqueCode } })
      if (!existing) break
      uniqueCode = generateShortCode()
      attempts++
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: uniqueCode },
      select: { id: true, referralCode: true }
    })

    return NextResponse.json({
      success: true,
      referralCode: updatedUser.referralCode,
      message: 'Referral code generated successfully! 🎉'
    })
  } catch (error) {
    console.error('[GENERATE_REFERRAL_CODE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
  }
}
