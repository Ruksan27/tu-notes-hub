import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { whatsappLink } = await req.json()
    if (!whatsappLink) {
      return NextResponse.json({ error: 'whatsappLink is required' }, { status: 400 })
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', whatsappLink },
      update: { whatsappLink },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[SITE_SETTINGS_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
