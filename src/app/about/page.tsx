// src/app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'About & Support — TU Notes Hub',
  description: 'Learn about TU Notes Hub — Nepal\'s #1 academic platform for Tribhuvan University students. View contact details, rules, and regulations.',
}

export default async function AboutPage() {
  // Load settings directly from DB on server side
  let settings = null
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: 'singleton' },
    })
  } catch (err) {
    console.error('Failed to load site settings for About page:', err)
  }

  const whatsapp = settings?.whatsappLink || 'https://wa.me/9779800000000'
  const facebook = settings?.facebookLink || 'https://facebook.com'
  const tiktok = settings?.tiktokLink || 'https://tiktok.com'
  const instagram = settings?.instagramLink || 'https://instagram.com'
  const phone = settings?.contactPhone || '9767776999'
  const email = settings?.contactEmail || 'tunoteshub@gmail.com'

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ── Header Section ── */}
      <div className="text-center" style={{ marginBottom: '56px' }}>
        <div className="badge badge-elite" style={{ marginBottom: '16px', display: 'inline-flex' }}>
          📖 Our Story
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          About <span className="text-gradient">TU Notes Hub</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '17px', lineHeight: 1.8, maxWidth: '760px', margin: '0 auto' }}>
          Built by students, for students. We understand the struggle of finding quality study materials before TU exams.
          Our platform brings together notes, past papers, AI predictions, and verified projects in one seamless space.
        </p>
      </div>

      {/* ── Core Mission / AI Section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '56px' }}>
        <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '36px', flexShrink: 0 }}>🎯</div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>Our Mission</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>
              To make quality academic resources accessible to every Tribhuvan University student in Nepal — regardless of their financial situation. We believe education should be free and fair.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '36px', flexShrink: 0 }}>🤖</div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>AI-Powered Learning</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>
              We use Google's Gemini AI to analyze past year question papers and predict what topics are most likely to appear in upcoming exams, giving you a strategic edge in your preparation.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '36px', flexShrink: 0 }}>🔒</div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>Security First</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>
              All accounts are protected with secure HTTP-only cookies and email OTP verification. Premium content is protected against unauthorized screenshots and downloads.
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '36px', flexShrink: 0 }}>📱</div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>Works Offline</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.7 }}>
              TU Notes Hub is a Progressive Web App (PWA) — install it on your phone, tablet, or laptop and access your cached notes and papers even when you have no internet.
            </p>
          </div>
        </div>
      </div>

      {/* ── Rules and Regulations Section ── */}
      <div style={{ marginBottom: '56px' }}>
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div className="badge badge-elite" style={{ marginBottom: '12px' }}>⚖️ Platform Rules</div>
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-display)' }}>Rules & Regulations</h2>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', marginTop: '6px' }}>
            Guidelines for maintaining a safe and clean marketplace.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
          {/* Buyer Rules */}
          <div className="glass-card" style={{ padding: '32px', borderLeft: '4px solid var(--clr-accent)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-accent)' }}>
              📥 For Project Buyers
            </h3>
            <ul style={{ display: 'grid', gap: '14px', listStyleType: 'none', paddingLeft: 0 }}>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>Verified Code:</strong> Every listed project is verified by admins to ensure it matches description screenshots and documentation.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>Non-Refundable:</strong> Project downloads are digital goods and are non-refundable once the delivery link is shared. Please review demo links and credentials carefully before purchase.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>Usage License:</strong> Projects are sold for academic learning and personal reference. Commercial redistribution or uploading to public repositories is strictly prohibited.</span>
              </li>
            </ul>
          </div>

          {/* Seller Rules */}
          <div className="glass-card" style={{ padding: '32px', borderLeft: '4px solid var(--clr-primary)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-primary-h)' }}>
              📤 For Project Sellers
            </h3>
            <ul style={{ display: 'grid', gap: '14px', listStyleType: 'none', paddingLeft: 0 }}>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>Verification Uploads:</strong> Sellers must upload complete project zip files (including database export `.sql` and reports) to Google Drive. The sharing link must grant view access to admins.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>No Plagiarism:</strong> Uploaded projects must be your own work or properly licensed. Any stolen, broken, or copied projects will result in an immediate seller ban and balance forfeit.</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--clr-text-2)' }}>
                <span>✅</span>
                <span><strong>Revenue Share:</strong> Sellers receive 85% of each successful sale. Payouts are computed weekly and transferred directly via eSewa/Khalti after validation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Customer Care / Contact Section ── */}
      <div className="glass-card" style={{ padding: '40px', border: '1px solid var(--clr-border-h)', background: 'var(--clr-bg-800)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
          <div>
            <div className="badge badge-elite" style={{ marginBottom: '12px' }}>☎️ 24/7 SUPPORT</div>
            <h2 style={{ fontSize: '28px', marginBottom: '12px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Customer Care
            </h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '24px' }}>
              Have questions about project delivery, payment validation, account verification, or need technical help? Contact us directly. We typically reply within 2 hours.
            </p>
            <div style={{ display: 'grid', gap: '16px' }}>
              <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--clr-text-1)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
                <span style={{ fontSize: '20px' }}>📞</span> Phone Support: {phone}
              </a>
              <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--clr-text-1)', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
                <span style={{ fontSize: '20px' }}>✉️</span> Email Us: {email}
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <span style={{ fontSize: '48px', animation: 'bounce 2s infinite' }}>💬</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Instant Live Chat</h3>
            <p style={{ color: 'var(--clr-text-3)', fontSize: '12.5px', textAlign: 'center', margin: '0 0 10px 0' }}>
              Connect with support agents instantly on WhatsApp.
            </p>
            <a 
              href={whatsapp} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 15px rgba(37,211,102,0.3)', textDecoration: 'none' }}
            >
              🟢 Chat Us on WhatsApp
            </a>
            
            {/* Social Media Links */}
            <div style={{ borderTop: '1px solid var(--clr-border)', width: '100%', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>FOLLOW US</span>
              <div style={{ display: 'flex', gap: '16px', fontSize: '22px' }}>
                {facebook && (
                  <a href={facebook} target="_blank" rel="noreferrer" title="Facebook" className="hover:scale-125 transition-transform duration-200" style={{ display: 'inline-block' }}>
                    🔵
                  </a>
                )}
                {tiktok && (
                  <a href={tiktok} target="_blank" rel="noreferrer" title="TikTok" className="hover:scale-125 transition-transform duration-200" style={{ display: 'inline-block' }}>
                    🎵
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noreferrer" title="Instagram" className="hover:scale-125 transition-transform duration-200" style={{ display: 'inline-block' }}>
                    📸
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Call To Actions ── */}
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
