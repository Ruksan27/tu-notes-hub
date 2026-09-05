import { NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemInstruction = `You are an expert SEO Blog Writer for 'TU Notes Hub', an educational platform for Nepalese university students (TU - Tribhuvan University). 
Your task is to generate a highly engaging, SEO-optimized blog post in HTML format.

Rules:
1. Return ONLY the HTML body content (do not include <html>, <head>, or <body> tags).
2. Do NOT wrap the HTML in markdown code blocks like \`\`\`html. Just return the raw HTML string.
3. Use semantic HTML: <h2> for main headings, <h3> for subheadings, <ul>/<li> for lists, <strong> for emphasis.
4. DO NOT use an <h1> tag (the title will be rendered separately by the frontend).
5. The content should be well-structured, easy to read for students, and include relevant keywords.
6. Write in English, but keep the context relevant to Nepalese students and TU exams.
`

    const generatedHtml = await callGemini(prompt, systemInstruction)

    // Remove any markdown code block artifacts if the AI still includes them
    const cleanHtml = generatedHtml.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim()

    return NextResponse.json({ content: cleanHtml })
  } catch (error: any) {
    console.error('Error generating AI blog:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
