// src/app/api/payment/verify/route.ts (Admin only)
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPaymentApprovalEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId, action } = await req.json() // action: 'APPROVED' | 'REJECTED'

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'APPROVED') {
      // Calculate subscription expiry
      const now = new Date()
      const expiresAt = payment.packageBought === 'SEMESTER_PASS'
        ? new Date(now.setMonth(now.getMonth() + 6))       // 6 months
        : new Date(now.setFullYear(now.getFullYear() + 1)) // 1 year

      const buyer = await prisma.user.update({
        where: { id: payment.userId },
        data: {
          packageType: payment.packageBought,
          subscriptionExpiresAt: expiresAt,
          planExpiresAt: expiresAt,
        },
        select: { id: true, referredById: true, name: true, email: true }
      })

      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'APPROVED' },
      })

      // Referral logic: check either payment.referralCode or buyer.referredById
      let referrer = null
      if (payment.referralCode) {
        referrer = await prisma.user.findUnique({ where: { referralCode: payment.referralCode } })
      } else if (buyer.referredById) {
        referrer = await prisma.user.findUnique({ where: { id: buyer.referredById } })
      }

      if (referrer && referrer.id !== buyer.id) {
        // Link buyer to referrer if not linked yet
        if (!buyer.referredById) {
          await prisma.user.update({
            where: { id: buyer.id },
            data: { referredById: referrer.id }
          })
        }

        const newCount = referrer.successfulPaidReferrals + 1

        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            successfulPaidReferrals: newCount,
          }
        })

        // Log referral
        await prisma.referralLog.create({
          data: {
            referrerId: referrer.id,
            referredUserId: buyer.id,
            planPurchased: payment.packageBought,
            discountGiven: 10.0,
          }
        })

        // Notify referrer if milestone threshold reached
        if (newCount >= 5) {
          await prisma.notification.create({
            data: {
              type: 'SYSTEM',
              title: 'Milestone Unlocked! 🎁',
              message: `🎉 Great news! ${newCount} friends have upgraded using your referral code. You can now claim your Free Premium Pass in your Dashboard!`,
              link: '/dashboard'
            }
          }).catch(() => {})
        }
      }

      // Send the approval email to buyer
      const userToEmail = await prisma.user.findUnique({ where: { id: payment.userId } })
      if (userToEmail) {
        try {
          await sendPaymentApprovalEmail(userToEmail.email, userToEmail.name, payment.packageBought, expiresAt)
        } catch (e) {
          console.error("Failed to send payment approval email:", e)
        }
      }

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
