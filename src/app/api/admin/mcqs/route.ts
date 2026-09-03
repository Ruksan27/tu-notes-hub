import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get('subjectId')
  if (!subjectId) return NextResponse.json({ mcqs: [] })

  try {
    const mcqs = await prisma.mCQ.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ mcqs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { subjectId, mcqs } = await req.json()
    if (!subjectId || !Array.isArray(mcqs)) {
      return NextResponse.json({ error: 'subjectId and array of mcqs are required' }, { status: 400 })
    }

    // Delete existing MCQs for this subject if we are replacing them
    // Wait, let's just add new ones or update. 
    // Usually it's better to just delete and recreate for simplicity, OR we can accept an array of new ones.
    // Let's assume we are adding new ones or replacing. We'll add a 'mode' flag.
    // By default, let's just append them.
    
    const created = await prisma.mCQ.createMany({
      data: mcqs.map((m: any) => ({
        question: m.question,
        options: m.options,
        correctOption: m.correctOption,
        explanation: m.explanation || null,
        year: m.year || null,
        examCategory: m.examCategory || null,
        subjectId
      }))
    })

    return NextResponse.json({ success: true, count: created.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await prisma.mCQ.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
