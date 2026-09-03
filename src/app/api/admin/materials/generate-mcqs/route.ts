import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateMcqs, extractTextFromPdfUrl } from '@/lib/gemini'

export const maxDuration = 60 // 60s timeout for AI generation

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paperId } = await req.json()
    if (!paperId) {
      return NextResponse.json({ error: 'paperId is required' }, { status: 400 })
    }

    const paper = await prisma.pastPaper.findUnique({
      where: { id: paperId },
      include: { subject: true }
    })

    if (!paper) {
      return NextResponse.json({ error: 'Past paper not found' }, { status: 404 })
    }

    // Extract text if not already extracted
    let text = paper.extractedText
    if (!text || !text.trim()) {
      if (!paper.cloudinaryUrl) {
        return NextResponse.json({ error: 'File URL missing for past paper' }, { status: 400 })
      }
      console.log(`[MCQ_GENERATE] Extracting text for paper ${paper.id}...`)
      text = await extractTextFromPdfUrl(paper.cloudinaryUrl)
      if (text) {
        await prisma.pastPaper.update({
          where: { id: paper.id },
          data: { extractedText: text }
        })
      }
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from document to generate MCQs' }, { status: 500 })
    }

    console.log(`[MCQ_GENERATE] Generating MCQs using Gemini for ${paper.subject.title} (${paper.year})...`)
    const generatedMcqs = await generateMcqs(paper.subject.title, [{ year: paper.year, text }])

    if (!Array.isArray(generatedMcqs) || generatedMcqs.length === 0) {
      return NextResponse.json({ error: 'AI did not return any MCQs. Please try again.' }, { status: 500 })
    }

    // Optionally delete previous auto-generated MCQs for this paper's subject & year
    await prisma.mCQ.deleteMany({
      where: {
        subjectId: paper.subjectId,
        year: paper.year,
      }
    })

    // Save newly generated MCQs into DB
    const createdData = generatedMcqs.map((m: any) => ({
      question: m.question,
      options: m.options,
      correctOption: typeof m.correctOption === 'number' ? m.correctOption : 0,
      explanation: m.explanation || null,
      year: paper.year,
      examCategory: paper.examType,
      subjectId: paper.subjectId,
    }))

    await prisma.mCQ.createMany({ data: createdData })

    return NextResponse.json({
      success: true,
      count: createdData.length,
      mcqs: createdData
    })
  } catch (error: any) {
    console.error('[GENERATE_MCQS_ERROR]', error)
    return NextResponse.json({ error: error.message || 'MCQ generation failed' }, { status: 500 })
  }
}
