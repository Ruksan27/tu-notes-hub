import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const aboutFilePath = path.join(process.cwd(), 'data', 'about-items.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(aboutFilePath, 'utf-8')
    const items = JSON.parse(fileContent)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[ABOUT_ITEMS_GET]', error)
    return NextResponse.json({ error: 'Failed to read about items' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items } = await req.json()
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
    }

    // Write back to the local file
    await fs.writeFile(aboutFilePath, JSON.stringify(items, null, 2), 'utf-8')
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('[ABOUT_ITEMS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update about items' }, { status: 500 })
  }
}
