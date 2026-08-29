// src/app/api/admin/subjects/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const semesterId = req.nextUrl.searchParams.get('semesterId')
  if (!semesterId) return NextResponse.json({ subjects: [] })

  const subjects = await prisma.subject.findMany({
    where: { semesterId },
    orderBy: { code: 'asc' },
  })
  return NextResponse.json({ subjects })
}

export async function POST(req: NextRequest) {
  try {
    const { title, code, semesterId } = await req.json()
    if (!title || !code || !semesterId) {
      return NextResponse.json({ error: 'Title, code, and semester are required' }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: { title, code, semesterId }
    })
    return NextResponse.json({ subject, message: 'Subject created successfully' })
  } catch (error) {
    console.error('[ADD_SUBJECT]', error)
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
  }
}
