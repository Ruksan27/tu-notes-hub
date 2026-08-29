// src/app/api/ai/compare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzePastPapers, extractTextFromPdfUrl } from '@/lib/gemini'
import {
  buildComparisonKey,
  getCachedComparison,
  saveComparisonReport,
} from '@/lib/cacheDb'

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

    // ── Cache Check ──────────────────────────────────────────────
    const cacheKey = buildComparisonKey(subjectId, paperIds)
    const cached = await getCachedComparison(cacheKey)
    if (cached) {
      return NextResponse.json({ report: cached, fromCache: true })
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
      return NextResponse.json({ error: 'Please select at least 2 past papers to compare' }, { status: 400 })
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
          console.error(`[AI_COMPARE_EXTRACT_FAILED] Year ${paper.year}:`, extractErr)
          return NextResponse.json({ 
            error: `Failed to process paper for year ${paper.year}: ${extractErr.message || 'Unknown error'}` 
          }, { status: 500 })
        }
      }
      papersData.push({ year: paper.year, text })
    }

    // ── AI Analysis ──────────────────────────────────────────────
    const report = await analyzePastPapers(subject.title, papersData)

    // ── Save to Cache (fire-and-forget) ──────────────────────────
    saveComparisonReport(cacheKey, subject.title, report).catch(console.error)

    return NextResponse.json({ report, fromCache: false })
  } catch (error) {
    console.error('[AI_COMPARE]', error)
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}
