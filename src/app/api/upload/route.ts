// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromPdfUrl } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    // ── Handle NOTE / PAST_PAPER / CHEATSHEET (JSON — after direct Cloudinary upload) ──
    const body = await req.json()
    const { contentType: type, subjectId, cloudinaryUrl, fileSize, extractText, files } = body

    if (!subjectId) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

    if (type === 'NOTE') {
      if (!cloudinaryUrl) return NextResponse.json({ error: 'cloudinaryUrl is required' }, { status: 400 })
      const { title, description = '', noteType = 'PDF_BOOK', isPremium, author = '' } = body
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

      const note = await prisma.note.create({
        data: {
          title,
          description,
          cloudinaryUrl,
          fileSize: fileSize || '',
          noteType,
          isPremium: isPremium === 'true' || isPremium === true,
          author,
          subjectId,
          extractedText: null,
        }
      })

      // Trigger OCR asynchronously in background so response returns instantly!
      if (extractText && cloudinaryUrl) {
        void (async () => {
          try {
            console.log(`[BACKGROUND OCR] Starting text extraction for Note ${note.id}...`)
            const text = await extractTextFromPdfUrl(cloudinaryUrl)
            if (text) {
              await prisma.note.update({ where: { id: note.id }, data: { extractedText: text } })
              console.log(`[BACKGROUND OCR SUCCESS] Updated text for Note ${note.id}`)
            }
          } catch (ocrErr) {
            console.error(`[BACKGROUND OCR ERROR] Failed for Note ${note.id}:`, ocrErr)
          }
        })()
      }

      return NextResponse.json({ note, message: 'Study Note uploaded successfully' })
    }

    if (type === 'PAST_PAPER') {
      if (!cloudinaryUrl) return NextResponse.json({ error: 'cloudinaryUrl is required' }, { status: 400 })
      const { year, examType = 'BOARD_EXAM' } = body
      if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 })

      const pastPaper = await prisma.pastPaper.create({
        data: {
          year: parseInt(year),
          examType,
          cloudinaryUrl,
          subjectId,
          extractedText: null,
        }
      })

      // Trigger OCR asynchronously in background so response returns instantly!
      if (extractText && cloudinaryUrl) {
        void (async () => {
          try {
            console.log(`[BACKGROUND OCR] Starting text extraction for Past Paper ${pastPaper.id}...`)
            const text = await extractTextFromPdfUrl(cloudinaryUrl)
            if (text) {
              await prisma.pastPaper.update({ where: { id: pastPaper.id }, data: { extractedText: text } })
              console.log(`[BACKGROUND OCR SUCCESS] Updated text for Past Paper ${pastPaper.id}`)
            }
          } catch (ocrErr) {
            console.error(`[BACKGROUND OCR ERROR] Failed for Past Paper ${pastPaper.id}:`, ocrErr)
          }
        })()
      }

      return NextResponse.json({ pastPaper, message: 'Past Paper uploaded successfully' })
    }

    if (type === 'CHEATSHEET') {
      const { title, content } = body
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
      
      const cheatsheet = await prisma.cheatsheet.create({
        data: { 
          title, 
          content: content || null, 
          subjectId,
          files: files || null
        }
      })
      return NextResponse.json({ cheatsheet, message: 'Cheatsheet created successfully' })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
