import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | TU Notes Hub',
  description: 'How we collect, use, and protect your data at TU Notes Hub.',
}

export default function PrivacyPage() {
  const sections = [
    {
      num: 1,
      title: 'Information We Collect',
      icon: '📊',
      content: 'We collect information you provide directly to us, such as when you create or modify your account, purchase notes or projects, contact customer support, or communicate with us. This includes your name, email address, phone number, and college/faculty details.'
    },
    {
      num: 2,
      title: 'How We Use Your Information',
      icon: '⚡',
      content: 'We use the information we collect to provide, maintain, and improve our academic services. This includes processing Marketplace transactions, verifying project downloads, sending order confirmations, and suggesting relevant notes for your semester.'
    },
    {
      num: 3,
      title: 'Data Security & Protection',
      icon: '🛡️',
      content: 'We implement robust industry-standard security measures to protect your personal data. All user passwords are encrypted using secure bcrypt hashing, and communication between your browser and our servers is fully encrypted using HTTPS SSL certificates.'
    },
    {
      num: 4,
      title: 'Cookies & Authentication',
      icon: '🍪',
      content: 'We use essential cookies and local browser storage to keep you logged in securely, remember your cart items, and deliver customized content based on your selected faculty.'
    }
  ]

  return (
    <div className="flex-center relative" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      
      {/* Abstract Background Glows */}
      <div style={{ position: 'absolute', top: '5%', left: '10%', width: '400px', height: '400px', background: 'var(--clr-primary)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '350px', height: '350px', background: 'var(--clr-primary-h)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />

      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '48px 40px', position: 'relative', zIndex: 10 }}>
        
        {/* Page Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', color: 'var(--clr-primary-h)', fontSize: '12px', fontWeight: 700, marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🔒 Privacy & Data Policy
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>Last Updated: August 2026 • How TU Notes Hub protects your personal data</p>
        </div>

        {/* Privacy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {sections.map((sec) => (
            <div key={sec.num} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.04] hover:border-indigo-500/20">
              
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'var(--clr-primary)', color: '#fff', fontSize: '12px', fontWeight: 800 }}>
                  {sec.num}
                </span>
                {sec.icon} {sec.title}
              </h2>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.6, paddingLeft: '40px' }}>
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '28px' }}>
          <Link href="/" className="btn btn-primary" style={{ padding: '12px 28px' }}>
            ← Return to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
