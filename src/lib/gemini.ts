// src/lib/gemini.ts
import { GoogleGenAI } from '@google/genai'

const API_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_API_KEY,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY,
].filter(Boolean) as string[]

let currentKeyIndex = 0

function getNextApiKey(): string {
  if (API_KEYS.length === 0) return ''
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<string> {
  if (API_KEYS.length === 0) {
    console.warn('[Gemini] No GEMINI_API_KEY set in environment variables.')
    return ''
  }

  let attempts = 0

  while (attempts < API_KEYS.length) {
    const apiKey = getNextApiKey()
    if (!apiKey) break

    try {
      const genAI = new GoogleGenAI({ apiKey })

      const contents: any[] = []
      if (imageBase64 && mimeType) {
        contents.push({ inlineData: { mimeType, data: imageBase64 } })
      }
      contents.push(prompt)

      let response: any
      try {
        response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          ...(systemInstruction ? { config: { systemInstruction } } : {}),
        })
      } catch (mErr1) {
        try {
          response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            ...(systemInstruction ? { config: { systemInstruction } } : {}),
          })
        } catch (mErr2) {
          response = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents,
            ...(systemInstruction ? { config: { systemInstruction } } : {}),
          })
        }
      }

      return response.text ?? ''
    } catch (error: any) {
      const isRateLimited =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('RESOURCE_EXHAUSTED')
      if (isRateLimited) {
        attempts++
        console.warn(`[Gemini] Key ${currentKeyIndex} rate limited. Rotating...`)
        continue
      }
      throw error
    }
  }

  throw new Error('All Gemini API keys are rate-limited. Please try again in a minute.')
}

// Extract text from a document URL (PDF or Image) using Gemini
export async function extractTextFromPdfUrl(url: string): Promise<string> {
  let targetUrl = url
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match) {
      targetUrl = `https://lh3.googleusercontent.com/d/${match[1]}`
    }
  }

  const res = await fetch(targetUrl)
  if (!res.ok) throw new Error(`Failed to fetch file for text extraction: ${res.statusText}`)
  const arrayBuffer = await res.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  let mimeType = 'application/pdf'
  if (url.toLowerCase().includes('.png')) mimeType = 'image/png'
  else if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) mimeType = 'image/jpeg'

  const prompt = `
Extract the exam paper content exactly as written and return it STRICTLY as a valid JSON object with the following structure (no markdown blocks, no extra text):
{
  "university": "TRIBHUVAN UNIVERSITY",
  "faculty": "Faculty of Humanities & Social Sciences",
  "office": "OFFICE OF THE DEAN",
  "year": "2020",
  "program": "Bachelor in Computer Application",
  "courseTitle": "Computer Graphics and Animation",
  "codeNo": "CACS 305",
  "semester": "V",
  "fullMarks": "60",
  "passMarks": "24",
  "time": "3 hours",
  "instruction": "Candidates are required to answer the questions in their own words as far as possible.",
  "groups": [
    {
      "groupName": "Group B",
      "marks": "[6 x 5 = 30]",
      "instruction": "Attempt any SIX questions.",
      "questions": [
        { "number": 2, "text": "What is computer graphics? Explain different application areas of computer graphics." }
      ]
    }
  ]
}
If any field is missing, use an empty string or omit it, but keep the structure intact. Ensure math symbols remain intact (e.g. $A(2,3)$ or $$x^2$$).
`;
  const rawResponse = await callGemini(prompt, undefined, base64, mimeType)
  
  // Clean up if gemini returned markdown code blocks
  return rawResponse.replace(/```json|```/g, '').trim()
}

// Analyze past papers and generate comparison report
export async function analyzePastPapers(
  subjectTitle: string,
  papersText: Array<{ year: number; text: string }>
): Promise<object> {
  const papersContext = papersText
    .map((p) => `=== YEAR ${p.year} ===\n${p.text}`)
    .join('\n\n')

  const prompt = `
You are an expert TU (Tribhuvan University) exam analyst.

Analyze these past exam papers for subject: "${subjectTitle}"

${papersContext}

Tasks:
1. Identify all unique question topics/concepts
2. Track which topics appear in which years
3. Calculate probability (0-100%) for each topic appearing in the NEXT exam
4. Classify as: LOW (<50%), MODERATE (50-75%), STRONG (>75%)
5. Generate a cheatsheet with key points for top topics

Return STRICTLY valid JSON only (no markdown, no extra text):
{
  "subject": "string",
  "analysisYears": [number],
  "topicAnalysis": [
    {
      "topic": "string",
      "chapter": "string",
      "questionsFound": ["question text from year X", "..."],
      "appearedInYears": [number],
      "frequencyCount": number,
      "probability": number,
      "classification": "LOW|MODERATE|STRONG",
      "reasoning": "string",
      "cheatsheetPoints": ["key point 1", "key point 2"]
    }
  ],
  "topPredictions": [
    {
      "predictedQuestion": "string",
      "probability": number,
      "marks": number
    }
  ],
  "generatedAt": "ISO date string"
}
`

  const raw = await callGemini(prompt)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// Generate MCQs based on past papers
export async function generateMcqs(
  subjectTitle: string,
  papersText: Array<{ year: number; text: string }>
): Promise<any[]> {
  const papersContext = papersText
    .map((p) => `=== YEAR ${p.year} ===\n${p.text}`)
    .join('\n\n')

  const prompt = `
You are an expert TU (Tribhuvan University) examiner.

Analyze these past exam papers for subject: "${subjectTitle}"

${papersContext}

Task:
Generate 10 high-yield Multiple Choice Questions (MCQs) that are highly likely to appear in future exams based on the concepts tested in these past papers.

Return STRICTLY valid JSON only as an ARRAY of objects (no markdown, no extra text):
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctOption": number (0 to 3),
    "explanation": "short explanation of the correct answer"
  }
]
`

  const raw = await callGemini(prompt)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// Generate MCQs directly from an image (question paper photo)
export async function generateMcqsFromImage(
  subjectTitle: string,
  imageBase64: string,
  mimeType: string
): Promise<any[]> {
  const prompt = `
You are an expert TU (Tribhuvan University) examiner looking at a question paper image for subject: "${subjectTitle}".

Look at this image carefully. It may contain handwritten or printed exam questions, MCQs, or study material.

Task:
Generate 10 high-yield Multiple Choice Questions (MCQs) based on the topics and questions visible in this image.
If the image already contains MCQs, extract and format them properly.
If it contains long-form questions, convert the key concepts into MCQs.

Return STRICTLY valid JSON only as an ARRAY of objects (no markdown, no extra text):
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctOption": number (0 to 3),
    "explanation": "short explanation of the correct answer"
  }
]
`

  const raw = await callGemini(prompt, undefined, imageBase64, mimeType)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
