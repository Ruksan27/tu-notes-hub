import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | TU Notes Hub',
  description: 'How we collect, use, and protect your data at TU Notes Hub.',
}

export default function PrivacyPage() {
  const sections = [
    {
      num: 1,
      title: 'Information We Collect',
      icon: '📊',
      content: 'We collect information you provide directly to us, such as when you create or modify your account, purchase notes or projects, contact customer support, or communicate with us. This includes your name, email address, phone number, and college/faculty details.'
    },
    {
      num: 2,
      title: 'How We Use Your Information',
      icon: '⚡',
      content: 'We use the information we collect to provide, maintain, and improve our academic services. This includes processing Marketplace transactions, verifying project downloads, sending order confirmations, and suggesting relevant notes for your semester.'
    },
    {
      num: 3,
      title: 'Data Security & Protection',
      icon: '🛡️',
      content: 'We implement robust industry-standard security measures to protect your personal data. All user passwords are encrypted using secure bcrypt hashing, and communication between your browser and our servers is fully encrypted using HTTPS SSL certificates.'
    },
    {
      num: 4,
      title: 'Cookies & Authentication',
      icon: '🍪',
      content: 'We use essential cookies and local browser storage to keep you logged in securely, remember your cart items, and deliver customized content based on your selected faculty.'
    }
  ]

  return (
    <div className="min-h-[85vh] py-10 sm:py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto bg-[#0d0e1b] border border-cyan-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-3">
            🔒 Privacy & Data Policy
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">Last Updated: August 2026 • How TU Notes Hub protects your personal data</p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-5">
          {sections.map((sec) => (
            <div key={sec.num} className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/8 hover:border-cyan-500/30 transition-colors space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-cyan-300 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-black flex items-center justify-center border border-cyan-500/30">
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
            className="w-full sm:w-auto text-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-cyan-600/25 active:scale-95"
          >
            ← Return to Home
          </Link>
        </div>

      </div>
    </div>
  )
}
