import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserAiHistory, deleteUserAiHistoryItem } from '@/lib/cacheDb'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const history = await getUserAiHistory(user.id)
    return NextResponse.json({ history })
  } catch (error) {
    console.error('[AI_HISTORY_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing history item ID' }, { status: 400 })

    await deleteUserAiHistoryItem(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI_HISTORY_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 })
  }
}
