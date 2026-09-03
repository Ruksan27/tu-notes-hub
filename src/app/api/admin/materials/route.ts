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
    const semesterId = searchParams.get('semesterId')

    if (!subjectId && !semesterId) {
      return NextResponse.json({ error: 'Subject ID or Semester ID is required' }, { status: 400 })
    }

    if (semesterId) {
      // Fetch full semester guides (SolutionBooks with no subjectId)
      const solutionBooks = await prisma.solutionBook.findMany({
        where: { semesterId, subjectId: null },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ notes: [], pastPapers: [], cheatsheets: [], solutionBooks })
    }

    // Fetch subject-specific materials
    const notes = await prisma.note.findMany({
      where: { subjectId: subjectId as string },
      orderBy: { createdAt: 'desc' }
    })

    const pastPapers = await prisma.pastPaper.findMany({
      where: { subjectId: subjectId as string },
      orderBy: { year: 'desc' }
    })

    const cheatsheets = await prisma.cheatsheet.findMany({
      where: { subjectId: subjectId as string },
      orderBy: { createdAt: 'desc' }
    })

    const solutionBooks = await prisma.solutionBook.findMany({
      where: { subjectId: subjectId as string },
      orderBy: { createdAt: 'desc' }
    })

    const mcqs = await prisma.mCQ.findMany({
      where: { subjectId: subjectId as string },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ notes, pastPapers, cheatsheets, solutionBooks, mcqs })
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

    if (type !== 'mcq-set' && (!id || !type)) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    let updated;

    if (type === 'note') {
      updated = await prisma.note.update({
        where: { id },
        data: {
          ...(fields.title !== undefined ? { title: fields.title } : {}),
          ...(fields.description !== undefined ? { description: fields.description } : {}),
          ...(fields.noteType !== undefined ? { noteType: fields.noteType } : {}),
          ...(fields.isPremium !== undefined ? { isPremium: fields.isPremium } : {}),
          ...(fields.author !== undefined ? { author: fields.author } : {}),
          ...(fields.extractedText !== undefined ? { extractedText: fields.extractedText } : {}),
        }
      })
    } else if (type === 'pastpaper') {
      updated = await prisma.pastPaper.update({
        where: { id },
        data: {
          ...(fields.year !== undefined ? { year: parseInt(fields.year) } : {}),
          ...(fields.examType !== undefined ? { examType: fields.examType } : {}),
          ...(fields.extractedText !== undefined ? { extractedText: fields.extractedText } : {}),
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
    } else if (type === 'mcq') {
      updated = await prisma.mCQ.update({
        where: { id },
        data: {
          question: fields.question,
          options: fields.options,
          correctOption: parseInt(fields.correctOption),
          explanation: fields.explanation || null,
          year: fields.year ? parseInt(fields.year) : null,
          examCategory: fields.examCategory || null,
        }
      })
    } else if (type === 'mcq-set') {
      const { ids, year, examCategory } = fields
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids array is required for mcq-set update' }, { status: 400 })
      }
      const parsedYear = year !== null && year !== undefined && year !== '' ? parseInt(`${year}`) : null
      await prisma.mCQ.updateMany({
        where: { id: { in: ids } },
        data: {
          year: isNaN(parsedYear as number) ? null : parsedYear,
          examCategory: examCategory || null,
        }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('Error updating material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function extractPublicId(url: string) {
  try {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      let path = parts[1]
      if (path.match(/^v\d+\//)) {
        path = path.substring(path.indexOf('/') + 1)
      }
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
    } else if (type === 'mcq') {
      await prisma.mCQ.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
