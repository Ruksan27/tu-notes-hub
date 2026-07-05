// src/app/api/admin/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('tu_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
