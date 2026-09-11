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

    const { subjectId, paperIds, saveToDb } = await req.json()

    if (!subjectId || !paperIds?.length) {
      return NextResponse.json({ error: 'Subject and papers are required' }, { status: 400 })
    }

    const isAdmin = user.role === 'ADMIN'
    const shouldSaveToDb = isAdmin && Boolean(saveToDb)
    const minPapers = shouldSaveToDb ? 1 : 2

    // ── DB Lookup ────────────────────────────────────────────────
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const papers = await prisma.pastPaper.findMany({
      where: { id: { in: paperIds }, subjectId },
      orderBy: { year: 'asc' },
    })

    if (papers.length < minPapers) {
      return NextResponse.json({ 
        error: `Please select at least ${minPapers} past paper${minPapers > 1 ? 's' : ''} to generate MCQs` 
      }, { status: 400 })
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

    // ── ADMIN ONLY: Save to Public DB ───────────────────────────
    if (shouldSaveToDb) {
      if (Array.isArray(newAiMcqs) && newAiMcqs.length > 0) {
        try {
          const defaultYear = papers[papers.length - 1]?.year || new Date().getFullYear()
          const mcqInsertData = newAiMcqs.map((m: any) => ({
            question: m.question,
            options: typeof m.options === 'string' ? m.options : JSON.stringify(m.options),
            correctOption: typeof m.correctOption === 'number' ? m.correctOption : 0,
            explanation: m.explanation || null,
            subjectId: subject.id,
            year: typeof m.year === 'number' ? m.year : defaultYear,
            examCategory: 'BOARD_EXAM',
          }))
          await prisma.mCQ.createMany({ data: mcqInsertData })
        } catch (dbErr) {
          console.warn('[AI_MCQ_SAVE_DB_WARN]', dbErr)
        }
      }
      return NextResponse.json({ mcqs: newAiMcqs })
    }

    // ── STUDENT / ELITE USER: Save to 7-day Cache ONLY ───────────
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

    // Combine newly generated AI MCQs + Previous DB MCQs for personal study
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

    // Save to User History (7-day cache, fire-and-forget)
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
