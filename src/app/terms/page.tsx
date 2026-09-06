import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | TU Notes Hub',
  description: 'Terms and conditions for using TU Notes Hub and its project marketplace.',
}

export default function TermsPage() {
  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto bg-[#0f101d] border border-indigo-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-indigo-400">1. Acceptance of Terms</h2>
            <p className="text-slate-300">By accessing and using TU Notes Hub, you accept and agree to be bound by the terms and provisions of this agreement.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-indigo-400">2. Description of Service</h2>
            <p className="text-slate-300">TU Notes Hub provides educational resources including notes, past papers, AI predictions, and a marketplace for students to buy and sell academic projects for educational purposes.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-indigo-400">3. User Accounts</h2>
            <p className="text-slate-300">You are responsible for maintaining the confidentiality of your account credentials and agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-indigo-400">4. Intellectual Property</h2>
            <p className="text-slate-300">Users retain ownership of original projects they upload while granting TU Notes Hub distribution rights to deliver approved projects to buyers according to platform terms.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-indigo-400">5. Limitation of Liability</h2>
            <p className="text-slate-300">TU Notes Hub shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.</p>
          </section>
        </div>

      </div>
    </div>
  )
}
