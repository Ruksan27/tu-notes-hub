// src/app/api/ai/compare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzePastPapers } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    if (user.packageType !== 'ELITE_AI') {
      return NextResponse.json({
        error: 'This feature is exclusive to Elite AI Pass holders. Upgrade to unlock.',
        upgradeRequired: true,
      }, { status: 403 })
    }

    const { subjectId, paperIds } = await req.json()

    if (!subjectId || !paperIds?.length) {
      return NextResponse.json({ error: 'Subject and papers are required' }, { status: 400 })
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const papers = await prisma.pastPaper.findMany({
      where: { id: { in: paperIds }, subjectId },
      orderBy: { year: 'asc' },
    })

    if (papers.length < 2) {
      return NextResponse.json({ error: 'Please select at least 2 past papers to compare' }, { status: 400 })
    }

    // Only papers with extracted text can be analyzed
    const validPapers = papers.filter((p) => p.extractedText)
    if (validPapers.length < 2) {
      return NextResponse.json({
        error: 'Papers need to be processed by admin first. Please contact admin.',
      }, { status: 422 })
    }

    const papersData = validPapers.map((p) => ({
      year: p.year,
      text: p.extractedText!,
    }))

    const report = await analyzePastPapers(subject.title, papersData)

    return NextResponse.json({ report, subjectTitle: subject.title })
  } catch (error) {
    console.error('[AI_COMPARE]', error)
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}
