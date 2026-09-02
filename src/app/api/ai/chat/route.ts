// src/app/api/ai/chat/route.ts
// AI Chat for Elite AI Pass holders
// Supports both: general TU chat + report-context-aware chat
// Chat history stored in TiDB, expires after 15 days

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'
import { saveChatMessage, getChatHistory } from '@/lib/cacheDb'

const MAX_MESSAGES_PER_SESSION = 40 // 20 turns = 40 messages (user + model)

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    if (user.packageType !== 'ELITE_AI' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'AI Chat is exclusive to Elite AI Pass holders.',
        upgradeRequired: true,
      }, { status: 403 })
    }

    const { message, sessionId, reportContext } = await req.json() as {
      message: string
      sessionId: string
      reportContext?: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Load history from DB (non-blocking — if fails, continue without history)
    let history: { role: 'user' | 'model'; message: string }[] = []
    try {
      history = await getChatHistory(user.userId, sessionId)
    } catch (histErr) {
      console.warn('[AI_CHAT] Could not load history (non-fatal):', histErr)
    }

    if (history.length >= MAX_MESSAGES_PER_SESSION) {
      return NextResponse.json({
        error: 'Session limit reached (20 turns). Please start a new chat session.',
      }, { status: 429 })
    }

    // Build prompt with history context
    const historyText = history
      .map(h => `${h.role === 'user' ? 'Student' : 'Professor'}: ${h.message}`)
      .join('\n\n')

    const systemInstruction = `You are an expert AI tutor for Tribhuvan University (TU) Nepal students (BCA, CSIT, BBS programs). 
Provide clear, well-structured answers suitable for TU exams.
Use **bold** for key terms. Keep answers concise but complete. 
Respond in the same language the student uses (Nepali or English).`

    let prompt: string
    if (reportContext) {
      prompt = `${systemInstruction}

The student has just received an AI Exam Prediction Report:
${reportContext}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Student: ${message}
Professor:`
    } else {
      prompt = `${systemInstruction}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Student: ${message}
Professor:`
    }

    // Call Gemini
    const apiKey = process.env.GEMINI_KEY_ANSWER_SOLVER
    if (!apiKey) {
      console.error('[AI_CHAT] GEMINI_KEY_ANSWER_SOLVER is not set')
      return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })
    }

    const genAI = new GoogleGenAI({ apiKey })
    
    // Model fallback sequence to ensure reliability even during high demand / 503 errors
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    let reply = ''
    let lastError: any = null

    for (const modelName of modelsToTry) {
      try {
        const response = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
        })
        reply = response.text ?? ''
        if (reply) break
      } catch (err: any) {
        console.warn(`[AI_CHAT] Model ${modelName} failed, trying next...`, err?.message || err)
        lastError = err
      }
    }

    if (!reply && lastError) {
      throw lastError
    }

    // Save both messages to DB (fire-and-forget — don't block response)
    Promise.all([
      saveChatMessage(user.userId, sessionId, 'user', message),
      saveChatMessage(user.userId, sessionId, 'model', reply),
    ]).catch(e => console.warn('[AI_CHAT] Failed to save messages (non-fatal):', e))

    return NextResponse.json({ reply, messagesLeft: MAX_MESSAGES_PER_SESSION - history.length - 2 })
  } catch (error: any) {
    console.error('[AI_CHAT] Error:', error?.message || error)
    return NextResponse.json({ error: 'AI chat failed: ' + (error?.message || 'Unknown error') }, { status: 500 })
  }
}
