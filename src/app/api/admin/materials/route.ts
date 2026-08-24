// src/app/api/admin/materials/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { deleteFromCloudinary } from '@/lib/cloudinary'

// GET: Fetch materials for a specific subject
export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const subjectId = url.searchParams.get('subjectId')

    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 })
    }

    const [notes, pastPapers, cheatsheets] = await Promise.all([
      prisma.note.findMany({
        where: { subjectId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pastPaper.findMany({
        where: { subjectId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cheatsheet.findMany({
        where: { subjectId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({ notes, pastPapers, cheatsheets })
  } catch (error) {
    console.error('[ADMIN_MATERIALS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

// PUT: Update a material's details
export async function PUT(request: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type, ...updateData } = body

    if (!id || !type) {
      return NextResponse.json({ error: 'id and type are required' }, { status: 400 })
    }

    let updated: any
    if (type === 'note') {
      // Only allow safe fields to update
      const { title, description, noteType, isPremium, author } = updateData
      updated = await prisma.note.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(noteType !== undefined && { noteType }),
          ...(isPremium !== undefined && { isPremium }),
          ...(author !== undefined && { author }),
        },
      })
    } else if (type === 'pastpaper') {
      const { year, examType } = updateData
      updated = await prisma.pastPaper.update({
        where: { id },
        data: {
          ...(year !== undefined && { year: parseInt(year) }),
          ...(examType !== undefined && { examType }),
        },
      })
    } else if (type === 'cheatsheet') {
      const { title, content } = updateData
      updated = await prisma.cheatsheet.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ item: updated, message: 'Updated successfully' })
  } catch (error) {
    console.error('[ADMIN_MATERIALS_PUT]', error)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

// DELETE: Delete a material and its Cloudinary file
export async function DELETE(request: Request) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'id and type are required' }, { status: 400 })
    }

    let cloudinaryUrl: string | null = null

    if (type === 'note') {
      const note = await prisma.note.findUnique({ where: { id } })
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      cloudinaryUrl = note.cloudinaryUrl
      await prisma.note.delete({ where: { id } })
    } else if (type === 'pastpaper') {
      const paper = await prisma.pastPaper.findUnique({ where: { id } })
      if (!paper) return NextResponse.json({ error: 'Past paper not found' }, { status: 404 })
      cloudinaryUrl = paper.cloudinaryUrl
      await prisma.pastPaper.delete({ where: { id } })
    } else if (type === 'cheatsheet') {
      await prisma.cheatsheet.delete({ where: { id } })
      // Cheatsheets don't have files in Cloudinary
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Delete from Cloudinary if there's a file
    if (cloudinaryUrl) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/CLOUD/TYPE/upload/vXXX/FOLDER/FILENAME.ext
        const urlParts = cloudinaryUrl.split('/upload/')
        if (urlParts[1]) {
          // Remove version prefix (v1234567/) and file extension
          let publicId = urlParts[1].replace(/^v\d+\//, '')
          publicId = publicId.replace(/\.[^.]+$/, '') // remove extension
          await deleteFromCloudinary(publicId, 'raw')
        }
      } catch (cloudErr) {
        console.error('[CLOUDINARY_DELETE]', cloudErr)
        // Don't fail the API call if Cloudinary cleanup fails
      }
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('[ADMIN_MATERIALS_DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}
