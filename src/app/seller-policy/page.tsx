import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Seller Policy & Verification | TU Notes Hub',
  description: 'Learn how to become a verified seller on TU Notes Hub, how project verification works, and payout rules.',
}

export default function SellerPolicyPage() {
  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8" style={{ background: 'var(--clr-bg-800)', border: '1px solid var(--clr-border)' }}>

        {/* Page Header */}
        <div className="border-b pb-6" style={{ borderColor: 'var(--clr-border)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--clr-text-2)' }}>
            📜 Official Terms & Rules
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--clr-text-1)' }}>Seller Rules & Regulations</h1>
          <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--clr-text-3)' }}>Last Updated: August 2026 • Mandatory for all marketplace sellers</p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          
          <div className="p-4 sm:p-5 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--clr-text-1)' }}>
              <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center" style={{ background: 'var(--clr-primary)', color: '#fff' }}>1</span>
              Project Verification & Quality Control
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: 'var(--clr-text-2)' }}>
              To protect buyers and maintain high platform quality, every submitted project is manually reviewed by TU Notes admins. Sellers must submit original or significantly modified source code accompanied by accurate descriptions, demo links/screenshots, and setup guides.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--clr-text-1)' }}>
              <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center" style={{ background: 'var(--clr-primary)', color: '#fff' }}>2</span>
              Platform Revenue Share & Commission
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: 'var(--clr-text-2)' }}>
              Sellers earn <strong style={{ color: 'var(--clr-primary)' }}>75%–80%</strong> of the sale price. A 20–25% platform commission covers secure payment processing, escrow protection, server bandwidth, and administrative verification. Payouts are processed weekly via eSewa, Khalti, or Bank Transfer.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--clr-text-1)' }}>
              <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center" style={{ background: 'var(--clr-primary)', color: '#fff' }}>3</span>
              Off-Platform Deals & Direct Bypassing
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: 'var(--clr-text-2)' }}>
              All transactions, communication, and file deliveries must strictly take place within TU Notes Hub. Attempting to deal directly with buyers outside the platform or bypassing platform fees is strictly forbidden.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--clr-text-1)' }}>
              <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center" style={{ background: 'var(--clr-primary)', color: '#fff' }}>4</span>
              Private Code Repositories & Intellectual Property
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: 'var(--clr-text-2)' }}>
              The source-code repository for listed projects MUST remain PRIVATE before and during the sale. Uploading stolen, pirated, or unauthorized third-party content will result in immediate removal and forfeiture of earnings.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--clr-border)' }}>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2" style={{ color: 'var(--clr-text-1)' }}>
              <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center" style={{ background: 'var(--clr-primary)', color: '#fff' }}>5</span>
              Violations & Account Suspension
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed pl-8" style={{ color: 'var(--clr-text-2)' }}>
              Violating these rules, submitting malicious code, or failing to deliver advertised features will lead to project removal, payout holds, seller badge revocation, or permanent account termination.
            </p>
          </div>

        </div>

        {/* Back Button */}
        <div className="pt-6 border-t flex justify-center" style={{ borderColor: 'var(--clr-border)' }}>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center px-8 py-3 rounded-xl font-bold transition-all btn"
            style={{ background: 'var(--clr-primary)', color: 'white' }}
          >
            ← Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
