// src/lib/gemini.ts

function getValidKeys() {
  const keys = [
    process.env.GEMINI_KEY_ANSWER_SOLVER,
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ].filter(Boolean) as string[]
  
  return keys
}

const API_KEYS = getValidKeys()

let currentKeyIndex = 0

export function getNextApiKey(): string {
  if (API_KEYS.length === 0) return ''
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

import { GoogleGenerativeAI } from '@google/generative-ai'

async function callOfficialGemini(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string; mimeType: string }[]
): Promise<string> {
  const keys = getValidKeys()
  if (keys.length === 0) return ''

  try {
    // Construct parts array for the SDK
    const parts: any[] = []
    parts.push({ text: prompt })

    if (images && images.length > 0) {
      for (const img of images) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.base64
          }
        })
      }
    }
    
    // Valid Google Generative AI Models
    const modelsToRace = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-pro',
      'gemini-1.5-flash', // Keep as final fallback
    ]
    
    const promises = modelsToRace.map(async (model, index) => {
      // Rotate through available API keys for each request
      const apiKey = keys[index % keys.length]
      const genAI = new GoogleGenerativeAI(apiKey)
      
      const geminiModel = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
      })
      
      const result = await geminiModel.generateContent(parts)
      const text = result.response.text()
      if (text) {
        console.log(`[Gemini SDK] ✅ ${model} answered!`)
        return text
      }
      throw new Error(`Empty response from ${model}`)
    })

    // RACE! Whichever Gemini model answers first without 503 error, wins!
    const fastestResponse = await Promise.any(promises)
    return fastestResponse

  } catch (e: any) {
    console.error('[Gemini SDK All Models Failed]', e?.message || e)
  }
  
  return ''
}

// Call Nvidia REST API (OpenAI Compatible)
async function callNvidia(
  modelName: string,
  messages: any[],
  timeoutMs = 45_000
): Promise<string> {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
  if (!NVIDIA_API_KEY) {
    console.warn('[Nvidia] API Key is missing in .env')
    return ''
  }
  
  const baseUrl = `https://integrate.api.nvidia.com/v1/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content ?? ''
      if (text) return text
    } else {
      const errBody = await res.text()
      console.warn(`[Nvidia] ${modelName} → ${res.status}: ${errBody.substring(0, 200)}`)
      const err: any = new Error(`Nvidia ${res.status}: ${errBody.substring(0, 150)}`)
      err.status = res.status
      throw err
    }
  } catch (e: any) {
    clearTimeout(timer)
    throw e
  }
  return ''
}

// Call Groq API (OpenAI Compatible)
export async function callGroq(
  modelName: string,
  messages: any[],
  timeoutMs = 45_000
): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY
  if (!GROQ_API_KEY) {
    console.warn('[Groq] API Key is missing in .env')
    return ''
  }
  
  const baseUrl = `https://api.groq.com/openai/v1/chat/completions`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content ?? ''
      if (text) return text
    } else {
      const errBody = await res.text()
      console.warn(`[Groq] ${modelName} → ${res.status}: ${errBody.substring(0, 200)}`)
      const err: any = new Error(`Groq ${res.status}: ${errBody.substring(0, 150)}`)
      err.status = res.status
      throw err
    }
  } catch (e: any) {
    clearTimeout(timer)
    throw e
  }
  return ''
}

export async function* callGeminiStream(
  prompt: string,
  systemInstruction?: string
): AsyncGenerator<string, void, unknown> {
  const keys = getValidKeys()
  if (keys.length === 0) throw new Error('No API keys available')

  const modelsToTry = [
    'gemini-3.5-flash-lite',
    'gemini-1.5-flash',
  ]

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]
    const apiKey = keys[i % keys.length]
    const genAI = new GoogleGenerativeAI(apiKey)
    
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
    })

    try {
      const parts = [{ text: prompt }]
      const result = await geminiModel.generateContentStream(parts)
      
      let gotChunk = false
      for await (const chunk of result.stream) {
        gotChunk = true
        const chunkText = chunk.text()
        if (chunkText) {
          yield chunkText
        }
      }
      
      if (gotChunk) return // Successfully streamed all chunks
    } catch (e: any) {
      console.warn(`[Gemini SDK Stream] Model ${model} failed, trying next...`, e?.message || e)
    }
  }
  
  throw new Error('All AI models failed. Please check your API keys or try again later.')
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string, mimeType: string }[]
): Promise<string> {
  // 1. Try Official Gemini First
  const geminiText = await callOfficialGemini(prompt, systemInstruction, images)
  if (geminiText) return geminiText
  console.warn('[Gemini] failed or returned empty, falling back to Nvidia')

  // Build OpenAI-compatible messages array for fallback providers
  const messages: any[] = []
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction })
  }

  const validImages = images?.filter(img => img.mimeType.startsWith('image/')) || []
  const hasImages = validImages.length > 0

  const userContent: any[] = []
  if (hasImages) {
    for (const img of validImages) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      })
    }
  }
  userContent.push({ type: 'text', text: prompt })
  messages.push({ role: 'user', content: userContent })

  // 2. Fallback to Nvidia
  const nvidiaModels = hasImages 
    ? ['meta/llama-3.2-11b-vision-instruct']
    : ['meta/llama-3.1-70b-instruct', 'meta/llama-3.1-8b-instruct']
    
  for (const m of nvidiaModels) {
    try {
      const text = await callNvidia(m, messages)
      if (text) return text
    } catch (e) { continue }
  }
  console.warn('[Nvidia] failed or returned empty, falling back to Groq')

  // 3. Fallback to Groq
  if (!hasImages) { // Groq vision is limited, use text models
    const groqModels = ['llama-3.1-70b-versatile', 'llama3-8b-8192']
    for (const m of groqModels) {
      try {
        const text = await callGroq(m, messages)
        if (text) return text
      } catch (e) { continue }
    }
    console.warn('[Groq] failed or returned empty')
  }

  throw new Error('All AI models failed. Please check your API keys or try again later.')
}

// Dedicated Multi-Provider Helper for High Reliability AI Tasks
export async function callMultiProviderAI(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string; mimeType: string }[]
): Promise<string> {
  return callGemini(prompt, systemInstruction, images)
}

// Custom Fallback for Project Valuation (Groq -> Nvidia -> Gemini)
export async function callProjectValuationAI(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  // Use the multi-provider race (Promise.any) which is much faster and more reliable
  return callGemini(prompt, systemInstruction)
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

  // 15-second timeout on the PDF fetch — prevents hanging when Cloudinary is slow
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  let res: Response
  try {
    res = await fetch(targetUrl, { signal: controller.signal })
  } catch (fetchErr: any) {
    clearTimeout(timeoutId)
    if (fetchErr?.name === 'AbortError') {
      console.warn('[OCR] PDF fetch timed out after 15s. Skipping OCR.')
      return ''
    }
    throw fetchErr
  }
  clearTimeout(timeoutId)

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
      "groupName": "Group A",
      "marks": "[10 x 1 = 10]",
      "instruction": "Attempt all questions.",
      "questions": [
        {
          "number": 1,
          "text": "What is the original point if it is reflected relative to diagonal line y = x such that the reflected point is (5, 6)?",
          "options": ["(-5, -6)", "(5, -6)", "(6, 5)", "(-6, -5)"],
          "correctOption": 2,
          "explanation": "Reflection across y = x swaps x and y coordinates, turning (x, y) into (y, x)."
        }
      ]
    },
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
If any question is a Multiple Choice Question (MCQ), ALWAYS extract its 4 options into the "options" array, determine the "correctOption" index (0, 1, 2, or 3), and add a concise "explanation". If any field is missing, use an empty string or omit it, but keep the structure intact. Ensure math symbols remain intact (e.g. $A(2,3)$ or $$x^2$$).
`;
  const rawResponse = await callGemini(prompt, undefined, [{ base64, mimeType }])
  
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
  images: { base64: string, mimeType: string }[]
): Promise<any[]> {
  const prompt = `
You are an expert TU (Tribhuvan University) examiner looking at ${images.length} image(s) of a question paper for subject: "${subjectTitle}".

Look at ALL provided images carefully. They represent multiple pages of the SAME exam paper.
The questions might be numbered as 1, 2, 3... or i, ii, iii... or Q1, Q2... Make sure you don't extract the same question twice.

Task:
Generate 10 high-yield Multiple Choice Questions (MCQs) based on the topics and questions visible across all these images.
If the images already contain MCQs, extract and format ALL unique ones properly.
If they contain long-form questions, convert the key concepts into MCQs.

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

  const raw = await callGemini(prompt, undefined, images)
  const cleaned = raw.replace(/```json|```/g, '').trim()
  
  if (!cleaned) {
    throw new Error('AI returned an empty response. Please check API keys or try again.')
  }
  
  return JSON.parse(cleaned)
}
