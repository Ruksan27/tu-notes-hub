import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | TU Notes Hub',
  description: 'Terms and conditions for using TU Notes Hub and its project marketplace.',
}

export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '32px' }}>Last Updated: August 2026</p>

        <div className="prose" style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>1. Acceptance of Terms</h2>
            <p>By accessing and using TU Notes Hub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>2. Description of Service</h2>
            <p>TU Notes Hub provides educational resources including notes, past papers, AI predictions, and a marketplace for students to buy and sell academic projects. The projects sold are intended for learning, reference, and educational purposes only.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>4. Intellectual Property</h2>
            <p>Users retain ownership of the original projects they upload. By uploading a project to the marketplace, you grant TU Notes Hub the right to distribute and sell it to buyers on the platform according to your set terms.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>5. Limitation of Liability</h2>
            <p>TU Notes Hub shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or the projects purchased from the marketplace.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
