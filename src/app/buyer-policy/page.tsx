import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Buyer Policy & Safety | TU Notes Hub',
  description: 'How we protect project buyers, how payments work, and delivery guarantees.',
}

export default function BuyerPolicyPage() {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-lg)' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '24px' }}>Buyer Policy & Safety Guarantees</h1>
        
        <div className="prose" style={{ color: 'var(--clr-text-2)', lineHeight: 1.7, fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>1. Buying with Confidence</h2>
            <p>At TU Notes Hub, you are protected from common internet scams. We do not allow sellers to ask for direct payments. All transactions must go through our platform.</p>
            <p style={{ marginTop: '8px' }}>
              Before a project is ever listed on our platform, our admin team has manually downloaded and inspected the code to ensure it is legitimate and matches the description.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>2. How Does Payment & Delivery Work?</h2>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <li><strong>Checkout:</strong> You pay securely via eSewa or Khalti directly on TU Notes Hub.</li>
              <li><strong>Funds Held:</strong> The money does NOT go immediately to the seller. We hold the funds securely.</li>
              <li><strong>Instant Delivery:</strong> Upon successful payment verification, you immediately receive a secure download link (or Google Drive link) to the project source code, database, and documentation.</li>
              <li><strong>Verification Window:</strong> You have 24 hours to download and inspect the files. If the files are missing or the code is entirely broken/false advertised, you can raise a dispute to freeze the funds.</li>
            </ol>
          </section>

          <section>
            <h2 style={{ color: 'var(--clr-text-1)', fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>3. What is NOT Covered</h2>
            <p>We guarantee you will get the exact code that was advertised. However, we do <strong>NOT</strong> guarantee:</p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <li>That your teacher will give you full marks for the project.</li>
              <li>That the code will run perfectly if your PC lacks the necessary environment (e.g., you don't have Node.js or XAMPP installed correctly). Please check the project requirements before buying.</li>
              <li>Free customization. If you want the seller to change the UI or add new features, you must negotiate that with them separately.</li>
            </ul>
          </section>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/refund-policy" className="btn btn-outline">Read Full Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
