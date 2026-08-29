import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const rulesFilePath = path.join(process.cwd(), 'data', 'platform-rules.json')

export async function GET() {
  try {
    const fileContent = await fs.readFile(rulesFilePath, 'utf-8')
    const rules = JSON.parse(fileContent)
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('[PLATFORM_RULES_GET]', error)
    return NextResponse.json({ error: 'Failed to read platform rules' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rules } = await req.json()
    if (!rules || !Array.isArray(rules.buyerRules) || !Array.isArray(rules.sellerRules)) {
      return NextResponse.json({ error: 'Invalid platform rules format' }, { status: 400 })
    }

    // Write back to the local file
    await fs.writeFile(rulesFilePath, JSON.stringify(rules, null, 2), 'utf-8')
    return NextResponse.json({ success: true, rules })
  } catch (error) {
    console.error('[PLATFORM_RULES_PUT]', error)
    return NextResponse.json({ error: 'Failed to update platform rules' }, { status: 500 })
  }
}
