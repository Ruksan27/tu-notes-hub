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

    const { subjectId, imageUrl } = await req.json()

    if (!subjectId || !imageUrl) {
      return NextResponse.json({ error: 'Subject and image URL are required' }, { status: 400 })
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Fetch the image from Cloudinary and convert to base64
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`)
    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Determine mime type from URL
    const lower = imageUrl.toLowerCase()
    let mimeType = 'image/jpeg'
    if (lower.includes('.png')) mimeType = 'image/png'
    else if (lower.includes('.webp')) mimeType = 'image/webp'

    // Generate MCQs from image using Gemini Vision
    const mcqs = await generateMcqsFromImage(subject.title, base64, mimeType)

    return NextResponse.json({ mcqs, subjectTitle: subject.title })
  } catch (error: any) {
    console.error('[MCQ_FROM_IMAGE]', error)
    return NextResponse.json({ error: error.message || 'Failed to generate MCQs from image' }, { status: 500 })
  }
}
