// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateOTP } from '@/lib/auth'
import { sendOTPEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, facultyId, semesterOrder } = await req.json()

    if (!name || !email || !password || !facultyId || !semesterOrder) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        facultyId,
        semesterOrder: parseInt(semesterOrder),
      },
    })

    // Generate and store OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.verificationOTP.create({
      data: { email, code: otp, type: 'REGISTER', expiresAt },
    })

    await sendOTPEmail(email, otp, 'REGISTER')

    return NextResponse.json({ message: 'OTP sent to your email. Please verify.' }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
