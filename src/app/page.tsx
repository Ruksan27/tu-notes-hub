// src/app/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'TU Notes Hub – Free Notes, Past Papers & AI Exam Predictions for Nepal Students',
  description: 'Download free study notes and past papers for all TU faculties (BCA, CSIT, BIT, BBS, BBA). Get AI-powered exam question predictions.',
}

const STATS = [
  { label: 'Notes Available', value: '5,000+' },
  { label: 'TU Students', value: '50,000+' },
  { label: 'Faculties Covered', value: '10+' },
  { label: 'Past Papers', value: '2,000+' },
]

export default async function HomePage() {
  const faculties = await prisma.faculty.findMany({
    where: { visible: true },
    take: 8,
    orderBy: { name: 'asc' },
  })

  return (
    <>
      {/* ── Hero ─────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 80px' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-20%', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container text-center" style={{ position: 'relative' }}>
          <div className="badge badge-elite animate-fade-in" style={{ marginBottom: '24px', display: 'inline-flex' }}>
            🚀 Nepal's #1 TU Academic Platform
          </div>
          <h1 className="animate-fade-in" style={{
            fontSize: 'clamp(36px,6vw,72px)',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            Ace Your TU Exams with<br />
            <span className="text-gradient">AI-Powered Study Tools</span>
          </h1>
          <p className="animate-fade-in" style={{
            color: 'var(--clr-text-2)',
            fontSize: 'clamp(16px,2vw,20px)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Free notes, past papers, and AI exam predictions for <strong style={{ color: 'var(--clr-text-1)' }}>all Tribhuvan University faculties</strong>.
            Study smarter, not harder.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/faculties" className="btn btn-primary btn-lg">
              📚 Browse Notes Free
            </Link>
            <Link href="/pricing" className="btn btn-outline btn-lg">
              ⚡ View Premium Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────── */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '32px' }}>
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </p>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', marginTop: '4px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Faculties Grid ────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
              Browse by <span className="text-gradient">Faculty</span>
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Choose your faculty to access notes and past papers</p>
          </div>
          <div className="grid-auto">
            {faculties.length > 0 ? faculties.map((f) => (
              <Link key={f.id} href={`/faculty/${f.slug}`} className="glass-card" style={{ padding: '28px', cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{f.icon || '📖'}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{f.id.toUpperCase()}</h3>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', lineHeight: 1.5 }}>{f.name}</p>
              </Link>
            )) : (
              // Placeholder cards while DB is being seeded
              ['BCA 💻', 'CSIT 🖥️', 'BIT 🔧', 'BBS 📊', 'BBA 💼', 'BE ⚙️'].map((f) => (
                <div key={f} className="glass-card" style={{ padding: '28px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{f.split(' ')[1]}</div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{f.split(' ')[0]}</h3>
                  <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Premium Features ──────────────────────── */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05), transparent)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '12px' }}>
              Why Upgrade to <span className="text-gradient">Premium?</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
            {[
              { icon: '🤖', title: 'AI Exam Prediction', desc: 'Compare past papers and get probability-ranked predictions of likely exam questions with AI reasoning.' },
              { icon: '⚡', title: 'Instant Downloads', desc: 'Skip countdown timers and download notes instantly without ads or waiting.' },
              { icon: '📋', title: 'Expert Cheatsheets', desc: 'Admin-curated exam cheatsheets per subject — exactly what you need before the exam.' },
              { icon: '📄', title: 'PDF Export', desc: 'Export AI comparison reports as PDF and study offline anywhere anytime.' },
            ].map((feat) => (
              <div key={feat.title} className="glass-card" style={{ padding: '32px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              🚀 Upgrade Now — Starting Rs. 99 only
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
