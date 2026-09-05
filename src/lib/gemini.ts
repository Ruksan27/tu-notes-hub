// src/lib/gemini.ts

function getValidKeys() {
  const keys = [
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

function getNextApiKey(): string {
  if (API_KEYS.length === 0) return ''
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

// Call Nvidia REST API (OpenAI Compatible)
async function callNvidia(
  modelName: string,
  messages: any[],
  timeoutMs = 45_000
): Promise<string> {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
  if (!NVIDIA_API_KEY) {
    console.warn('[Nvidia] NVIDIA_API_KEY is not set in environment variables.')
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

async function callOfficialGemini(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string; mimeType: string }[]
): Promise<string> {
  const apiKey = getNextApiKey()
  if (!apiKey) return ''

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  const contents: any[] = []
  const parts: any[] = []

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
  parts.push({ text: prompt })
  contents.push({ role: 'user', parts })

  const requestBody: any = { contents }
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    if (res.ok) {
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    }
  } catch (e) {
    console.warn('[Official Gemini API Failed]', e)
  }
  return ''
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string, mimeType: string }[]
): Promise<string> {

  // 1. Try Official Gemini API first if API key is present
  try {
    const geminiText = await callOfficialGemini(prompt, systemInstruction, images)
    if (geminiText) return geminiText
  } catch (err) {
    console.warn('[Official Gemini call failed, falling back to Nvidia/Groq]:', err)
  }
  
  // 2. Use real, verified Nvidia Nim models
  const MODELS_TO_TRY = [
    'meta/llama-3.3-70b-instruct',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'deepseek-ai/deepseek-r1',
    'qwen/qwen2.5-72b-instruct'
  ]

  // Build OpenAI-compatible messages array
  const messages: any[] = []
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction })
  }

  const userContent: any[] = []
  if (images && images.length > 0) {
    for (const img of images) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`
        }
      })
    }
  }
  userContent.push({ type: 'text', text: prompt })
  
  messages.push({ role: 'user', content: userContent })

  let lastError: any = null

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`[Nvidia AI] Trying model: ${modelName}`)
      const text = await callNvidia(modelName, messages)
      if (text) return text
    } catch (error: any) {
      lastError = error
      const status = error?.status ?? 0
      console.warn(`[Nvidia Model ${modelName} Failed (${status}): ${error?.message?.substring(0, 80)}]`)
      continue 
    }
  }

  console.warn(`[Nvidia AI] All models failed. Falling back to Groq AI...`)

  // 3. Groq fallback
  try {
    return await callGroq(prompt, systemInstruction, images)
  } catch (groqErr) {
    console.warn('[Groq Fallback Failed]. Skipping.')
    if (lastError) throw lastError
    throw new Error('All AI providers failed. Please try again later.')
  }
}

// Fetch available Groq models dynamically
async function getGroqModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!res.ok) return []
    const data = await res.json()
    const ids: string[] = (data.data ?? []).map((m: any) => m.id)
    // Prefer larger/more capable chat models first
    const preferred = [
      'llama-3.3-70b-versatile', 'llama3-70b-8192', 'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant', 'llama3-8b-8192',
      'moonshotai/kimi-k2-instruct', 'deepseek-r1-distill-llama-70b',
      'compound-beta', 'qwen-qwq-32b',
    ]
    const sorted = [
      ...preferred.filter(p => ids.includes(p)),
      ...ids.filter(id => !preferred.includes(id) && !id.includes('whisper') && !id.includes('tts') && !id.includes('vision'))
    ]
    console.log('[Groq] Available models:', sorted.slice(0, 5).join(', '))
    return sorted.slice(0, 6) // limit to top 6
  } catch {
    return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  }
}

// Fallback AI provider using Groq
export async function callGroq(
  prompt: string,
  systemInstruction?: string,
  images?: { base64: string; mimeType: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('[Groq] GROQ_API_KEY is not set in environment variables.')
    return ''
  }

  const validImages = images?.filter(img => img.mimeType.startsWith('image/')) || []
  const hasImages = validImages.length > 0

  // Discover available models dynamically
  const allModels = await getGroqModels(apiKey)
  // For vision tasks, prefer vision-capable models from dynamic list
  const modelsToTry = hasImages 
    ? allModels.filter(m => m.includes('vision') || m.includes('scout') || m.includes('maverick')).slice(0, 3)
    : allModels.filter(m => !m.includes('vision') && !m.includes('whisper') && !m.includes('tts')).slice(0, 6)

  const messages: any[] = []
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction })
  }

  if (hasImages) {
    const contentParts: any[] = [{ type: 'text', text: prompt }]
    for (const img of validImages) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      })
    }
    messages.push({ role: 'user', content: contentParts })
  } else {
    messages.push({ role: 'user', content: prompt })
  }

  for (const model of modelsToTry) {
    try {
      console.log(`[Groq AI] Trying model: ${model}`)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
        })
      })

      if (response.ok) {
        const data = await response.json()
        const resText = data.choices?.[0]?.message?.content ?? ''
        if (resText) return resText
      } else {
        const errText = await response.text()
        console.warn(`[Groq Model ${model} ${response.status}]:`, errText)
      }
    } catch (e) {
      console.warn(`[Groq Model ${model} Exception]:`, e)
    }
  }

  console.warn(`[Groq AI] All models failed. Falling back to HuggingFace...`)

  // HuggingFace Fallback (Specifically for Vision/OCR)
  try {
    const hfRes = await callHuggingFace(prompt, images)
    if (hfRes) return hfRes
  } catch(e) {
    console.error('HuggingFace fallback also failed:', e)
  }

  return ''
}

async function callHuggingFace(
  prompt: string,
  images?: { base64: string, mimeType: string }[]
): Promise<string> {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) return ''

  // Filter valid images (Hugging Face supports basic images)
  const validImages = images?.filter(img => 
    img.mimeType.startsWith('image/')
  )
  const hasImages = validImages && validImages.length > 0
  
  if (!hasImages) return '' // We only use HF for Vision tasks for now

  // Default to Qwen2.5-VL-72B-Instruct, fallback to 7B if it fails
  const models = ['Qwen/Qwen2.5-VL-72B-Instruct', 'Qwen/Qwen2-VL-7B-Instruct']
  
  let lastError: any = null

  for (const model of models) {
    try {
      console.log(`[HuggingFace AI] Trying model: ${model}`)
      
      const contentParts: any[] = [{ type: 'text', text: prompt }]
      for (const img of validImages) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
        })
      }

      const response = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: contentParts
            }
          ],
          max_tokens: 2000
        })
      })

      if (response.ok) {
        const data = await response.json()
        const resText = data.choices?.[0]?.message?.content ?? ''
        if (resText) return resText
      } else {
        const errText = await response.text()
        console.warn(`[HF Model ${model} ${response.status}]:`, errText)
        lastError = new Error(`HF API Error: ${response.status} ${errText}`)
      }
    } catch (e: any) {
      console.warn(`[HF Model ${model} Exception]:`, e)
      lastError = e
    }
  }
  
  if (lastError?.cause?.code === 'ENOTFOUND') {
    throw new Error('Network Error: Cannot connect to HuggingFace API (DNS resolution failed). Please check your internet connection or DNS settings.')
  }

  return ''
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
