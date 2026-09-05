import { NextResponse } from 'next/server'
import { callMultiProviderAI } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      title,
      shortDescription,
      description,
      projectType,
      category,
      subcategory,
      technologies,
      frontend,
      backend,
      dbType,
      framework,
      libraries,
      features,
      modules,
      projectObjective,
      requirements,
      sourceDriveLink,
      hasReportPdf,
      hasDocumentation,
      hasDemoVideo,
      hasSqlScript
    } = body

    if (!title && !technologies && !description) {
      return NextResponse.json(
        { error: 'Please provide at least a Title, Description, or Tech Stack for AI valuation.' },
        { status: 400 }
      )
    }

    const systemInstruction = `
You are Nepal's premier Software Engineering Architect & Student Project Valuation Auditor for Tribhuvan University (TU) BCA, CSIT, BIT, and BE Computer curricula.

Your task: Perform a deep complexity analysis on a student's software project and calculate a fair, competitive market selling price strictly bounded between NPR 1,500 (1.5k) and NPR 9,999 (10k).

STRICT PRICE BOUND RULES:
1. MINIMUM ALLOWABLE PRICE: NPR 1,500. Under no circumstances should the price be below 1500.
2. MAXIMUM ALLOWABLE PRICE: NPR 9,999. Under no circumstances should the price be above 9999.

CATEGORICAL PRICE RANGES FOR GUIDANCE:
- Basic Mini Assignment / Intro Web Project: NPR 1,500 - 2,500
- Standard Minor Project (BCA 5th/6th Sem): NPR 2,800 - 4,500
- Advanced Major Final Year Project (BCA 7th/8th Sem): NPR 4,800 - 6,800
- Heavy AI / Machine Learning / Deep Learning / Mobile App Project: NPR 7,000 - 9,999

EVALUATION CRITERIA:
- Tech Stack Complexity (Next.js, Node.js, Python, OpenCV, PyTorch, React Native vs HTML/CSS)
- Feature Richness (Authentication, RBAC, Payment Gateway, Real-time WebSockets, Admin Dashboards)
- Asset Completeness (Source Code ZIP, 40+ page Report Document PDF/Word, SQL Dumps, Live Demo Link)

RETURN FORMAT:
Return ONLY a valid JSON object matching this structure (no markdown formatting, no extra text):
{
  "complexityGrade": "BASIC" | "INTERMEDIATE" | "ADVANCED" | "ENTERPRISE",
  "calculatedPriceNpr": number,
  "suggestedRange": { "min": number, "max": number },
  "scoreBreakdown": {
    "techStackScore": number,
    "featuresScore": number,
    "deliverablesScore": number,
    "marketDemandScore": number
  },
  "justificationList": [
    "string explanation 1",
    "string explanation 2",
    "string explanation 3"
  ],
  "marketabilityTips": [
    "tip 1",
    "tip 2"
  ]
}
`

    const userPrompt = `
Analyze this student project and compute its fair price:

- Project Title: ${title || 'N/A'}
- Academic Category / Level: ${projectType || category || 'Minor Project'} (${subcategory || 'CS/IT'})
- Tech Stack Tags: ${technologies || 'N/A'}
- Frontend Framework: ${frontend || 'N/A'}
- Backend Framework: ${backend || 'N/A'}
- Database System: ${dbType || 'N/A'}
- Frameworks / Libraries: ${framework || ''} ${libraries || ''}
- Short Abstract: ${shortDescription || 'N/A'}
- Detailed Description: ${description || 'N/A'}
- Modules & Features: ${modules || 'N/A'} ${features || ''} ${projectObjective || ''}
- Deliverables Included in Drive Package:
  - Source Code ZIP: YES
  - Report Document PDF/Word: ${hasReportPdf ? 'YES' : 'NO'}
  - Documentation / Setup Guide: ${hasDocumentation ? 'YES' : 'NO'}
  - Video Demo / Live Link: ${hasDemoVideo ? 'YES' : 'NO'}
  - Database SQL Seeder: ${hasSqlScript ? 'YES' : 'NO'}
  - Google Drive Link: ${sourceDriveLink ? 'VALID LINK PROVIDED' : 'NOT PROVIDED YET'}
`

    const rawResponse = await callMultiProviderAI(userPrompt, systemInstruction)

    const cleanedJson = rawResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    let appraisal: any = null
    try {
      appraisal = JSON.parse(cleanedJson)
    } catch (parseErr) {
      console.error('[AI Valuation JSON Parse Error]:', rawResponse)
      // Fallback default calculation if JSON parse fails
      appraisal = {
        complexityGrade: 'INTERMEDIATE',
        calculatedPriceNpr: 3500,
        suggestedRange: { min: 3000, max: 4000 },
        scoreBreakdown: { techStackScore: 22, featuresScore: 20, deliverablesScore: 18, marketDemandScore: 20 },
        justificationList: [
          'Full-stack application implementation',
          'Standard database and backend integration',
          'Student-friendly competitive pricing'
        ],
        marketabilityTips: ['Add a live demo link to increase value']
      }
    }

    // Enforce bounds strictly between NPR 1,500 and NPR 9,999
    let rawPrice = typeof appraisal.calculatedPriceNpr === 'number' ? appraisal.calculatedPriceNpr : 3500
    let boundedPrice = Math.min(Math.max(Math.round(rawPrice), 1500), 9999)

    appraisal.calculatedPriceNpr = boundedPrice
    appraisal.suggestedRange = {
      min: Math.max(1500, boundedPrice - 500),
      max: Math.min(9999, boundedPrice + 500)
    }

    return NextResponse.json({
      success: true,
      appraisal
    })
  } catch (error: any) {
    console.error('[AI Valuation API Route Error]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate AI project appraisal' },
      { status: 500 }
    )
  }
}
