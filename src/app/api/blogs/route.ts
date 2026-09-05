import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (slug) {
      // Get single blog post by slug
      const blog = await prisma.blog.findUnique({
        where: { slug, isPublished: true }
      })

      if (!blog) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }

      // Increment views
      await prisma.blog.update({
        where: { id: blog.id },
        data: { views: { increment: 1 } }
      })

      return NextResponse.json({ blog })
    }

    // Get all published blogs
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        excerpt: true,
        author: true,
        createdAt: true,
        views: true,
      }
    })

    return NextResponse.json({ blogs })
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 })
  }
}
