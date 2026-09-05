import { NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { prompt, messages: inputMessages, model } = await req.json()

    if (!prompt && (!inputMessages || inputMessages.length === 0)) {
      return NextResponse.json({ error: 'Prompt or message history is required' }, { status: 400 })
    }

    const systemInstruction = `You are an expert SEO Blog Writer for 'TU Notes Hub', an educational platform for Nepalese university students (TU - Tribhuvan University). 
Your task is to assist in writing, editing, and generating highly engaging, SEO-optimized blog posts in HTML format.

Rules:
1. When generating blog article content or sections, return ONLY clean, semantic HTML body content (do not include <html>, <head>, or <body> tags).
2. Do NOT wrap the HTML in markdown code blocks like \`\`\`html unless asked for code examples. Just return clean, well-formatted HTML or text response.
3. Use semantic HTML: <h2> for main headings, <h3> for subheadings, <ul>/<li> for lists, <strong> for emphasis.
4. DO NOT use an <h1> tag (the title will be rendered separately by the frontend).
5. The content should be well-structured, easy to read for students, and include relevant keywords.
6. Write in English, but keep the context relevant to Nepalese students and TU exams.`

    // Construct full message thread
    let messageHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    
    if (inputMessages && Array.isArray(inputMessages) && inputMessages.length > 0) {
      messageHistory = inputMessages
    } else if (prompt) {
      messageHistory = [{ role: 'user', content: prompt }]
    }

    const selectedModel = model || 'gemini-2.5-flash'
    let generatedContent = ''

    // Route request based on chosen AI Model / Provider
    if (selectedModel.startsWith('gpt-')) {
      // OpenAI Provider
      const openaiKey = process.env.OPENAI_API_KEY
      if (openaiKey) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: [{ role: 'system', content: systemInstruction }, ...messageHistory],
              temperature: 0.7
            })
          })
          if (res.ok) {
            const data = await res.json()
            generatedContent = data.choices?.[0]?.message?.content || ''
          }
        } catch (err) {
          console.warn('[OpenAI Chat failed, falling back to Gemini/Nvidia]:', err)
        }
      }
    } else if (selectedModel.startsWith('nvidia/') || selectedModel.startsWith('meta/') || selectedModel.startsWith('deepseek')) {
      // NVIDIA Nim Provider
      const nvidiaKey = process.env.NVIDIA_API_KEY
      if (nvidiaKey) {
        try {
          const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${nvidiaKey}`
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: [{ role: 'system', content: systemInstruction }, ...messageHistory],
              temperature: 0.7
            })
          })
          if (res.ok) {
            const data = await res.json()
            generatedContent = data.choices?.[0]?.message?.content || ''
          }
        } catch (err) {
          console.warn('[Nvidia Nim Chat failed, falling back]:', err)
        }
      }
    }

    // Fallback or default Gemini / Multi-model strategy
    if (!generatedContent) {
      const lastUserMsg = messageHistory[messageHistory.length - 1]?.content || prompt || ''
      generatedContent = await callGemini(lastUserMsg, systemInstruction)
    }

    // Clean any markdown code block artifacts
    const cleanHtml = generatedContent.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim()

    return NextResponse.json({ content: cleanHtml, modelUsed: selectedModel })
  } catch (error: any) {
    console.error('Error generating AI blog chat:', error)
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 })
  }
}
