// src/lib/gemini.ts

const API_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter(Boolean) as string[]

let currentKeyIndex = 0

function getNextApiKey(): string {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>
}

export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<string> {
  let attempts = 0

  while (attempts < API_KEYS.length) {
    const apiKey = getNextApiKey()
    try {
      const contents: GeminiMessage[] = []

      const userParts: GeminiMessage['parts'] = []
      if (imageBase64 && mimeType) {
        userParts.push({ inlineData: { mimeType, data: imageBase64 } })
      }
      userParts.push({ text: prompt })

      contents.push({ role: 'user', parts: userParts })

      const body: Record<string, unknown> = { contents }
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      if (response.status === 429) {
        attempts++
        console.warn(`[Gemini] Key ${currentKeyIndex} rate limited. Rotating...`)
        continue
      }

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'Gemini API error')
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || ''
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('429')) {
        attempts++
        continue
      }
      throw error
    }
  }

  throw new Error('All Gemini API keys are rate-limited. Please try again in a minute.')
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
  // Strip markdown code blocks if present
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}
