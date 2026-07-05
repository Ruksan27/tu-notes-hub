// src/app/pricing/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — TU Notes Hub Premium Plans',
  description: 'Simple, transparent pricing for TU students. Free tier with ads, Semester Pass for zero ads & instant downloads, Elite AI for AI-powered exam predictions.',
}

const plans = [
  {
    id: 'free',
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
    href: '/register',
  },
  {
    id: 'semester',
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
    href: '/dashboard',
  },
  {
    id: 'elite',
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
    href: '/dashboard',
  },
]

const comparisons = [
  { feature: 'Browse Notes & Past Papers', free: true, semester: true, elite: true },
  { feature: 'Download Files', free: '10s Wait', semester: 'Instant ⚡', elite: 'Instant ⚡' },
  { feature: 'Advertisements', free: 'Full Ads 📢', semester: 'Zero Ads 🚫', elite: 'Zero Ads 🚫' },
  { feature: 'Handwritten Notes', free: false, semester: true, elite: true },
  { feature: 'Expert Cheatsheets', free: false, semester: false, elite: true },
  { feature: 'AI Exam Predictions', free: false, semester: false, elite: true },
  { feature: 'AI Tutor Chat', free: false, semester: false, elite: true },
  { feature: 'Note Summarizer', free: false, semester: false, elite: true },
  { feature: 'PDF Export of Reports', free: false, semester: false, elite: true },
  { feature: 'Validity', free: 'Forever', semester: '6 Months', elite: '1 Year' },
]

function CheckMark({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-2)' }}>{val}</span>
  return val
    ? <span style={{ fontSize: '18px', color: '#10b981' }}>✓</span>
    : <span style={{ fontSize: '18px', color: '#374151' }}>—</span>
}

export default function PricingPage() {
  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* ── Hero ── */}
      <div style={{ position: 'relative', padding: '80px 24px 40px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container text-center" style={{ position: 'relative', maxWidth: '720px' }}>
          <div className="badge badge-elite" style={{ marginBottom: '20px', display: 'inline-flex', padding: '6px 16px', fontSize: '12px' }}>
            💎 Simple & Transparent Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.1, marginBottom: '20px', fontFamily: 'var(--font-display)' }}>
            Plans Built for<br />
            <span className="text-gradient">Every TU Student</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '17px', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 12px' }}>
            Start free. Upgrade when you need more. Pay with eSewa, Khalti, or Fonepay — no cards needed.
          </p>
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="container" style={{ padding: '0 24px 64px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          maxWidth: '1080px',
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              position: 'relative',
              borderRadius: '20px',
              padding: plan.popular ? '2px' : '0',
              background: plan.popular ? plan.gradient : 'transparent',
              boxShadow: plan.popular ? `0 0 60px ${plan.glow}` : 'none',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.gradient,
                  color: '#fff',
                  padding: '5px 20px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                }}>🔥 MOST POPULAR</div>
              )}

              <div style={{
                background: 'var(--clr-bg-700)',
                borderRadius: plan.popular ? '18px' : '20px',
                border: plan.popular ? 'none' : '1px solid var(--clr-border)',
                padding: '32px 28px',
                height: '100%',
              }}>
                {/* Plan header */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    width: '52px', height: '52px',
                    borderRadius: '14px',
                    background: plan.popular ? plan.gradient : `${plan.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', marginBottom: '16px',
                    border: `1px solid ${plan.color}30`,
                  }}>{plan.emoji}</div>
                  <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    {plan.audience}
                  </p>
                  <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>{plan.name}</h2>
                  <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>{plan.tagline}</p>
                </div>

                {/* Price */}
                <div style={{
                  background: plan.popular ? `${plan.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${plan.color}25`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '44px', fontWeight: 900, color: plan.color, fontFamily: 'var(--font-display)' }}>
                      {plan.price}
                    </span>
                    <span style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>/ {plan.priceNote}</span>
                  </div>
                  {plan.validity && (
                    <p style={{ color: plan.color, fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                      📅 {plan.validity}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {plan.features.map((f) => (
                    <li key={f.text} style={{
                      display: 'flex', gap: '10px', alignItems: 'flex-start',
                      fontSize: '14px',
                      color: f.avail ? 'var(--clr-text-2)' : 'var(--clr-text-3)',
                    }}>
                      <span style={{
                        flexShrink: 0, marginTop: '1px',
                        color: f.avail ? (plan.popular ? plan.color : 'var(--clr-success)') : '#374151',
                        fontWeight: 700,
                        fontSize: '16px',
                      }}>
                        {f.avail ? '✓' : '✗'}
                      </span>
                      <span>
                        <span style={{ marginRight: '6px' }}>{f.icon}</span>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  ...(plan.ctaStyle === 'primary' ? {
                    background: plan.gradient,
                    color: '#fff',
                    boxShadow: `0 6px 24px ${plan.glow}`,
                  } : plan.ctaStyle === 'accent' ? {
                    background: `${plan.color}20`,
                    color: plan.color,
                    border: `1.5px solid ${plan.color}50`,
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--clr-text-2)',
                    border: '1.5px solid var(--clr-border)',
                  }),
                }}>
                  {plan.cta} {plan.id !== 'free' && '→'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison Table ── */}
      <div className="container" style={{ padding: '0 24px 64px' }}>
        <h2 className="text-center" style={{ fontSize: 'clamp(24px,3.5vw,38px)', marginBottom: '40px' }}>
          Full Feature <span className="text-gradient">Comparison</span>
        </h2>

        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--clr-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-3)', borderBottom: '1px solid var(--clr-border)' }}>
                  Feature
                </th>
                {[
                  { label: '🌱 Free', color: '#64748b' },
                  { label: '⚡ Semester', color: '#06b6d4' },
                  { label: '🤖 Elite AI', color: '#6366f1' },
                ].map((col) => (
                  <th key={col.label} style={{
                    padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: 700,
                    color: col.color, borderBottom: '1px solid var(--clr-border)',
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '14px', color: 'var(--clr-text-2)', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.free} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.semester} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: i < comparisons.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <CheckMark val={row.elite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="container" style={{ padding: '0 24px 64px', maxWidth: '720px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
          border: '1px solid var(--clr-border-h)',
          borderRadius: '20px',
          padding: '36px',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>💳 How to Pay?</h3>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.7 }}>
            We accept QR-based payments. Scan the QR, pay, and submit your transaction ID — your account gets activated within 1-2 hours.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['📱 eSewa', '💜 Khalti', '🏦 Fonepay', '🔵 ConnectIPS'].map((method) => (
              <div key={method} style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--clr-border)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--clr-text-2)',
              }}>{method}</div>
            ))}
          </div>
          <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            🚀 Upgrade Now — From Rs. 99 Only
          </Link>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="container" style={{ padding: '0 24px', maxWidth: '680px' }}>
        <h2 className="text-center" style={{ fontSize: 'clamp(22px,3.5vw,36px)', marginBottom: '36px' }}>
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        {[
          { q: '❓ Can I use it free?', a: 'Yes! Free tier lets you browse and download all notes with a 10-second countdown. Ads will be shown to support the platform.' },
          { q: '⏳ How long until my account is activated?', a: 'After submitting your QR payment transaction ID, our team verifies it within 1-2 hours and activates your plan manually.' },
          { q: '📅 What happens when my plan expires?', a: 'Your account reverts to Free tier. All your downloaded files remain with you. You can renew at any time.' },
          { q: '🤖 What is AI Exam Prediction?', a: 'Elite AI analyzes 5+ years of past TU papers for your faculty and predicts which topics are most likely to appear in the next exam, with probability rankings.' },
          { q: '📋 What are Cheatsheets?', a: 'Admin-curated, subject-specific quick reference sheets containing the most important formulas, definitions, and concepts for your exam — exclusive to Elite AI users.' },
          { q: '💬 What is AI Tutor Chat?', a: 'A Gemini-powered chat assistant that can answer your subject questions, explain concepts, and help you understand difficult topics 24/7.' },
        ].map((faq, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '12px',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--clr-text-1)' }}>{faq.q}</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
