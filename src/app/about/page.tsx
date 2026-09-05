// src/app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export const metadata: Metadata = {
  title: 'About & Support — TU Notes Hub',
  description: 'Learn about TU Notes Hub — Nepal\'s trusted academic resource platform for Tribhuvan University students. View contact details, rules, and social channels.',
}

export default async function AboutPage() {
  let settings = null
  try {
    settings = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  } catch (err) {
    console.error('Failed to load site settings for About page:', err)
  }

  const whatsapp = settings?.whatsappLink || 'https://wa.me/9779800000000'
  const facebook = settings?.facebookLink || 'https://facebook.com'
  const tiktok = settings?.tiktokLink || 'https://tiktok.com'
  const instagram = settings?.instagramLink || 'https://instagram.com'
  const phone = settings?.contactPhone || '9767776999'
  const email = settings?.contactEmail || 'tunoteshub@gmail.com'

  let github = 'https://github.com'
  try {
    const extraContent = await fs.readFile(path.join(process.cwd(), 'data', 'extra-settings.json'), 'utf-8')
    const extra = JSON.parse(extraContent)
    github = extra.githubLink || 'https://github.com'
  } catch {}

  let aboutItems: any[] = []
  try {
    const filePath = path.join(process.cwd(), 'data', 'about-items.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    aboutItems = JSON.parse(fileContent)
  } catch {
    aboutItems = [
      { id: '1', emoji: '🎯', title: 'Free Academic Access', description: 'Quality study notes and past paper solutions accessible to every TU student in Nepal — 100% free.' },
      { id: '2', emoji: '🤖', title: 'AI Exam Predictions', description: 'Scholar AI analyzes past board papers and predicts high-yield exam topics for a strategic study edge.' },
      { id: '3', emoji: '🔒', title: 'Verified Projects', description: 'Every project is vetted by expert admins before listing, guaranteeing working code and full reports.' },
      { id: '4', emoji: '⚡', title: 'Instant Reader & PWA', description: 'Read PDF notes directly in our fast viewer. Cache notes offline via PWA on your phone or laptop.' },
    ]
  }

  let platformRules: { buyerRules: string[]; sellerRules: string[] } = { buyerRules: [], sellerRules: [] }
  try {
    const filePath = path.join(process.cwd(), 'data', 'platform-rules.json')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    platformRules = JSON.parse(fileContent)
  } catch {
    platformRules = {
      buyerRules: [
        'Verified Source Code: All projects are manually tested with database schemas and guides.',
        'Digital License: Purchased projects are for academic use. Commercial resale is prohibited.',
        'Instant Access: Download links granted immediately upon eSewa/Khalti verification.',
      ],
      sellerRules: [
        'Original Submissions: Submit complete project zips with working SQL schema and documentation.',
        '85% Revenue Share: Earn 85% on every sale. Automated payouts to eSewa or Khalti.',
        'Zero Tolerance Plagiarism: Broken or stolen code results in instant ban.',
      ],
    }
  }

  const socialLinks = [
    {
      name: 'Facebook',
      handle: '@tunoteshub',
      url: facebook,
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
      color: '#1877F2',
      bg: 'rgba(24,119,242,0.1)',
      border: 'rgba(24,119,242,0.3)',
    },
    {
      name: 'Instagram',
      handle: '@tunoteshub',
      url: instagram,
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
      color: '#E1306C',
      bg: 'rgba(225,48,108,0.1)',
      border: 'rgba(225,48,108,0.3)',
    },
    {
      name: 'TikTok',
      handle: '@tunoteshub',
      url: tiktok,
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.08-1.4-1.18-.78-2.02-1.9-2.44-3.17-.04 1.25-.01 2.5-.02 3.75-.01 2.9-.01 5.8-.02 8.7 0 1.42-.39 2.82-1.15 4-1.07 1.67-2.9 2.81-4.88 3.07-2.07.28-4.29-.29-5.83-1.74-1.74-1.63-2.58-4.14-2.1-6.52.39-1.96 1.6-3.76 3.39-4.61 1.48-.71 3.23-.8 4.79-.31v4.21c-.87-.31-1.87-.27-2.71.18-.94.5-1.61 1.47-1.73 2.54-.18 1.63.85 3.25 2.48 3.58 1.34.28 2.85-.31 3.42-1.57.26-.58.33-1.22.32-1.85V.02z" /></svg>,
      color: '#00F2FE',
      bg: 'rgba(0,242,254,0.08)',
      border: 'rgba(0,242,254,0.28)',
    },
    {
      name: 'WhatsApp',
      handle: 'Live Support',
      url: whatsapp,
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>,
      color: '#25D366',
      bg: 'rgba(37,211,102,0.1)',
      border: 'rgba(37,211,102,0.3)',
    },
    {
      name: 'GitHub',
      handle: 'Open Source',
      url: github,
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
      color: '#e6edf3',
      bg: 'rgba(255,255,255,0.06)',
      border: 'rgba(255,255,255,0.2)',
    },
    {
      name: 'LinkedIn',
      handle: 'TU Notes Hub',
      url: 'https://linkedin.com',
      icon: <svg style={{ width: '22px', height: '22px', fill: 'currentColor' }} viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
      color: '#0A66C2',
      bg: 'rgba(10,102,194,0.1)',
      border: 'rgba(10,102,194,0.3)',
    },
  ]

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: 'var(--clr-bg-900)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── About Page Styles ── */
        .about-container {
          max-width: 1140px;
          margin: 0 auto;
          padding: 52px 20px 80px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 640px) {
          .about-container { padding: 36px 14px 80px; }
        }

        /* Hero */
        .about-hero { text-align: center; margin-bottom: 52px; }
        @media (max-width: 640px) {
          .about-hero { margin-bottom: 36px; }
        }

        /* Metrics bar */
        .about-metrics {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 28px;
        }
        .about-metric-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 10px 16px;
          text-align: center;
          min-width: 120px;
        }
        @media (max-width: 480px) {
          .about-metric-pill { min-width: 100px; padding: 8px 12px; flex: 1; }
        }

        /* Core pillars */
        .about-pillars {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 52px;
        }
        @media (max-width: 480px) {
          .about-pillars { grid-template-columns: 1fr; gap: 12px; }
        }
        @media (min-width: 900px) {
          .about-pillars { grid-template-columns: repeat(4, 1fr); }
        }

        /* Rules grid */
        .about-rules {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 52px;
        }

        /* Support section */
        .about-support {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 52px;
          align-items: start;
        }
        @media (max-width: 700px) {
          .about-support { grid-template-columns: 1fr; }
        }

        /* Contact items */
        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--clr-text-1);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
        }
        .contact-item:hover { background: rgba(255,255,255,0.06); }

        /* ── Social cards grid ── */
        .about-socials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 640px) {
          .about-socials-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 380px) {
          .about-socials-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 900px) {
          .about-socials-grid { grid-template-columns: repeat(6, 1fr); }
        }

        .social-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 18px 10px 16px;
          border-radius: 14px;
          text-decoration: none;
          color: #fff;
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s;
          cursor: pointer;
          min-height: 110px;
          gap: 8px;
        }
        .social-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.35);
        }
        @media (max-width: 640px) {
          .social-card { padding: 14px 8px 12px; min-height: 96px; border-radius: 12px; gap: 6px; }
        }

        .social-card-icon {
          transition: transform 0.25s;
        }
        .social-card:hover .social-card-icon {
          transform: scale(1.2) rotate(-5deg);
        }

        /* CTA banner */
        .about-cta {
          padding: 52px 28px;
          border-radius: 24px;
          text-align: center;
          background: radial-gradient(120% 120% at 50% 0%, rgba(99,102,241,0.22) 0%, rgba(6,182,212,0.1) 45%, rgba(15,23,42,0.95) 100%);
          border: 1px solid rgba(99,102,241,0.3);
          box-shadow: 0 16px 50px rgba(0,0,0,0.45);
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 640px) {
          .about-cta { padding: 36px 20px; border-radius: 18px; }
        }
        .about-cta-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 28px;
        }
        @media (max-width: 480px) {
          .about-cta-btns { flex-direction: column; align-items: stretch; }
          .about-cta-btns a { text-align: center; justify-content: center; }
        }
      `}} />

      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(6,182,212,0.04) 55%, transparent 75%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="about-container">

        {/* ── HERO ── */}
        <div className="about-hero">
          <div className="badge badge-elite" style={{ marginBottom: '14px', display: 'inline-flex', padding: '6px 14px', fontSize: '11px', borderRadius: '999px' }}>
            ✨ NEPAL&apos;S TRUSTED ACADEMIC PLATFORM
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5.5vw, 52px)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Empowering Students with{' '}
            <span className="text-gradient">Smart Notes & AI</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: 'clamp(14px, 2.5vw, 17px)', lineHeight: 1.75, maxWidth: '700px', margin: '0 auto' }}>
            Built by TU graduates for students across Nepal. We simplify exam prep with quality notes, solved past papers, verified projects, and AI-driven predictions.
          </p>

          {/* Metrics */}
          <div className="about-metrics">
            {[
              { label: 'TU Faculties', val: '5+ Programs' },
              { label: 'Semesters', val: '1st–8th' },
              { label: 'Notes Access', val: '100% Free' },
              { label: 'AI Helper', val: 'Scholar AI' },
            ].map((m, idx) => (
              <div key={idx} className="about-metric-pill">
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--clr-accent)' }}>{m.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginTop: '2px' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CORE PILLARS ── */}
        <div className="about-pillars">
          {aboutItems.map((item: any) => (
            <div
              key={item.id}
              className="glass-card hover-lift"
              style={{
                padding: 'clamp(18px, 3vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '16px',
              }}
            >
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {item.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', marginBottom: '6px', fontWeight: 700 }}>{item.title}</h3>
                <p style={{ color: 'var(--clr-text-2)', fontSize: 'clamp(12px, 2vw, 13.5px)', lineHeight: 1.65, margin: 0 }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PLATFORM RULES ── */}
        <div style={{ marginBottom: '52px' }}>
          <div className="text-center" style={{ marginBottom: '28px' }}>
            <div className="badge badge-elite" style={{ marginBottom: '10px' }}>⚖️ TRANSPARENT MARKETPLACE</div>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Platform Rules & Terms</h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginTop: '6px', maxWidth: '540px', margin: '6px auto 0' }}>
              Guidelines ensuring academic integrity, verified deliverables, and creator safety.
            </p>
          </div>
          <div className="about-rules">
            <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 30px)', borderRadius: '14px', borderLeft: '3px solid var(--clr-accent)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-accent)' }}>
                📥 For Buyers
              </h3>
              <ul style={{ display: 'grid', gap: '14px', listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {platformRules.buyerRules.map((rule: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: 'clamp(12.5px, 2vw, 13.5px)', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--clr-accent)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 30px)', borderRadius: '14px', borderLeft: '3px solid var(--clr-primary)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-primary-h)' }}>
                📤 For Sellers
              </h3>
              <ul style={{ display: 'grid', gap: '14px', listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {platformRules.sellerRules.map((rule: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: 'clamp(12.5px, 2vw, 13.5px)', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--clr-primary-h)', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── SUPPORT ── */}
        <div className="about-support">
          {/* Contact info */}
          <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 32px)', borderRadius: '18px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(37,211,102,0.15)', color: '#25D366', fontSize: '11px', fontWeight: 700, marginBottom: '14px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
              24/7 SUPPORT
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 28px)', marginBottom: '10px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              We&apos;re Here to Help!
            </h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '13.5px', lineHeight: 1.7, marginBottom: '20px' }}>
              Questions about downloads, payments, or seller payouts? Contact us anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href={`tel:${phone}`} className="contact-item">
                <span style={{ fontSize: '20px' }}>📞</span>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Support</div>
                  <div style={{ fontSize: '14px' }}>{phone}</div>
                </div>
              </a>
              <a href={`mailto:${email}`} className="contact-item">
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Helpdesk</div>
                  <div style={{ fontSize: '13px' }}>{email}</div>
                </div>
              </a>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 36px)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid rgba(37,211,102,0.3)' }}>
              💬
            </div>
            <div>
              <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 700, margin: '0 0 6px 0' }}>WhatsApp Support</h3>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Chat directly with our team. Avg. response under 2 hours.</p>
            </div>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(37,211,102,0.3)',
              }}
            >
              🟢 Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* ── SOCIAL MEDIA COMMUNITY ── */}
        <div style={{ marginBottom: '52px' }}>
          <div className="text-center" style={{ marginBottom: '24px' }}>
            <div className="badge badge-elite" style={{ marginBottom: '10px' }}>🌐 CONNECT WITH US</div>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Follow Our Community</h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginTop: '6px' }}>
              Join thousands of TU students across Nepal for daily exam tips & updates.
            </p>
          </div>

          <div className="about-socials-grid">
            {socialLinks.map((social, idx) => (
              <a
                key={idx}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="social-card"
                style={{
                  background: social.bg,
                  border: `1px solid ${social.border}`,
                }}
              >
                {/* Icon */}
                <div className="social-card-icon" style={{ color: social.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {social.icon}
                </div>
                {/* Name */}
                <div style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 800, color: 'var(--clr-text-1)', textAlign: 'center', letterSpacing: '-0.01em' }}>
                  {social.name}
                </div>
                {/* Handle */}
                <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--clr-text-3)', textAlign: 'center', fontWeight: 500 }}>
                  {social.handle}
                </div>
                {/* Follow link */}
                <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 700, color: social.color, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  Follow →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* ── CTA BANNER ── */}
        <div className="about-cta">
          <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '380px', height: '180px', background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="badge badge-elite" style={{ marginBottom: '14px', display: 'inline-flex', padding: '5px 14px', fontSize: '11px', borderRadius: '999px' }}>
              🚀 NEPAL&apos;S LARGEST TU STUDENT COMMUNITY
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 4.5vw, 40px)', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)', lineHeight: 1.2, color: '#fff' }}>
              Ready to Ace Your{' '}
              <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #38bdf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TU Board Exams?
              </span>
            </h2>
            <p style={{ fontSize: 'clamp(13px, 2.5vw, 15px)', color: 'var(--clr-text-2)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Join thousands of TU students downloading free study notes, solved past papers, and AI exam predictions today.
            </p>
            <div className="about-cta-btns">
              <Link
                href="/register"
                style={{
                  background: 'var(--grad-brand)', color: '#fff', fontWeight: 800,
                  padding: '14px 28px', fontSize: '15px', borderRadius: '12px',
                  textDecoration: 'none', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'transform 0.2s, opacity 0.2s',
                }}
              >
                🚀 Join Free Now
              </Link>
              <Link
                href="/pricing"
                style={{
                  background: 'rgba(255,255,255,0.06)', color: 'var(--clr-text-1)', fontWeight: 700,
                  padding: '14px 28px', fontSize: '15px', borderRadius: '12px',
                  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                💎 View Elite AI Plans →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
