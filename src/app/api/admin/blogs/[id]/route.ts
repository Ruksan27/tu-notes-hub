import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, context: any) {
  const { id } = await context.params
  try {
    const data = await req.json()
    const { title, slug, thumbnailUrl, content, excerpt, metaTitle, metaDesc, keywords, author, isPublished, fileUrl } = data

    // Handle slug collision, ignoring self
    let uniqueSlug = slug
    let counter = 1
    let existing = await prisma.blog.findUnique({ where: { slug: uniqueSlug } })
    while (existing && existing.id !== id) {
      uniqueSlug = `${slug}-${counter}`
      existing = await prisma.blog.findUnique({ where: { slug: uniqueSlug } })
      counter++
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        slug: uniqueSlug,
        thumbnailUrl,
        content,
        excerpt,
        metaTitle,
        metaDesc,
        keywords,
        author,
        isPublished,
        fileUrl: fileUrl || null
      }
    })

    return NextResponse.json({ success: true, blog })
  } catch (error: any) {
    console.error('Error updating blog:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A blog with this slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params
  try {
    await prisma.blog.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 })
  }
}
