import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Seller Declaration & Terms | TU Notes Hub',
  description: 'Seller declaration terms and conditions for project upload on TU Notes Hub.',
}

export default function SellerDeclarationPage() {
  const declarations = [
    "I own or have the right to sell this project.",
    "The project description and features are accurate.",
    "The screenshots and demo represent the actual project.",
    "The technologies and requirements are accurate.",
    "The files in my provided Drive folder are the actual files intended for sale.",
    "The source code matches the project listing.",
    "I have removed passwords, API keys, tokens and other sensitive information from the submitted project.",
    "If I provide GitHub, the source repository is PRIVATE.",
    "I understand that TU Notes may download, inspect, verify and store the project files for marketplace delivery.",
    "I agree to the applicable 20–25% platform commission.",
    "I agree to TU Notes payment, delivery, refund and dispute policies."
  ]

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '44px 36px' }}>
        
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>
            Seller Declaration
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '14px' }}>
            Mandatory terms & conditions for all marketplace sellers uploading projects.
          </p>
        </div>

        {/* Content List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {declarations.map((text, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'flex-start', 
              padding: '16px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--clr-border)', 
              borderRadius: 'var(--radius-md)' 
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'rgba(99,102,241,0.15)', 
                color: 'var(--clr-primary)', 
                fontWeight: 800, 
                borderRadius: '50%', 
                width: '24px', 
                height: '24px', 
                fontSize: '12px', 
                flexShrink: 0 
              }}>
                {idx + 1}
              </span>
              <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '15px' }}>
            ← Return to Dashboard
          </Link>
        </div>
        
        <p className="text-center" style={{ color: 'var(--clr-text-3)', fontSize: '12px', marginTop: '24px' }}>
          By uploading a project on TU Notes Hub, you automatically agree to these terms.
        </p>

      </div>
    </div>
  )
}
