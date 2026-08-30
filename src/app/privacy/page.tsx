import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | TU Notes Hub',
  description: 'How we collect, use, and protect your data at TU Notes Hub.',
}

export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '32px' }}>Last Updated: August 2026</p>

        <div className="prose" style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This includes your name, email address, phone number, and college details.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services. This includes facilitating transactions on the project marketplace, sending you support messages, and personalizing the content (like suggesting relevant faculty notes).</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>3. Data Security</h2>
            <p>We implement robust security measures to protect your personal information. Passwords are securely hashed, and communication between your browser and our servers is encrypted using HTTPS. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>4. Cookies</h2>
            <p>We use cookies and similar technologies to track activity on our platform and hold certain information, primarily for authenticating your session and keeping you logged in securely.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
