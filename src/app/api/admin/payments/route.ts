// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [payments, totalUsers, pendingPayments] = await Promise.all([
    prisma.payment.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.user.count(),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ])

  const approvedPayments = await prisma.payment.findMany({ where: { status: 'APPROVED' } })
  const totalRevenue = approvedPayments.reduce((acc, p) => acc + p.amount, 0)

  return NextResponse.json({
    payments,
    totalUsers,
    totalPayments: payments.length,
    pendingPayments,
    totalRevenue,
  })
}
