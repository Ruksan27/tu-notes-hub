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
        let referrerPackage = referrer.packageType
        let referrerExpiry = referrer.planExpiresAt || new Date()
        let unlockedMessage = ''

        // Milestone Automation:
        // 8 paid referrals -> Yearly (Elite AI) Pass
        // 5 paid referrals -> Semester Pass
        if (newCount >= 8) {
          referrerPackage = 'ELITE_AI'
          const exp = new Date(referrerExpiry > new Date() ? referrerExpiry : new Date())
          exp.setFullYear(exp.getFullYear() + 1)
          referrerExpiry = exp
          unlockedMessage = '🎉 Milestone Reached! 8 friends used your referral code. You have unlocked 1 Year Elite AI Pass for FREE!'
        } else if (newCount >= 5 && (referrerPackage === 'FREE' || referrerPackage === 'SEMESTER_PASS')) {
          referrerPackage = 'SEMESTER_PASS'
          const exp = new Date(referrerExpiry > new Date() ? referrerExpiry : new Date())
          exp.setMonth(exp.getMonth() + 6)
          referrerExpiry = exp
          unlockedMessage = '🎉 Milestone Reached! 5 friends used your referral code. You have unlocked 6 Months Semester Pass for FREE!'
        }

        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            successfulPaidReferrals: newCount,
            packageType: referrerPackage,
            subscriptionExpiresAt: referrerExpiry,
            planExpiresAt: referrerExpiry,
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

        // Notify referrer if milestone unlocked
        if (unlockedMessage) {
          await prisma.notification.create({
            data: {
              type: 'SYSTEM',
              title: 'Free Pass Unlocked! 🎁',
              message: unlockedMessage,
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
