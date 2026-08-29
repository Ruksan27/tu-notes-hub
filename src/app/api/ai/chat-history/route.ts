// src/app/api/ai/chat-history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getChatHistory, getUserChatSessions, deleteChatSession } from '@/lib/cacheDb'

// GET /api/ai/chat-history?sessionId=xxx  → messages in a session
// GET /api/ai/chat-history                → all sessions list
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (sessionId) {
      const messages = await getChatHistory(user.id, sessionId)
      return NextResponse.json({ messages })
    } else {
      const sessions = await getUserChatSessions(user.id)
      return NextResponse.json({ sessions })
    }
  } catch (error) {
    console.error('[CHAT_HISTORY_GET]', error)
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }
}

// DELETE /api/ai/chat-history?sessionId=xxx
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

    await deleteChatSession(user.id, sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CHAT_HISTORY_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
