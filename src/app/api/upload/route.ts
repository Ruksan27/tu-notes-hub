// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    // ── Handle CHEATSHEET (FormData) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const type = formData.get('contentType') as string
      const subjectId = formData.get('subjectId') as string

      if (!subjectId) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

      if (type === 'CHEATSHEET') {
        const title = formData.get('title') as string
        const content = formData.get('content') as string
        if (!title || !content) {
          return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
        }
        const cheatsheet = await prisma.cheatsheet.create({
          data: { title, content, subjectId }
        })
        return NextResponse.json({ cheatsheet, message: 'Cheatsheet created successfully' })
      }

      return NextResponse.json({ error: 'Invalid content type in FormData' }, { status: 400 })
    }

    // ── Handle NOTE / PAST_PAPER (JSON — after direct Cloudinary upload) ──
    const body = await req.json()
    const { contentType: type, subjectId, cloudinaryUrl, fileSize } = body

    if (!subjectId) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!cloudinaryUrl) return NextResponse.json({ error: 'cloudinaryUrl is required' }, { status: 400 })

    if (type === 'NOTE') {
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
        }
      })
      return NextResponse.json({ note, message: 'Study Note uploaded successfully' })
    }

    if (type === 'PAST_PAPER') {
      const { year, examType = 'BOARD_EXAM' } = body
      if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 })

      const pastPaper = await prisma.pastPaper.create({
        data: {
          year: parseInt(year),
          examType,
          cloudinaryUrl,
          subjectId,
        }
      })
      return NextResponse.json({ pastPaper, message: 'Past Paper uploaded successfully' })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
