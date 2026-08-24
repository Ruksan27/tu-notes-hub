// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please register first.' },
        { status: 404 }
      )
    }

    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // Remove any old FORGOT_PASSWORD OTPs for this email first
    await prisma.verificationOTP.deleteMany({
      where: { email, type: 'FORGOT_PASSWORD' },
    })

    await prisma.verificationOTP.create({
      data: { email, code: otp, type: 'FORGOT_PASSWORD', expiresAt },
    })

    await sendOTPEmail(email, otp, 'FORGOT_PASSWORD')

    return NextResponse.json({ message: 'OTP sent successfully. Check your email inbox.' })
  } catch (error) {
    console.error('[FORGOT_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
