import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Seller Policy & Verification | TU Notes Hub',
  description: 'Learn how to become a verified seller on TU Notes Hub, how project verification works, and payout rules.',
}

export default function SellerPolicyPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>Seller Policy & Verification</h1>
        
        <div className="prose" style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>How Are Projects Verified?</h2>
            <p>To ensure high quality and protect buyers, <strong>every single project uploaded to TU Notes Hub undergoes a manual review by our admins</strong> before it becomes visible in the marketplace.</p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <li><strong>Submission:</strong> The seller uploads the complete project zip (source code, DB, docs) to a Google Drive link and shares view access with us.</li>
              <li><strong>Code Review:</strong> Our admins download and inspect the code to ensure it is not malicious, contains the promised features, and matches the screenshots/demo.</li>
              <li><strong>Plagiarism Check:</strong> We verify that the project is not a direct, unmodified copy of a popular open-source repository (like a raw GitHub clone). Sellers must have built or significantly customized the project.</li>
              <li><strong>Approval:</strong> Once verified, the project status changes to "APPROVED" and is published to the marketplace.</li>
            </ol>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>How Do Seller Payouts Work?</h2>
            <p>We handle the payment processing so you don't have to deal with scammers or unverified payments.</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <li><strong>Revenue Share:</strong> Sellers earn a flat <strong>85%</strong> of the final sale price. The remaining 15% covers our payment gateway fees, server costs, and admin verification efforts.</li>
              <li><strong>Escrow Period:</strong> When a buyer purchases your project, the funds are held securely. After a 24-hour buyer protection window (to ensure they received the working code), the funds are cleared to your account balance.</li>
              <li><strong>Payouts:</strong> You can request a payout to your eSewa or Khalti account. Payouts are processed weekly.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Seller Violations & Bans</h2>
            <p>If a seller is caught selling severely broken code, refusing to help buyers with setup (if promised), or selling stolen intellectual property, their account will be permanently banned and any pending balance will be refunded to the affected buyers.</p>
          </section>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary">Go to Seller Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
