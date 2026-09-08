import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | TU Notes Hub',
  description: 'Terms and conditions for using TU Notes Hub and its project marketplace.',
}

export default function TermsPage() {
  const sections = [
    {
      num: 1,
      title: 'Acceptance of Terms',
      icon: '📜',
      content: 'By registering an account and using TU Notes Hub, you accept and agree to be bound by these terms. If you do not agree with any part of these terms, please do not create an account or use our platform.'
    },
    {
      num: 2,
      title: 'Description of Service',
      icon: '🎓',
      content: 'TU Notes Hub provides comprehensive educational resources including verified notes, past year question papers, and syllabuses to assist university students in their academic journey.'
    },
    {
      num: 3,
      title: 'User Accounts & Security',
      icon: '🔐',
      content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to accept full responsibility for all activities that occur under your account. Please use a strong password and do not share your account details.'
    },
    {
      num: 4,
      title: 'Content & Fair Use',
      icon: '📚',
      content: 'The study materials provided on this platform are for educational reference and personal study only. Users may not systematically scrape, redistribute, or commercially exploit the content provided by TU Notes Hub.'
    },
    {
      num: 5,
      title: 'Account Termination',
      icon: '🛑',
      content: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in spamming, or attempt to compromise the security and integrity of the platform.'
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
            📜 Platform Agreement
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '14px' }}>Last Updated: August 2026 • Legal terms for using TU Notes Hub</p>
        </div>

        {/* Terms Sections */}
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
