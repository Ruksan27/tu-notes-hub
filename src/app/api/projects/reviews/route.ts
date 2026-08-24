import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const reviews = await prisma.projectReview.findMany({
      where: { projectId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId, rating, comment } = await req.json()
    if (!projectId || !rating) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    // Create review
    const review = await prisma.projectReview.create({
      data: {
        projectId,
        userId: user.userId,
        rating: Number(rating),
        comment
      }
    })

    // Calculate new average rating and update ProjectItem
    const aggregations = await prisma.projectReview.aggregate({
      where: { projectId },
      _avg: { rating: true },
      _count: { rating: true }
    })

    const averageRating = aggregations._avg.rating || 0
    const reviewCount = aggregations._count.rating || 0

    await prisma.projectItem.update({
      where: { id: projectId },
      data: {
        rating: averageRating,
        reviewCount: reviewCount
      }
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('[PROJECT_REVIEW_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
