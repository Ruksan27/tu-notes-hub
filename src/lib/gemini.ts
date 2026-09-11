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

let globalKeyIndex = 0

export function getNextApiKey(): string {
  const keys = getValidKeys()
  if (keys.length === 0) return ''
  const key = keys[globalKeyIndex % keys.length]
  globalKeyIndex = (globalKeyIndex + 1) % keys.length
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

  // Rotate starting key for every request across all available API keys
  const startKeyIdx = globalKeyIndex
  globalKeyIndex = (globalKeyIndex + 1) % keys.length

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
    
    // Valid Top Gemini Models
    const modelsToRace = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-pro',
    ]
    
    const promises = modelsToRace.map(async (model, index) => {
      // Pick a distinct API key rotated per request and per model index
      const keyIdx = (startKeyIdx + index) % keys.length
      const apiKey = keys[keyIdx]
      
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const geminiModel = genAI.getGenerativeModel({
          model: model,
          systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
        })
        
        const result = await geminiModel.generateContent(parts)
        const text = result.response.text()
        if (text) {
          console.log(`[Gemini SDK] ✅ ${model} (Key #${keyIdx + 1}/${keys.length}) answered!`)
          return text
        }
      } catch (err: any) {
        // If rate limit (429) or quota error occurs, retry immediately with next key
        if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
          console.warn(`[Gemini SDK] Key #${keyIdx + 1} hit quota/429 on ${model}. Retrying with next key...`)
          const fallbackKey = keys[(keyIdx + 1) % keys.length]
          const genAI = new GoogleGenerativeAI(fallbackKey)
          const geminiModel = genAI.getGenerativeModel({
            model: model,
            systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
          })
          const result = await geminiModel.generateContent(parts)
          const text = result.response.text()
          if (text) {
            console.log(`[Gemini SDK Fallback] ✅ ${model} (Fallback Key) answered!`)
            return text
          }
        }
        throw err
      }
      throw new Error(`Empty response from ${model}`)
    })

    // RACE! Whichever Gemini model answers first without error, wins!
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
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
  ]

  const startIdx = globalKeyIndex
  globalKeyIndex = (globalKeyIndex + 1) % keys.length

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]
    const apiKey = keys[(startIdx + i) % keys.length]
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

  // 2. Fallback to Nvidia API
  const nvidiaModels = hasImages 
    ? ['meta/llama-3.2-11b-vision-instruct']
    : ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct']
    
  for (const m of nvidiaModels) {
    try {
      const text = await callNvidia(m, messages)
      if (text) {
        console.log(`[Nvidia Fallback] ✅ ${m} answered!`)
        return text
      }
    } catch (e: any) {
      console.warn(`[Nvidia] ${m} failed:`, e?.message || e)
      continue
    }
  }
  console.warn('[Nvidia] all models failed or returned empty, falling back to Groq...')

  // 3. Fallback to Groq API
  const groqModels = hasImages
    ? ['llama-3.2-11b-vision-preview']
    : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']

  for (const m of groqModels) {
    try {
      const text = await callGroq(m, messages)
      if (text) {
        console.log(`[Groq Fallback] ✅ ${m} answered!`)
        return text
      }
    } catch (e: any) {
      console.warn(`[Groq] ${m} failed:`, e?.message || e)
      continue
    }
  }
  console.warn('[Groq] all models failed or returned empty')

  throw new Error('All AI providers (Gemini, Nvidia, Groq) failed to respond. Please check your API keys or try again later.')
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

function repairJsonString(input: string): string {
  let s = input
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const firstBrace = s.search(/[\{\[]/)
  const lastBrace = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1)
  }

  // Remove trailing commas before closing braces/brackets
  s = s.replace(/,\s*([\}\]])/g, '$1')

  // Escape single backslashes that are not valid JSON escape sequences
  s = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')

  // Escape literal unescaped control characters inside quotes
  let inString = false
  let escaped = false
  let result = ''

  for (let i = 0; i < s.length; i++) {
    const char = s[i]

    if (char === '"' && !escaped) {
      inString = !inString
      result += char
    } else if (char === '\\' && !escaped) {
      escaped = true
      result += char
    } else {
      if (escaped) escaped = false
      
      if (inString) {
        if (char === '\n') result += '\\n'
        else if (char === '\r') result += '\\r'
        else if (char === '\t') result += '\\t'
        else if (char.charCodeAt(0) < 32) result += ''
        else result += char
      } else {
        result += char
      }
    }
  }

  return result
}

function autoCloseJson(str: string): string {
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '"' && !escaped) {
      inString = !inString
    } else if (char === '\\' && !escaped) {
      escaped = true
    } else {
      if (escaped) escaped = false
      if (!inString) {
        if (char === '{') stack.push('}')
        else if (char === '[') stack.push(']')
        else if (char === '}' || char === ']') stack.pop()
      }
    }
  }

  let closed = str
  if (inString) closed += '"'
  while (stack.length > 0) {
    closed += stack.pop()
  }
  return closed
}

export function extractMcqsWithRegex(raw: string): any[] {
  const mcqs: any[] = []
  
  // Find all MCQ objects inside the string
  const objectBlocks = raw.match(/\{[^{}]*"question"[^{}]*\}/gi) || []
  
  for (const block of objectBlocks) {
    try {
      const qMatch = block.match(/"question"\s*:\s*"([^"]+)"/i)
      const corrMatch = block.match(/"correctOption"\s*:\s*(\d+)/i)
      const expMatch = block.match(/"explanation"\s*:\s*"([^"]+)"/i)
      const optionsMatch = block.match(/"options"\s*:\s*\[([^\]]+)\]/i)

      if (qMatch && optionsMatch) {
        const rawOpts = optionsMatch[1].match(/"([^"]+)"/g)?.map(o => o.slice(1, -1)) || []
        if (rawOpts.length >= 2) {
          mcqs.push({
            question: qMatch[1],
            options: rawOpts,
            correctOption: corrMatch ? parseInt(corrMatch[1], 10) : 0,
            explanation: expMatch ? expMatch[1] : ''
          })
        }
      }
    } catch {
      continue
    }
  }

  return mcqs
}

// Robust helper to parse AI-generated JSON (handles LaTeX backslashes, markdown blocks, control chars)
export function cleanAndParseJSON(raw: string): any {
  if (!raw) throw new Error('AI returned an empty response string')

  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const firstBrace = cleaned.search(/[\{\[]/)
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  // Attempt 1: Standard JSON parse
  try {
    return JSON.parse(cleaned)
  } catch (err1) {
    // Attempt 2: Repaired JSON string (escaped control chars, trailing commas, single backslashes)
    try {
      const repaired = repairJsonString(cleaned)
      return JSON.parse(repaired)
    } catch (err2) {
      // Attempt 3: Auto-close truncated JSON
      try {
        const repaired = repairJsonString(cleaned)
        const closed = autoCloseJson(repaired)
        return JSON.parse(closed)
      } catch (err3) {
        // Attempt 4: MCQ Regex Fallback
        if (raw.toLowerCase().includes('question')) {
          const fallbackMcqs = extractMcqsWithRegex(raw)
          if (fallbackMcqs.length > 0) {
            console.warn(`[cleanAndParseJSON] Extracted ${fallbackMcqs.length} MCQs via regex fallback.`)
            return fallbackMcqs
          }
        }

        console.error('[cleanAndParseJSON Failed]', {
          error: (err1 as Error)?.message,
          rawSample: raw.slice(0, 400)
        })
        throw err1
      }
    }
  }
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

IMPORTANT: Ensure all LaTeX/math symbols use valid JSON escape sequences (e.g. \\\\Delta instead of \\Delta).
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
  return cleanAndParseJSON(raw)
}

// Generate MCQs based on past papers and existing subject MCQs
export async function generateMcqs(
  subjectTitle: string,
  papersText: Array<{ year: number; text: string }>,
  referenceMcqs?: Array<{ question: string; options: string[]; correctOption?: number; explanation?: string | null }>
): Promise<any[]> {
  const papersContext = papersText
    .map((p) => `=== YEAR ${p.year} ===\n${p.text}`)
    .join('\n\n')

  let referenceContext = ''
  if (referenceMcqs && referenceMcqs.length > 0) {
    const sampleMcqs = referenceMcqs.slice(0, 15)
    referenceContext = `\n=== EXISTING PAST MCQs FOR THIS SUBJECT (Use as reference style guide & avoid duplicates) ===\n` +
      sampleMcqs.map((m, i) => `${i + 1}. Q: ${m.question}\n   Options: ${Array.isArray(m.options) ? m.options.join(', ') : m.options}`).join('\n')
  }

  const hasReference = referenceMcqs && referenceMcqs.length > 0

  const prompt = `
You are an expert TU (Tribhuvan University) examiner.

Analyze these past exam papers for subject: "${subjectTitle}"

${papersContext}
${referenceContext}

Task:
Generate 10 high-yield Multiple Choice Questions (MCQs) that are highly likely to appear in future TU exams based on the concepts tested in these past papers.

Guidelines:
1. ${hasReference 
    ? 'Use the existing past MCQs as reference to learn the question pattern, syllabus scope, and difficulty. Generate new, high-yield questions without creating exact duplicates.' 
    : 'Since no prior MCQs are stored in the database, extract key concepts, topics, and question patterns directly from the provided past question papers and convert them into high-yield MCQs.'}
2. Ensure options are realistic, clear, accurate, and unambiguous.

IMPORTANT: Ensure all LaTeX/math symbols use valid JSON escape sequences (e.g. \\\\Delta instead of \\Delta).
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
  try {
    const parsed = cleanAndParseJSON(raw)
    return Array.isArray(parsed) ? parsed : (parsed?.mcqs || [])
  } catch (err) {
    console.warn('[generateMcqs] JSON parse failed, attempting regex extraction fallback...')
    const fallback = extractMcqsWithRegex(raw)
    return fallback
  }
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

IMPORTANT: Ensure all LaTeX/math symbols use valid JSON escape sequences (e.g. \\\\Delta instead of \\Delta).
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
  try {
    const parsed = cleanAndParseJSON(raw)
    return Array.isArray(parsed) ? parsed : (parsed?.mcqs || [])
  } catch (err) {
    console.warn('[generateMcqsFromImage] JSON parse failed, attempting regex extraction fallback...')
    const fallback = extractMcqsWithRegex(raw)
    return fallback
  }
}

