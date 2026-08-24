import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getCurrentUser()
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        packageType: true,
        facultyId: true,
        semesterOrder: true,
      }
    })

    if (!dbUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: dbUser })
  } catch (error) {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
  }
}
