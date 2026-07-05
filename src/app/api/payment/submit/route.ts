// src/app/api/payment/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Please login to make a payment' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''
    let transactionId = ''
    let packageType = ''
    let screenshot: File | null = null

    if (contentType.includes('application/json')) {
      const body = await req.json()
      transactionId = body.transactionId
      packageType = body.packageType
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      transactionId = formData.get('transactionId') as string
      packageType = formData.get('packageType') as string
      screenshot = formData.get('screenshot') as File | null
    }

    if (!transactionId || !packageType) {
      return NextResponse.json({ error: 'Transaction ID and package are required' }, { status: 400 })
    }

    const PACKAGE_PRICES: Record<string, number> = {
      SEMESTER_PASS: 99,
      ELITE_AI: 199,
    }

    if (!PACKAGE_PRICES[packageType]) {
      return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 })
    }

    // Check duplicate transaction ID
    const existing = await prisma.payment.findUnique({ where: { transactionId } })
    if (existing) {
      return NextResponse.json({ error: 'This transaction ID has already been used' }, { status: 409 })
    }

    let screenshotUrl: string | undefined
    if (screenshot) {
      const buffer = Buffer.from(await screenshot.arrayBuffer())
      const { url } = await uploadToCloudinary(buffer, 'receipts', 'image')
      screenshotUrl = url
    }

    await prisma.payment.create({
      data: {
        userId: user.userId,
        transactionId,
        screenshotUrl: screenshotUrl || null,
        amount: PACKAGE_PRICES[packageType],
        status: 'PENDING',
        packageBought: packageType as 'SEMESTER_PASS' | 'ELITE_AI',
      },
    })

    return NextResponse.json({
      message: 'Payment submitted! Admin will verify within 24 hours and activate your plan.',
    })
  } catch (error) {
    console.error('[PAYMENT_SUBMIT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
