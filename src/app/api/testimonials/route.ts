import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/testimonials -> Fetch approved testimonials for homepage
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json({ success: true, data: testimonials })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/testimonials -> Submit a new testimonial
export async function POST(req: NextRequest) {
  try {
    const { name, role, content, rating } = await req.json()
    
    if (!name || !content || !rating) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role: role || '',
        content,
        rating: Number(rating),
        status: 'PENDING', // Admin needs to approve it
      },
    })
    return NextResponse.json({ success: true, data: testimonial })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
