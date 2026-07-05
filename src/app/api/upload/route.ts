// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const contentType = formData.get('contentType') as string // 'NOTE' | 'PAST_PAPER' | 'CHEATSHEET'
    const subjectId = formData.get('subjectId') as string

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    if (contentType === 'CHEATSHEET') {
      const title = formData.get('title') as string
      const content = formData.get('content') as string

      if (!title || !content) {
        return NextResponse.json({ error: 'Title and content are required for cheatsheets' }, { status: 400 })
      }

      const cheatsheet = await prisma.cheatsheet.create({
        data: {
          title,
          content,
          subjectId,
        },
      })
      return NextResponse.json({ cheatsheet, message: 'Cheatsheet created successfully' })
    }

    // For NOTE and PAST_PAPER, we need a file upload
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)
    const resourceType = isImage ? 'image' : 'raw'

    const folder = contentType === 'NOTE' ? 'notes' : 'past-papers'
    const { url } = await uploadToCloudinary(buffer, folder, resourceType)

    if (contentType === 'NOTE') {
      const title = formData.get('title') as string
      const description = formData.get('description') as string || ''
      const noteType = formData.get('noteType') as any || 'PDF_BOOK'
      const isPremium = formData.get('isPremium') === 'true'
      const author = formData.get('author') as string || ''

      if (!title) {
        return NextResponse.json({ error: 'Title is required for notes' }, { status: 400 })
      }

      const note = await prisma.note.create({
        data: {
          title,
          description,
          cloudinaryUrl: url,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          noteType,
          isPremium,
          author,
          subjectId,
        },
      })
      return NextResponse.json({ note, message: 'Study Note uploaded successfully' })
    } else if (contentType === 'PAST_PAPER') {
      const year = formData.get('year') as string
      const examType = formData.get('examType') as any || 'BOARD_EXAM'

      if (!year) {
        return NextResponse.json({ error: 'Year is required for past papers' }, { status: 400 })
      }

      const pastPaper = await prisma.pastPaper.create({
        data: {
          year: parseInt(year),
          examType,
          cloudinaryUrl: url,
          subjectId,
        },
      })
      return NextResponse.json({ pastPaper, message: 'Past Paper uploaded successfully' })
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
