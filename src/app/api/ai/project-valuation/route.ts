import { NextResponse } from 'next/server'
import { callProjectValuationAI, cleanAndParseJSON } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      projectId,
      title: bodyTitle,
      shortDescription: bodyShortDescription,
      description: bodyDescription,
      projectType: bodyProjectType,
      category: bodyCategory,
      subcategory: bodySubcategory,
      technologies: bodyTechnologies,
      frontend: bodyFrontend,
      backend: bodyBackend,
      dbType: bodyDbType,
      framework: bodyFramework,
      libraries: bodyLibraries,
      features: bodyFeatures,
      modules: bodyModules,
      projectObjective: bodyProjectObjective,
      requirements: bodyRequirements,
      installation: bodyInstallation,
      limitations: bodyLimitations,
      version: bodyVersion,
      license: bodyLicense,
      salesType: bodySalesType,
      demoUrl: bodyDemoUrl,
      youtubeUrl: bodyYoutubeUrl,
      githubUrl: bodyGithubUrl,
      sourceDriveLink: bodySourceDriveLink,
      adminDriveLink: bodyAdminDriveLink,
      hasReportPdf,
      hasDocumentation,
      hasDemoVideo,
      hasSqlScript
    } = body

    // 1. If projectId is provided, fetch full database record from Prisma
    let dbProject: any = null
    if (projectId) {
      dbProject = await prisma.projectItem.findUnique({
        where: { id: projectId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              college: true,
              role: true
            }
          },
          orders: {
            select: {
              id: true,
              status: true,
              amount: true,
              createdAt: true
            }
          },
          reviews: {
            select: {
              rating: true,
              comment: true
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              cartItems: true
            }
          }
        }
      })
    }

    // Combine form input overrides with DB baseline attributes
    const title = bodyTitle || dbProject?.title || ''
    const shortDescription = bodyShortDescription || dbProject?.shortDescription || ''
    const description = bodyDescription || dbProject?.description || ''
    const technologies = bodyTechnologies || dbProject?.technologies || ''
    const projectType = bodyProjectType || dbProject?.projectType || 'Minor Project'
    const category = bodyCategory || dbProject?.category || 'Major/Minor Projects'
    const subcategory = bodySubcategory || dbProject?.subcategory || 'CS/IT'
    const frontend = bodyFrontend || dbProject?.frontend || ''
    const backend = bodyBackend || dbProject?.backend || ''
    const dbType = bodyDbType || dbProject?.dbType || ''
    const framework = bodyFramework || dbProject?.framework || ''
    const libraries = bodyLibraries || dbProject?.libraries || ''
    const features = bodyFeatures || dbProject?.features || ''
    const modules = bodyModules || dbProject?.modules || ''
    const projectObjective = bodyProjectObjective || dbProject?.projectObjective || ''
    const requirements = bodyRequirements || dbProject?.requirements || ''
    const installation = bodyInstallation || dbProject?.installation || ''
    const limitations = bodyLimitations || dbProject?.limitations || ''
    const version = bodyVersion || dbProject?.version || '1.0'
    const license = bodyLicense || dbProject?.license || ''
    const salesType = bodySalesType || dbProject?.salesType || 'SINGLE_OR_MULTI'
    const demoUrl = bodyDemoUrl || dbProject?.demoUrl || ''
    const youtubeUrl = bodyYoutubeUrl || dbProject?.youtubeUrl || ''
    const githubUrl = bodyGithubUrl || dbProject?.githubUrl || ''
    const sourceDriveLink = bodySourceDriveLink || dbProject?.sourceDriveLink || ''
    const adminDriveLink = bodyAdminDriveLink || dbProject?.adminDriveLink || ''

    // Database analytical & historical metrics
    const views = dbProject?.views || 0
    const organicViews = dbProject?.organicViews || 0
    const searchClicks = dbProject?.searchClicks || 0
    const rating = dbProject?.rating || 0
    const reviewCount = dbProject?._count?.reviews || 0
    const ordersCount = dbProject?._count?.orders || 0
    const cartCount = dbProject?._count?.cartItems || 0
    const existingPrice = dbProject?.originalPrice || 0
    const sellerInfo = dbProject?.user ? `${dbProject.user.name} (${dbProject.user.role}, ${dbProject.user.college || 'TU College'})` : 'System Admin / Direct Marketplace'

    if (!title && !technologies && !description) {
      return NextResponse.json(
        { error: 'Please provide at least a Title, Description, or Tech Stack for AI valuation.' },
        { status: 400 }
      )
    }

    const systemInstruction = `
You are Nepal's premier Software Engineering Architect & Student Project Valuation Auditor for Tribhuvan University (TU) BCA, CSIT, BIT, and BE Computer curricula.

Your task: Perform a deep, multi-dimensional complexity analysis on a student's software project using all provided database attributes, architecture details, deliverables, media URLs, and market analytics. Calculate a fair, competitive market selling price strictly bounded between NPR 1,500 (1.5k) and NPR 9,999 (10k).

STRICT PRICE BOUND RULES:
1. MINIMUM ALLOWABLE PRICE: NPR 1,500. Under no circumstances should the price be below 1500.
2. MAXIMUM ALLOWABLE PRICE: NPR 9,999. Under no circumstances should the price be above 9999.

CATEGORICAL PRICE RANGES FOR GUIDANCE:
- Basic Mini Assignment / Intro Web Project: NPR 1,500 - 2,500
- Standard Minor Project (BCA 5th/6th Sem): NPR 2,800 - 4,500
- Advanced Major Final Year Project (BCA 7th/8th Sem): NPR 4,800 - 6,800
- Heavy AI / Machine Learning / Deep Learning / Mobile App Project: NPR 7,000 - 9,999

EVALUATION CRITERIA:
- Tech Stack & System Architecture (Next.js, Node.js, Python, PyTorch, React Native, MySQL vs HTML/CSS)
- Scope & Module Complexity (Auth, RBAC, Payment Gateways, Real-time WebSockets, Admin Panels, API Integrations)
- Asset & Documentation Completeness (Source Code ZIP, 40+ page Report Document PDF/Word, SQL Dumps, Live Demo Link)
- Student Market Demand & Historical Performance (Views, Orders count, Wishlists, Ratings)

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
Analyze this student software project comprehensively using database records, full architecture specs, deliverables, and live platform metrics:

=== DATABASE IDENTIFIER & SELLER CONTEXT ===
- Database Project ID: ${projectId || 'New Project (Unsaved Draft)'}
- Seller / Author: ${sellerInfo}

=== PROJECT CORE METADATA ===
- Title: ${title || 'N/A'}
- Academic Category / Level: ${projectType || category || 'Minor Project'} (${subcategory || 'CS/IT'})
- Project Version: ${version}
- Distribution & Sales Model: ${salesType} (${license || 'Standard Student License'})

=== ARCHITECTURE & TECH STACK ===
- Primary Tech Tags: ${technologies || 'N/A'}
- Frontend Framework: ${frontend || 'N/A'}
- Backend Framework: ${backend || 'N/A'}
- Database Engine: ${dbType || 'N/A'}
- Frameworks & External Libraries: ${framework || ''} ${libraries || ''}

=== CONTENT & MODULE SPECIFICATIONS ===
- Short Abstract: ${shortDescription || 'N/A'}
- Full Detailed Description: ${description || 'N/A'}
- Project Objectives: ${projectObjective || 'N/A'}
- Modules & Core Features: ${modules || ''} ${features || ''}
- System Requirements: ${requirements || 'N/A'}
- Installation Complexity: ${installation || 'Standard Setup'}
- Limitations / Known Issues: ${limitations || 'None specified'}

=== DELIVERABLES & GOOGLE DRIVE ASSETS ===
- Source Code ZIP Link: ${sourceDriveLink ? `VALID LINK PROVIDED (${sourceDriveLink})` : 'Not provided yet'}
- Admin Delivery Link: ${adminDriveLink ? `VALID LINK PROVIDED (${adminDriveLink})` : 'Not provided yet'}
- Report Document PDF/Word: ${hasReportPdf ? 'YES (Formal academic documentation included)' : 'NO'}
- Setup & Installation Guide: ${hasDocumentation ? 'YES (Step-by-step documentation included)' : 'NO'}
- Live Demo Video / Link: ${hasDemoVideo ? 'YES' : 'NO'}
- Database SQL Seeder Dump: ${hasSqlScript ? 'YES (Database seeder file included)' : 'NO'}

=== MEDIA & EXTERNAL PORTFOLIO LINKS ===
- Live Web Demo: ${demoUrl || 'N/A'}
- YouTube Video Preview: ${youtubeUrl || 'N/A'}
- GitHub Repository: ${githubUrl || 'N/A'}

=== LIVE DATABASE ANALYTICS & MARKET METRICS ===
- Current Database Listed Price: NPR ${existingPrice}
- Total Page Views: ${views} (Organic: ${organicViews}, Search Clicks: ${searchClicks})
- Total Completed Purchases: ${ordersCount} orders
- Student Wishlist / Cart Additions: ${cartCount} times
- Ratings & Reviews: ${rating} / 5.0 rating (${reviewCount} total reviews)
`

    const { text: rawResponse, providerUsed } = await callProjectValuationAI(userPrompt, systemInstruction)

    let appraisal: any = null
    try {
      appraisal = cleanAndParseJSON(rawResponse)
    } catch (parseErr) {
      console.error('[AI Valuation JSON Parse Error]:', rawResponse)
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
    appraisal.providerUsed = providerUsed

    // Enforce bounds strictly between NPR 1,500 and NPR 9,999
    let rawPrice = typeof appraisal.calculatedPriceNpr === 'number' ? appraisal.calculatedPriceNpr : 3500
    let boundedPrice = Math.min(Math.max(Math.round(rawPrice), 1500), 9999)

    appraisal.calculatedPriceNpr = boundedPrice
    appraisal.suggestedRange = {
      min: Math.max(1500, boundedPrice - 500),
      max: Math.min(9999, boundedPrice + 500)
    }

    // Sync AI Appraisal to DB if projectId exists
    if (projectId && dbProject) {
      await prisma.projectItem.update({
        where: { id: projectId },
        data: {
          aiCalculatedPrice: boundedPrice,
          aiComplexityGrade: appraisal.complexityGrade,
          aiValuationJson: JSON.stringify(appraisal)
        }
      }).catch(err => console.error('[DB AI Valuation Sync Error]:', err))
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
