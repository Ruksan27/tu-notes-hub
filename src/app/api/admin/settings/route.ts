import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

// GET — anyone can fetch settings (for the WhatsApp button)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', whatsappLink: 'https://wa.me/9800000000' },
      update: {},
    })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[SITE_SETTINGS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT — admin only
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fd = await req.formData()
    const whatsappLink = fd.get('whatsappLink') as string
    const paymentQrFile = fd.get('paymentQr') as File | null

    if (!whatsappLink) {
      return NextResponse.json({ error: 'whatsappLink is required' }, { status: 400 })
    }

    let paymentQrUrl: string | undefined = undefined

    if (paymentQrFile && paymentQrFile.size > 0) {
      const buffer = Buffer.from(await paymentQrFile.arrayBuffer())
      const uploadRes = await uploadToCloudinary(buffer, 'tu-notes/settings', 'image')
      paymentQrUrl = uploadRes.url
    }

    const updateData: any = { whatsappLink }
    if (paymentQrUrl !== undefined) {
      updateData.paymentQrUrl = paymentQrUrl
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', whatsappLink, ...(paymentQrUrl && { paymentQrUrl }) },
      update: updateData,
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[SITE_SETTINGS_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
