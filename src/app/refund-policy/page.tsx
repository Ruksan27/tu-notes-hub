import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | TU Notes Hub',
  description: 'Understand how refunds work on the TU Notes Hub project marketplace.',
}

export default function RefundPolicyPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>Refund Policy</h1>
        
        <div className="prose" style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px', color: 'var(--clr-text-1)' }}>
            <strong>TL;DR:</strong> Digital goods (Projects) are generally <strong>Non-Refundable</strong> once the source code has been delivered. Please review demos, screenshots, and features carefully before buying.
          </div>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>1. General Rule</h2>
            <p>Due to the nature of digital goods (source code, database files, and documentation), projects cannot be "returned" once downloaded. Therefore, we do not offer refunds for "change of mind" or if you simply decide you don't need the project anymore after receiving the files.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>2. When Refunds ARE Issued</h2>
            <p>We will issue a full refund (or replacement) under the following strict conditions:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Missing Files:</strong> The delivered zip file does not contain the source code, database, or documentation promised on the project page.</li>
              <li><strong>Fundamentally Broken:</strong> The code is severely broken and cannot be run, and the seller fails to provide a fix or support within a reasonable timeframe (48 hours).</li>
              <li><strong>False Advertising:</strong> The project completely misrepresents its features. (e.g., claiming to have a payment gateway when it doesn't).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>3. How Payments Work & The Protection Window</h2>
            <p>When you purchase a project via eSewa/Khalti on TU Notes Hub, the funds are <strong>held securely by our platform</strong>. We do not release the money to the seller immediately. We hold the funds for a protection window to ensure you have received what was advertised. If you raise a valid dispute within 24 hours of delivery, the funds will be frozen while we investigate.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>4. How to Request a Refund</h2>
            <p>If you face a critical issue, please contact us at <a href="mailto:tunoteshub@gmail.com" style={{ color: 'var(--clr-primary-h)' }}>tunoteshub@gmail.com</a> or via our WhatsApp support immediately after receiving the files. Provide your Order ID and detailed proof (screenshots/errors) of why the project is invalid.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
