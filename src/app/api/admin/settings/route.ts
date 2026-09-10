import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET — anyone can fetch settings (for WhatsApp button & footer social links)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { 
        id: 'singleton', 
        whatsappLink: 'https://wa.me/9800000000',
        facebookLink: 'https://facebook.com',
        tiktokLink: 'https://tiktok.com',
        instagramLink: 'https://instagram.com',
        linkedinLink: 'https://linkedin.com',
        githubLink: 'https://github.com',
        contactPhone: '9767776999',
        contactEmail: 'tunoteshub@gmail.com'
      },
      update: {},
    })

    let githubLink = (settings as any).githubLink || 'https://github.com'
    let linkedinLink = (settings as any).linkedinLink || 'https://linkedin.com'

    try {
      const extraContent = await fs.readFile(path.join(process.cwd(), 'data', 'extra-settings.json'), 'utf-8')
      const extra = JSON.parse(extraContent)
      if (extra.githubLink) githubLink = extra.githubLink
      if (extra.linkedinLink) linkedinLink = extra.linkedinLink
    } catch {}

    return NextResponse.json({
      settings: {
        ...settings,
        githubLink,
        linkedinLink
      }
    })
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
    const facebookLink = fd.get('facebookLink') as string
    const tiktokLink = fd.get('tiktokLink') as string
    const instagramLink = fd.get('instagramLink') as string
    const linkedinLink = fd.get('linkedinLink') as string
    const githubLink = fd.get('githubLink') as string
    const contactPhone = fd.get('contactPhone') as string
    const contactEmail = fd.get('contactEmail') as string
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

    const updateData: any = { 
      whatsappLink,
      facebookLink: facebookLink || 'https://facebook.com',
      tiktokLink: tiktokLink || 'https://tiktok.com',
      instagramLink: instagramLink || 'https://instagram.com',
      linkedinLink: linkedinLink || 'https://linkedin.com',
      githubLink: githubLink || 'https://github.com',
      contactPhone: contactPhone || '9767776999',
      contactEmail: contactEmail || 'tunoteshub@gmail.com'
    }
    
    if (paymentQrUrl !== undefined) {
      updateData.paymentQrUrl = paymentQrUrl
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'singleton' },
      create: { 
        id: 'singleton', 
        whatsappLink, 
        facebookLink: facebookLink || 'https://facebook.com',
        tiktokLink: tiktokLink || 'https://tiktok.com',
        instagramLink: instagramLink || 'https://instagram.com',
        linkedinLink: linkedinLink || 'https://linkedin.com',
        githubLink: githubLink || 'https://github.com',
        contactPhone: contactPhone || '9767776999',
        contactEmail: contactEmail || 'tunoteshub@gmail.com',
        ...(paymentQrUrl && { paymentQrUrl }) 
      },
      update: updateData,
    })

    // Also update extra-settings.json for backup sync
    try {
      await fs.writeFile(
        path.join(process.cwd(), 'data', 'extra-settings.json'),
        JSON.stringify({ 
          githubLink: githubLink || 'https://github.com',
          linkedinLink: linkedinLink || 'https://linkedin.com'
        }, null, 2),
        'utf-8'
      )
    } catch {}

    return NextResponse.json({ 
      success: true, 
      settings: { 
        ...settings, 
        githubLink: githubLink || 'https://github.com',
        linkedinLink: linkedinLink || 'https://linkedin.com'
      } 
    })
  } catch (error) {
    console.error('[SITE_SETTINGS_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
