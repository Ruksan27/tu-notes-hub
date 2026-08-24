// src/app/pricing/page.tsx
import type { Metadata } from 'next'
import PricingPlans from '@/components/PricingPlans'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing — TU Notes Hub Premium Plans',
  description: 'Simple, transparent pricing for TU students. Free tier with ads, Semester Pass for zero ads & instant downloads, Elite AI for AI-powered exam predictions.',
}

export default function PricingPage() {
  return <PricingPlans />
}
