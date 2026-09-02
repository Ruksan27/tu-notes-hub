import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })
    }

    const notes = await prisma.note.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' }
    })

    const pastPapers = await prisma.pastPaper.findMany({
      where: { subjectId },
      orderBy: { year: 'desc' }
    })

    const cheatsheets = await prisma.cheatsheet.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' }
    })

    const solutionBooks = await prisma.solutionBook.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' }
    })

    // Also fetch semester-level solution books if a semesterId is passed, but for now we query by subjectId.
    // If a solution book doesn't have a subjectId, it is a full semester guide.
    return NextResponse.json({ notes, pastPapers, cheatsheets, solutionBooks })
  } catch (error: any) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await request.json()
    const { id, type, ...fields } = data

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    let updated;

    if (type === 'note') {
      updated = await prisma.note.update({
        where: { id },
        data: {
          title: fields.title,
          description: fields.description,
          noteType: fields.noteType,
          isPremium: fields.isPremium,
          author: fields.author,
        }
      })
    } else if (type === 'pastpaper') {
      updated = await prisma.pastPaper.update({
        where: { id },
        data: {
          year: parseInt(fields.year),
          examType: fields.examType,
        }
      })
    } else if (type === 'cheatsheet') {
      updated = await prisma.cheatsheet.update({
        where: { id },
        data: {
          title: fields.title,
          content: fields.content,
        }
      })
    } else if (type === 'solutionbook') {
      updated = await prisma.solutionBook.update({
        where: { id },
        data: {
          title: fields.title,
          description: fields.description,
          isPremium: fields.isPremium,
          author: fields.author,
        }
      })
    }

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function extractPublicId(url: string) {
  // Rough extraction of cloudinary publicId from URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234567/tu-notes/my-file.pdf
  try {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      let path = parts[1]
      // remove version if exists
      if (path.match(/^v\d+\//)) {
        path = path.substring(path.indexOf('/') + 1)
      }
      // remove extension
      const dotIndex = path.lastIndexOf('.')
      if (dotIndex !== -1) {
        path = path.substring(0, dotIndex)
      }
      return path
    }
  } catch (e) {
    // ignore
  }
  return null
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    if (type === 'note') {
      const item = await prisma.note.findUnique({ where: { id } })
      if (item) {
        const publicId = extractPublicId(item.cloudinaryUrl)
        if (publicId) await deleteFromCloudinary(publicId, 'raw')
        await prisma.note.delete({ where: { id } })
      }
    } else if (type === 'pastpaper') {
      const item = await prisma.pastPaper.findUnique({ where: { id } })
      if (item) {
        const publicId = extractPublicId(item.cloudinaryUrl)
        if (publicId) await deleteFromCloudinary(publicId, 'raw')
        await prisma.pastPaper.delete({ where: { id } })
      }
    } else if (type === 'cheatsheet') {
      await prisma.cheatsheet.delete({ where: { id } })
    } else if (type === 'solutionbook') {
      const item = await prisma.solutionBook.findUnique({ where: { id } })
      if (item) {
        const publicId = extractPublicId(item.cloudinaryUrl)
        if (publicId) await deleteFromCloudinary(publicId, 'raw')
        await prisma.solutionBook.delete({ where: { id } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
