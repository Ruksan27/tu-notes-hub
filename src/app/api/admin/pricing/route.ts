import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const defaultPlans = [
  {
    packageType: 'FREE',
    emoji: '🌱',
    name: 'Free Tier',
    tagline: 'Start learning today',
    price: 'Rs. 0',
    priceNote: 'Forever free',
    validity: null,
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #475569, #64748b)',
    glow: 'rgba(100,116,139,0.15)',
    popular: false,
    audience: 'Casual students & browsers',
    features: [
      { icon: '📚', text: 'Browse all notes & past papers', avail: true },
      { icon: '⏱️', text: '10-second countdown before download', avail: true },
      { icon: '📢', text: 'Ad-supported (sidebars + banners)', avail: true },
      { icon: '🤖', text: 'AI Exam Predictions', avail: false },
      { icon: '⚡', text: 'Instant 1-click download', avail: false },
      { icon: '📋', text: 'Handwritten Notes & Cheatsheets', avail: false },
      { icon: '💬', text: 'AI Tutor Chat', avail: false },
    ],
    cta: 'Get Started Free',
    ctaStyle: 'outline',
  },
  {
    packageType: 'SEMESTER_PASS',
    emoji: '⚡',
    name: 'Semester Pass',
    tagline: 'Perfect for exam season',
    price: 'Rs. 99',
    priceNote: 'per semester',
    validity: 'Valid for 6 Months',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    glow: 'rgba(6,182,212,0.2)',
    popular: false,
    audience: 'Dedicated exam readers',
    features: [
      { icon: '📚', text: 'All notes & past papers access', avail: true },
      { icon: '🚫', text: 'Zero Ads — complete clean experience', avail: true },
      { icon: '⚡', text: 'Instant 1-click download (no wait)', avail: true },
      { icon: '📝', text: 'Handwritten notes access', avail: true },
      { icon: '🤖', text: 'AI Exam Predictions', avail: false },
      { icon: '📋', text: 'Cheatsheets access', avail: false },
      { icon: '💬', text: 'AI Tutor Chat', avail: false },
    ],
    cta: 'Get Semester Pass',
    ctaStyle: 'accent',
  },
  {
    packageType: 'ELITE_AI',
    emoji: '🤖',
    name: 'Elite AI Pass',
    tagline: 'Predict. Prepare. Score.',
    price: 'Rs. 199',
    priceNote: 'per year',
    validity: 'Valid for 1 Year',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.25)',
    popular: true,
    audience: 'Top scorers & exam prediction seekers',
    features: [
      { icon: '✅', text: 'Everything in Semester Pass', avail: true },
      { icon: '🤖', text: 'Full AI Dashboard (Exam Predictions)', avail: true },
      { icon: '💬', text: 'AI Tutor Chat powered by Gemini', avail: true },
      { icon: '📊', text: 'Pre-computed past paper analysis reports', avail: true },
      { icon: '📋', text: 'Expert Cheatsheets per subject', avail: true },
      { icon: '📄', text: 'PDF export of AI prediction reports', avail: true },
      { icon: '📝', text: 'AI Note Summarizer', avail: true },
    ],
    cta: 'Get Elite AI Pass',
    ctaStyle: 'primary',
  },
]

export async function GET() {
  try {
    let plans = await prisma.pricingPlan.findMany({
      orderBy: { price: 'asc' } // Not perfectly accurate for strings but ok
    })

    if (plans.length === 0) {
      // Seed default plans
      for (const p of defaultPlans) {
        await prisma.pricingPlan.create({
          data: {
            packageType: p.packageType as any,
            emoji: p.emoji,
            name: p.name,
            tagline: p.tagline,
            price: p.price,
            priceNote: p.priceNote,
            validity: p.validity,
            color: p.color,
            gradient: p.gradient,
            glow: p.glow,
            popular: p.popular,
            audience: p.audience,
            features: p.features,
            cta: p.cta,
            ctaStyle: p.ctaStyle
          }
        })
      }
      plans = await prisma.pricingPlan.findMany()
    }

    // Sort plans by package type manually to ensure Free -> Semester -> Elite
    const order = ['FREE', 'SEMESTER_PASS', 'ELITE_AI']
    plans.sort((a, b) => order.indexOf(a.packageType) - order.indexOf(b.packageType))

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('[PRICING_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { id, originalPrice, discountEndsAt, price, name, tagline, features, popular } = data

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const updated = await prisma.pricingPlan.update({
      where: { id },
      data: {
        originalPrice: originalPrice || null,
        discountEndsAt: discountEndsAt ? new Date(discountEndsAt) : null,
        price,
        name,
        tagline,
        features: features ? features : undefined,
        popular: popular !== undefined ? popular : undefined,
      }
    })

    return NextResponse.json({ success: true, plan: updated })
  } catch (error) {
    console.error('[PRICING_PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
