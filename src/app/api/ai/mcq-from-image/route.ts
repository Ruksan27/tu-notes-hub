import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMcqsFromImage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { subjectId, imageUrls } = await req.json()

    if (!subjectId || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'Subject and at least one image URL are required' }, { status: 400 })
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Fetch all files from Cloudinary and convert to base64
    const imagesData = await Promise.all(imageUrls.map(async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`)
      const arrayBuffer = await res.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Determine mime type from URL or content type
      const lower = url.toLowerCase().split('?')[0]
      let mimeType = 'image/jpeg'
      if (lower.endsWith('.png')) mimeType = 'image/png'
      else if (lower.endsWith('.webp')) mimeType = 'image/webp'
      else if (lower.endsWith('.gif')) mimeType = 'image/gif'
      else if (lower.endsWith('.pdf') || lower.includes('/pdf')) mimeType = 'application/pdf'
      else if (lower.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      else if (lower.endsWith('.doc')) mimeType = 'application/msword'
      // Fallback: check the actual content-type from Cloudinary
      else {
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('pdf')) mimeType = 'application/pdf'
        else if (ct.includes('word')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ct.includes('png')) mimeType = 'image/png'
        else if (ct.includes('webp')) mimeType = 'image/webp'
      }

      return { base64, mimeType }
    }))

    // Generate MCQs from image(s) using Gemini Vision
    const mcqs = await generateMcqsFromImage(subject.title, imagesData)

    return NextResponse.json({ mcqs, subjectTitle: subject.title })
  } catch (error: any) {
    console.error('[MCQ_FROM_IMAGE]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate MCQs from image' }, { status: 500 })
  }
}
