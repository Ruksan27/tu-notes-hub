// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, code, type } = await req.json()

    const record = await prisma.verificationOTP.findFirst({
      where: { email, code, type },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    if (new Date() > record.expiresAt) {
      await prisma.verificationOTP.delete({ where: { id: record.id } })
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    })

    await prisma.verificationOTP.delete({ where: { id: record.id } })

    // Set auth cookie on verification
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      packageType: user.packageType,
    })

    return NextResponse.json({
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        packageType: user.packageType,
        facultyId: user.facultyId,
        semesterOrder: user.semesterOrder,
      }
    })
  } catch (error) {
    console.error('[VERIFY_OTP]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
