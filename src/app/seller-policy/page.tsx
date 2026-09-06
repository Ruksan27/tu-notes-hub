import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Seller Policy & Verification | TU Notes Hub',
  description: 'Learn how to become a verified seller on TU Notes Hub, how project verification works, and payout rules.',
}

export default function SellerPolicyPage() {
  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto bg-[#0f101d] border border-indigo-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
            📜 Official Terms & Rules
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Seller Rules & Regulations</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Last Updated: August 2026 • Mandatory for all marketplace sellers</p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">1</span>
              Project Verification & Quality Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
              To protect buyers and maintain high platform quality, every submitted project is manually reviewed by TU Notes admins. Sellers must submit original or significantly modified source code accompanied by accurate descriptions, demo links/screenshots, and setup guides.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">2</span>
              Platform Revenue Share & Commission
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
              Sellers earn <strong className="text-emerald-400 font-extrabold">75%–80%</strong> of the sale price. A 20–25% platform commission covers secure payment processing, escrow protection, server bandwidth, and administrative verification. Payouts are processed weekly via eSewa, Khalti, or Bank Transfer.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">3</span>
              Off-Platform Deals & Direct Bypassing
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
              All transactions, communication, and file deliveries must strictly take place within TU Notes Hub. Attempting to deal directly with buyers outside the platform or bypassing platform fees is strictly forbidden.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">4</span>
              Private Code Repositories & Intellectual Property
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
              The source-code repository for listed projects MUST remain PRIVATE before and during the sale. Uploading stolen, pirated, or unauthorized third-party content will result in immediate removal and forfeiture of earnings.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">5</span>
              Violations & Account Suspension
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
              Violating these rules, submitting malicious code, or failing to deliver advertised features will lead to project removal, payout holds, seller badge revocation, or permanent account termination.
            </p>
          </div>

        </div>

        {/* Back Button */}
        <div className="pt-4 border-t border-white/10 flex justify-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/25 active:scale-95"
          >
            ← Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
