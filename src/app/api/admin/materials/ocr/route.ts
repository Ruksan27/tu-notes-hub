import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromPdfUrl } from '@/lib/gemini'

export const maxDuration = 60 // 60s max for Vercel/Next.js

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, type } = await req.json()
    if (!id || !type) {
      return NextResponse.json({ error: 'id and type are required' }, { status: 400 })
    }

    let url: string | null = null

    if (type === 'pastpaper') {
      const paper = await prisma.pastPaper.findUnique({ where: { id } })
      if (!paper) return NextResponse.json({ error: 'Past paper not found' }, { status: 404 })
      url = paper.cloudinaryUrl
    } else if (type === 'note') {
      const note = await prisma.note.findUnique({ where: { id } })
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      url = note.cloudinaryUrl
    } else {
      return NextResponse.json({ error: 'Invalid type for OCR' }, { status: 400 })
    }

    if (!url) {
      return NextResponse.json({ error: 'File URL missing for item' }, { status: 400 })
    }

    console.log(`[ADMIN OCR] Starting manual OCR text extraction for ${type} ${id}...`)
    const extractedText = await extractTextFromPdfUrl(url)

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json({ error: 'OCR model returned empty text. Please try again.' }, { status: 500 })
    }

    if (type === 'pastpaper') {
      await prisma.pastPaper.update({
        where: { id },
        data: { extractedText }
      })
    } else if (type === 'note') {
      await prisma.note.update({
        where: { id },
        data: { extractedText }
      })
    }

    return NextResponse.json({
      success: true,
      extractedTextLength: extractedText.length,
      snippet: extractedText.substring(0, 150)
    })
  } catch (error: any) {
    console.error('[ADMIN OCR ERROR]', error)
    return NextResponse.json({ error: error.message || 'OCR extraction failed' }, { status: 500 })
  }
}
