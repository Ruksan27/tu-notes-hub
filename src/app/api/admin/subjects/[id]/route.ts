// src/app/api/admin/subjects/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** GET /api/admin/subjects/:id — fetch a single subject by ID */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

  const subject = await prisma.subject.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      title: true,
      semesterId: true,
      semester: {
        select: {
          order: true,
          facultyId: true,
        },
      },
    },
  })

  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  return NextResponse.json({ subject })
}

/** PATCH /api/admin/subjects/:id — update subject title / code */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const body = await req.json()
    const { title, code } = body

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(code !== undefined ? { code } : {}),
      },
    })
    return NextResponse.json({ subject, message: 'Subject updated' })
  } catch (error) {
    console.error('[PATCH_SUBJECT]', error)
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
  }
}

/** DELETE /api/admin/subjects/:id — delete a subject */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    await prisma.subject.delete({ where: { id } })
    return NextResponse.json({ message: 'Subject deleted' })
  } catch (error) {
    console.error('[DELETE_SUBJECT]', error)
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
  }
}
