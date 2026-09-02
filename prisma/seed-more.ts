import { PrismaClient, Package } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding extra data...')

  // 1. Force delete existing pricing plans so we can re-seed with CORRECT format
  await prisma.pricingPlan.deleteMany({})

  const plans = [
    {
      packageType: Package.FREE,
      emoji: '🌱',
      name: 'Free Tier',
      tagline: 'Start learning today',
      price: 'Rs. 0',
      priceNote: 'Forever free',
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
      packageType: Package.SEMESTER_PASS,
      emoji: '⚡',
      name: 'Semester Pass',
      tagline: 'Perfect for exam season',
      price: 'Rs. 499',
      originalPrice: 'Rs. 999',
      priceNote: 'Per Semester',
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
      ctaStyle: 'btn-primary',
    },
    {
      packageType: Package.ELITE_AI,
      emoji: '🤖',
      name: 'Elite AI Pass',
      tagline: 'Predict. Prepare. Score.',
      price: 'Rs. 899',
      originalPrice: 'Rs. 1499',
      priceNote: 'Per Year',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      glow: 'rgba(99,102,241,0.25)',
      popular: true,
      audience: 'Top scorers & exam prediction seekers',
      features: [
        { icon: '✅', text: 'Everything in Semester Pass', avail: true },
        { icon: '🤖', text: 'Full AI Dashboard (Exam Predictions)', avail: true },
        { icon: '💬', text: 'AI Tutor Chat powered by TU Notes Elite AI', avail: true },
        { icon: '📊', text: 'Pre-computed past paper analysis reports', avail: true },
        { icon: '📋', text: 'Expert Cheatsheets per subject', avail: true },
        { icon: '📄', text: 'PDF export of AI prediction reports', avail: true },
        { icon: '📝', text: 'AI Note Summarizer', avail: true },
      ],
      cta: 'Get Elite AI Pass',
      ctaStyle: 'primary',
    }
  ]

  for (const plan of plans) {
    await prisma.pricingPlan.create({
      data: {
        packageType: plan.packageType,
        emoji: plan.emoji,
        name: plan.name,
        tagline: plan.tagline,
        price: plan.price,
        priceNote: plan.priceNote,
        color: plan.color,
        gradient: plan.gradient,
        glow: plan.glow,
        popular: plan.popular,
        audience: plan.audience,
        features: plan.features,
        cta: plan.cta,
        ctaStyle: plan.ctaStyle,
        originalPrice: plan.originalPrice,
      }
    })
  }
  console.log('Pricing plans correctly seeded.')

  // 2. Force delete related records and recreate project items
  await prisma.cartItem.deleteMany({})
  await prisma.projectOrder.deleteMany({})
  await prisma.projectReview.deleteMany({})
  await prisma.projectItem.deleteMany({})
  
  await prisma.projectItem.createMany({
    data: [
      {
        title: 'E-commerce React & Node.js Platform',
        shortDescription: 'Full-stack MERN e-commerce application with Stripe integration.',
        description: 'A complete e-commerce platform built with MongoDB, Express, React, and Node.js. Includes admin dashboard, cart, checkout, and payment gateway.',
        technologies: 'React, Node.js, MongoDB, Express, TailwindCSS',
        originalPrice: 2000,
        discountPercentage: 20,
        status: 'ACTIVE',
      },
      {
        title: 'Hospital Management System',
        shortDescription: 'A robust Django and PostgreSQL based HMS.',
        description: 'Manage patients, doctors, appointments, and billing with this comprehensive Django application.',
        technologies: 'Django, Python, PostgreSQL, Bootstrap',
        originalPrice: 1500,
        discountPercentage: 0,
        status: 'ACTIVE',
      },
      {
        title: 'Student Attendance Tracker',
        shortDescription: 'Next.js based simple attendance management system.',
        description: 'A responsive Next.js application that lets teachers mark attendance and students check their stats.',
        technologies: 'Next.js, React, TailwindCSS, Prisma, MySQL',
        originalPrice: 1000,
        discountPercentage: 50,
        status: 'ACTIVE',
      },
      {
        title: 'Food Delivery App (Flutter UI)',
        shortDescription: 'Beautiful Flutter UI kit for a food delivery application.',
        description: 'Clean, modern, and responsive UI screens for a food delivery app built entirely in Flutter.',
        technologies: 'Flutter, Dart',
        originalPrice: 800,
        discountPercentage: 10,
        status: 'ACTIVE',
      }
    ]
  })
  console.log('Project items correctly seeded.')

  console.log('Done fixing and seeding extra data.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
