// src/app/api/admin/projects/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendProjectOrderDeliveredEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.projectOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        projectItem: { select: { title: true, sourceDriveLink: true } }
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[ADMIN_PROJECT_ORDERS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, status } = await req.json()
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 })
    }

    const updatedOrder = await prisma.projectOrder.update({
      where: { id: orderId },
      data: { status },
      include: {
        projectItem: { select: { title: true, sourceDriveLink: true } }
      }
    })

    // Auto-send delivery email when order is APPROVED
    if (status === 'APPROVED') {
      const driveLink = updatedOrder.projectItem?.sourceDriveLink
      const buyerEmail = updatedOrder.orderEmail

      if (buyerEmail && driveLink) {
        try {
          await sendProjectOrderDeliveredEmail(
            buyerEmail,
            updatedOrder.projectItem?.title ?? 'Project',
            updatedOrder.amount,
            updatedOrder.id,
            driveLink
          )
        } catch (emailErr) {
          // Log but don't fail the request if email fails
          console.error('[ORDER_DELIVERY_EMAIL_FAIL]', emailErr)
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error('[ADMIN_PROJECT_ORDERS_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
