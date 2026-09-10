import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMcqs, extractTextFromPdfUrl } from '@/lib/gemini'
import { saveUserAiHistory } from '@/lib/cacheDb'

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

    // Fetch existing MCQs from Database for this subject
    const existingDbMcqs = await prisma.mCQ.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' }
    })

    const formattedExistingMcqs = existingDbMcqs.map((m: any) => ({
      question: m.question,
      options: typeof m.options === 'string' ? JSON.parse(m.options) : (Array.isArray(m.options) ? m.options : []),
      correctOption: m.correctOption,
      explanation: m.explanation || '',
      year: m.year || null,
      source: 'Database'
    }))

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
    const newAiMcqs = await generateMcqs(subject.title, papersData)

    // Save newly generated MCQs into DB for permanent record
    if (Array.isArray(newAiMcqs) && newAiMcqs.length > 0) {
      try {
        const mcqInsertData = newAiMcqs.map((m: any) => ({
          question: m.question,
          options: m.options,
          correctOption: typeof m.correctOption === 'number' ? m.correctOption : 0,
          explanation: m.explanation || null,
          subjectId: subject.id,
        }))
        await prisma.mCQ.createMany({ data: mcqInsertData })
      } catch (dbErr) {
        console.warn('[AI_MCQ_SAVE_DB_WARN]', dbErr)
      }
    }

    // Combine newly generated AI MCQs + Previous DB MCQs
    const allMcqs = [...newAiMcqs, ...formattedExistingMcqs]

    // Deduplicate MCQs by question text
    const uniqueMcqs: any[] = []
    const seenQuestions = new Set<string>()
    for (const item of allMcqs) {
      const qKey = item.question?.trim().toLowerCase()
      if (qKey && !seenQuestions.has(qKey)) {
        seenQuestions.add(qKey)
        uniqueMcqs.push(item)
      }
    }

    // ── Save to User History (fire-and-forget) ────────────────────
    const uid = user.id || user.userId
    const usedYears = papers.map((p) => p.year).sort()
    if (uid) {
      saveUserAiHistory(uid, 'MCQ_SET', subject.title, {
        mcqs: uniqueMcqs,
        subjectTitle: subject.title,
        years: usedYears,
        totalCount: uniqueMcqs.length,
      }).catch(console.error)
    }

    return NextResponse.json({ mcqs: uniqueMcqs })
  } catch (error) {
    console.error('[AI_MCQ_GENERATE]', error)
    return NextResponse.json({ error: 'AI MCQ generation failed. Please try again.' }, { status: 500 })
  }
}
