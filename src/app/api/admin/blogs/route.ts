import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ blogs })
  } catch (error) {
    console.error('Error fetching admin blogs:', error)
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { title, slug, thumbnailUrl, content, excerpt, metaTitle, metaDesc, keywords, author, isPublished, fileUrl } = data

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 })
    }

    // Handle slug collision
    let uniqueSlug = slug
    let counter = 1
    while (await prisma.blog.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: uniqueSlug,
        thumbnailUrl,
        content,
        excerpt,
        metaTitle,
        metaDesc,
        keywords,
        author: author || 'TU Notes Hub',
        isPublished: isPublished ?? false,
        fileUrl: fileUrl || null
      }
    })

    return NextResponse.json({ success: true, blog })
  } catch (error: any) {
    console.error('Error creating blog:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A blog with this slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 })
  }
}
