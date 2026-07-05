// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })
    // Return same message even if user not found (security best practice)
    if (!user) {
      return NextResponse.json({ message: 'If this email is registered, you will receive an OTP.' })
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.verificationOTP.create({
      data: { email, code: otp, type: 'FORGOT_PASSWORD', expiresAt },
    })

    await sendOTPEmail(email, otp, 'FORGOT_PASSWORD')

    return NextResponse.json({ message: 'If this email is registered, you will receive an OTP.' })
  } catch (error) {
    console.error('[FORGOT_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
