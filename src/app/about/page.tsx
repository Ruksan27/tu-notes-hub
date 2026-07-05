// src/app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — TU Notes Hub',
  description: 'Learn about TU Notes Hub — Nepal\'s #1 academic platform for Tribhuvan University students.',
}

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: '800px' }}>
      <div className="text-center" style={{ marginBottom: '56px' }}>
        <div className="badge badge-elite" style={{ marginBottom: '16px', display: 'inline-flex' }}>📖 Our Story</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', marginBottom: '16px' }}>
          About <span className="text-gradient">TU Notes Hub</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '16px', lineHeight: 1.8 }}>
          Built by students, for students. We understand the struggle of finding quality study materials before TU exams.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {[
          {
            icon: '🎯',
            title: 'Our Mission',
            text: 'To make quality academic resources accessible to every Tribhuvan University student in Nepal — regardless of their financial situation. We believe education should be free and fair.',
          },
          {
            icon: '🤖',
            title: 'AI-Powered Learning',
            text: 'We use Google\'s Gemini AI to analyze past year question papers and predict what topics are most likely to appear in upcoming exams, giving you a strategic edge in your preparation.',
          },
          {
            icon: '🔒',
            title: 'Security First',
            text: 'All accounts are protected with secure HTTP-only cookies and email OTP verification. Premium content is protected against unauthorized screenshots and downloads.',
          },
          {
            icon: '📱',
            title: 'Works Everywhere',
            text: 'TU Notes Hub is a Progressive Web App (PWA) — install it on your phone, tablet, or laptop and access your notes even offline.',
          },
        ].map((item) => (
          <div key={item.title} className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '36px', flexShrink: 0 }}>{item.icon}</div>
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.8 }}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center" style={{ marginTop: '56px' }}>
        <p style={{ color: 'var(--clr-text-2)', marginBottom: '24px' }}>Ready to start learning smarter?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary btn-lg">📚 Sign Up Free</Link>
          <Link href="/pricing" className="btn btn-outline btn-lg">💎 View Plans</Link>
        </div>
      </div>
    </div>
  )
}
