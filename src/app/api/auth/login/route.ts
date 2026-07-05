// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'Please verify your email before logging in' }, { status: 403 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      packageType: user.packageType,
    })

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        packageType: user.packageType,
        facultyId: user.facultyId,
        semesterOrder: user.semesterOrder,
      },
    })
  } catch (error) {
    console.error('[LOGIN]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
