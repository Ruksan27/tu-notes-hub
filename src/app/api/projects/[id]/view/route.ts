import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const referrer = req.headers.get('referer') || req.headers.get('referrer') || ''
    const isOrganic = /google|bing|yahoo|duckduckgo|yandex|baidu/i.test(referrer)

    try {
      await prisma.projectItem.update({
        where: { id },
        data: {
          views: { increment: 1 },
          ...(isOrganic ? { organicViews: { increment: 1 }, searchClicks: { increment: 1 } } : {})
        }
      })
    } catch (e) {
      // Column may not exist on remote TiDB yet
      console.log('Skipping view increment (DB column sync pending)')
    }

    return NextResponse.json({ success: true, isOrganic })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
