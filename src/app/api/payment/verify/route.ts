// src/app/api/payment/verify/route.ts (Admin only)
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId, action } = await req.json() // action: 'APPROVE' | 'REJECT'

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'APPROVED') {
      // Calculate subscription expiry
      const now = new Date()
      const expiresAt = payment.packageBought === 'SEMESTER_PASS'
        ? new Date(now.setMonth(now.getMonth() + 6))    // 6 months
        : new Date(now.setFullYear(now.getFullYear() + 1)) // 1 year

      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          packageType: payment.packageBought,
          subscriptionExpiresAt: expiresAt,
        },
      })

      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'APPROVED' },
      })

      return NextResponse.json({ message: 'Payment approved and plan activated!' })
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REJECTED' },
      })
      return NextResponse.json({ message: 'Payment rejected.' })
    }
  } catch (error) {
    console.error('[PAYMENT_VERIFY]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
