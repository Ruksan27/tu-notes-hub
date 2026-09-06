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
      content: 'By accessing and using TU Notes Hub, you accept and agree to be bound by the terms, conditions, and provisions of this agreement. If you do not agree with any part of these terms, you must discontinue platform usage immediately.'
    },
    {
      num: 2,
      title: 'Description of Service',
      icon: '🎓',
      content: 'TU Notes Hub provides comprehensive educational resources including verified notes, past year question papers, AI exam predictions, and an open marketplace for students to buy and sell academic projects for educational & research purposes.'
    },
    {
      num: 3,
      title: 'User Accounts & Security',
      icon: '🔐',
      content: 'You are responsible for maintaining the confidentiality of your account credentials (email and password). You agree to accept full responsibility for all activities, purchases, and project submissions that occur under your account.'
    },
    {
      num: 4,
      title: 'Intellectual Property & Code Rights',
      icon: '💡',
      content: 'Users retain original copyright ownership of projects they upload. By listing a project, sellers grant TU Notes Hub non-exclusive distribution rights to deliver verified source code packages and documentation to buyers according to platform terms.'
    },
    {
      num: 5,
      title: 'Limitation of Liability & Fair Use',
      icon: '🛡️',
      content: 'TU Notes Hub shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services. Projects bought on the marketplace are intended as reference templates and learning resources.'
    }
  ]

  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto bg-[#0d0e1b] border border-indigo-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
            📜 Platform Agreement
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Last Updated: August 2026 • Legal terms for using TU Notes Hub</p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-5">
          {sections.map((sec) => (
            <div key={sec.num} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-indigo-500/30 transition-colors space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-indigo-300 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center border border-indigo-500/30">
                  {sec.num}
                </span>
                <span>{sec.icon} {sec.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-9">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="pt-4 border-t border-white/10 flex justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/25 active:scale-95"
          >
            ← Return to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
