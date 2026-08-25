// src/app/api/upload/solution-book/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { semesterId, title, description, cloudinaryUrl, fileSize, isPremium, author } = await req.json()

    if (!semesterId) return NextResponse.json({ error: 'Semester is required' }, { status: 400 })
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!cloudinaryUrl) return NextResponse.json({ error: 'cloudinaryUrl is required' }, { status: 400 })

    const solutionBook = await prisma.solutionBook.create({
      data: {
        title,
        description: description || '',
        cloudinaryUrl,
        fileSize: fileSize || '',
        isPremium: isPremium === 'true' || isPremium === true,
        author: author || '',
        semesterId,
      }
    })

    return NextResponse.json({ solutionBook, message: 'Solution book published successfully! 🎉' })
  } catch (error) {
    console.error('[SOLUTION_BOOK_UPLOAD]', error)
    return NextResponse.json({ error: 'Failed to publish solution book' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const semesterId = searchParams.get('semesterId')

    if (!semesterId) return NextResponse.json({ error: 'semesterId is required' }, { status: 400 })

    const books = await prisma.solutionBook.findMany({
      where: { semesterId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ books })
  } catch (error) {
    console.error('[SOLUTION_BOOK_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch solution books' }, { status: 500 })
  }
}
