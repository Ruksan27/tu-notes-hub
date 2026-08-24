import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSellerStatusEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: {
        status,
        isVerified: status === 'APPROVED',
      },
      include: {
        user: { select: { email: true, name: true } }
      }
    })

    // Send email notification (fire & forget — don't block the response)
    sendSellerStatusEmail(updated.user.email, updated.user.name, status as 'APPROVED' | 'REJECTED')
      .catch(err => console.error('[SELLER_EMAIL_ERROR]', err))

    return NextResponse.json({ success: true, profile: updated })
  } catch (error) {
    console.error('[ADMIN_SELLER_UPDATE_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
