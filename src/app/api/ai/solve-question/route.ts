// src/app/api/ai/solve-question/route.ts
// API Route: Solve an exam question using Gemini AI
// - Checks TiDB cache first (fast & free)
// - Falls back to Gemini API (with retry + Groq fallback) if not cached
// - Saves result to cache for future requests

import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'
import { getCachedAnswer, saveCachedAnswer, ensureCacheTable, hashQuestion } from '@/lib/cacheDb'

// Simple in-memory IP rate limit store
// (resets on server restart — good enough for serverless)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20      // max requests per window
const RATE_WINDOW = 60_000 // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRequestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // --- Rate Limiting ---
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'धेरै Requests पठाउनुभयो। कृपया १ मिनेट पछि पुनः प्रयास गर्नुहोस्।' },
        { status: 429 }
      )
    }

    // --- Parse body ---
    const body = await req.json()
    const { questionText, chatHistory } = body as {
      questionText: string
      chatHistory?: { role: 'user' | 'model'; text: string }[]
    }

    if (!questionText?.trim()) {
      return NextResponse.json({ error: 'प्रश्न खाली छ।' }, { status: 400 })
    }

    // --- Cache lookup (only for initial question, not follow-up chats) ---
    const isInitialQuestion = !chatHistory || chatHistory.length === 0
    const questionHash = hashQuestion(questionText)

    if (isInitialQuestion) {
      const cached = await getCachedAnswer(questionHash)
      if (cached) {
        return NextResponse.json({ answer: cached, fromCache: true })
      }
    }

    // --- Build prompt ---
    let prompt: string

    if (isInitialQuestion) {
      prompt = `You are an expert university professor and academic tutor specializing in Tribhuvan University (TU) Nepal curriculum (BCA, CSIT, BBS programs).

A student is asking about the following exam question:

"${questionText}"

Please provide a clear, comprehensive, and well-structured answer suitable for a TU exam. Follow these guidelines:
- Give a complete answer with proper explanation
- Use examples and code snippets where relevant (use markdown code blocks)
- Use **bold** for key terms
- Keep the language simple and easy to understand
- If it's a programming question, always include a working code example
- Structure with headings if the answer is long
- End with a brief summary or key takeaway`
    } else {
      // Follow-up chat prompt — build conversation context
      const history = chatHistory!
        .map(m => `${m.role === 'user' ? 'Student' : 'Professor'}: ${m.text}`)
        .join('\n\n')

      prompt = `You are an expert university professor helping a TU Nepal student understand exam topics.

The student originally asked: "${questionText}"

Here is the conversation so far:
${history}

Please answer the student's latest follow-up question in a helpful, concise manner. Use markdown formatting.`
    }

    const systemInstruction = 'You are a helpful TU Nepal university professor. Always respond in English unless the student explicitly asks for Nepali.'

    // --- Call AI (Gemini with 3x retry + Groq fallback) ---
    const answer = await callGemini(prompt, systemInstruction)

    if (!answer) {
      return NextResponse.json(
        { error: 'AI बाट उत्तर ल्याउन समस्या भयो। कृपया पुनः प्रयास गर्नुहोस्।' },
        { status: 503 }
      )
    }

    // --- Save to cache (only initial answers) ---
    if (isInitialQuestion && answer) {
      await ensureCacheTable().catch(e => console.error('[ensureCacheTable]', e))
      await saveCachedAnswer(questionHash, questionText, answer)
    }

    return NextResponse.json({ answer, fromCache: false })
  } catch (error: any) {
    console.error('[AI Solve Question]', error)
    return NextResponse.json(
      { error: 'AI बाट उत्तर ल्याउन समस्या भयो। कृपया पुनः प्रयास गर्नुहोस्।' },
      { status: 500 }
    )
  }
}
