import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMcqs, extractTextFromPdfUrl } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    if (user.packageType !== 'ELITE_AI' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'This feature is exclusive to Elite AI Pass holders. Upgrade to unlock.',
        upgradeRequired: true,
      }, { status: 403 })
    }

    const { subjectId, paperIds } = await req.json()

    if (!subjectId || !paperIds?.length) {
      return NextResponse.json({ error: 'Subject and papers are required' }, { status: 400 })
    }

    // ── DB Lookup ────────────────────────────────────────────────
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const papers = await prisma.pastPaper.findMany({
      where: { id: { in: paperIds }, subjectId },
      orderBy: { year: 'asc' },
    })

    if (papers.length < 2) {
      return NextResponse.json({ error: 'Please select at least 2 past papers to generate MCQs' }, { status: 400 })
    }

    // ── Extract Text ─────────────────────────────────────────────
    const papersData: Array<{ year: number; text: string }> = []
    
    for (const paper of papers) {
      let text = paper.extractedText
      if (!text) {
        if (!paper.cloudinaryUrl) {
          return NextResponse.json({ error: `Paper for year ${paper.year} has no file attached` }, { status: 400 })
        }
        try {
          text = await extractTextFromPdfUrl(paper.cloudinaryUrl)
          await prisma.pastPaper.update({
            where: { id: paper.id },
            data: { extractedText: text }
          })
        } catch (extractErr: any) {
          console.error(`[AI_MCQ_EXTRACT_FAILED] Year ${paper.year}:`, extractErr)
          return NextResponse.json({ 
            error: `Failed to process paper for year ${paper.year}: ${extractErr.message || 'Unknown error'}` 
          }, { status: 500 })
        }
      }
      papersData.push({ year: paper.year, text })
    }

    // ── AI Analysis ──────────────────────────────────────────────
    const mcqs = await generateMcqs(subject.title, papersData)

    return NextResponse.json({ mcqs })
  } catch (error) {
    console.error('[AI_MCQ_GENERATE]', error)
    return NextResponse.json({ error: 'AI MCQ generation failed. Please try again.' }, { status: 500 })
  }
}
