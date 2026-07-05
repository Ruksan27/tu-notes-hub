// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const record = await prisma.verificationOTP.findFirst({
      where: { email, code, type: 'FORGOT_PASSWORD' },
      orderBy: { createdAt: 'desc' },
    })

    if (!record || new Date() > record.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({ where: { email }, data: { password: hashed } })
    await prisma.verificationOTP.delete({ where: { id: record.id } })

    return NextResponse.json({ message: 'Password reset successfully. Please log in.' })
  } catch (error) {
    console.error('[RESET_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
