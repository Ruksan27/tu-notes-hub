'use client'
// src/components/ads/AdUnit.tsx – Responsive Google AdSense Component

import React, { useEffect, useState } from 'react'

type AdType = 'leaderboard' | 'medium-rectangle' | 'sidebar' | 'large-rectangle' | 'inline' | 'banner'

interface AdUnitProps {
  type: AdType
  slot?: string
  style?: React.CSSProperties
}

// Placeholder content shown when AdSense is blocked / dev mode / unfilled
function AdPlaceholder({ type }: { type: AdType }) {
  if (type === 'leaderboard' || type === 'banner') {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full p-4 sm:px-6 sm:py-3.5 box-border">
        <div className="flex items-center gap-3.5 min-w-0 text-center sm:text-left">
          <span className="text-2xl shrink-0">🎓</span>
          <div className="min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                Google AdSense
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate m-0">
              Upgrade to Elite Pass!
            </h4>
            <p className="text-xs text-slate-400 truncate m-0">
              Ad-free downloads · AI Exam Predictions · Instant Access
            </p>
          </div>
        </div>
        <a 
          href="/pricing" 
          className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-xs font-bold no-underline shadow-md hover:opacity-90 transition-all"
        >
          Upgrade Now →
        </a>
      </div>
    )
  }

  if (type === 'medium-rectangle' || type === 'sidebar' || type === 'large-rectangle') {
    return (
      <div className="text-center p-5 w-full box-border flex flex-col items-center justify-center">
        <span className="text-3xl block mb-2">💡</span>
        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded mb-2 inline-block">
          Google AdSense
        </span>
        <h4 className="text-base font-bold text-white mb-1">
          TU Notes Hub
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-3 max-w-xs">
          Best lecture notes, cheatsheets &amp; solved past papers for TU faculties.
        </p>
        <a 
          href="/pricing" 
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold no-underline shadow-md hover:opacity-90 transition-all"
        >
          Learn More →
        </a>
      </div>
    )
  }

  // inline / fallback (Telegram & updates banner)
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 w-full p-4 sm:px-6 sm:py-4 box-border">
      <div className="flex items-center gap-3.5 min-w-0 text-center sm:text-left">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl shrink-0">
          📱
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
              Google AdSense Slot
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white m-0 leading-tight">
            Join our Official Telegram Group
          </h4>
          <p className="text-xs text-slate-400 m-0 mt-0.5">
            Get instant notifications on TU exam schedules, routine updates &amp; results.
          </p>
        </div>
      </div>
      <a 
        href="https://t.me/tunoteshub" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="shrink-0 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-bold no-underline transition-all shadow-sm"
      >
        Join Group →
      </a>
    </div>
  )
}

export default function AdUnit({ type, slot = 'default-slot', style }: AdUnitProps) {
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          setIsPaidUser(true)
          return
        }
      }
    } catch {}

    try {
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch {}
  }, [])

  if (isPaidUser) return null

  return (
    <div className="tu-display-unit my-4 w-full flex justify-center">
      <div 
        className="w-full max-w-5xl bg-slate-900/70 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden relative shadow-lg"
        style={style}
      >
        {/* Real Google AdSense <ins> tag */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', position: 'absolute', inset: 0, opacity: 0, zIndex: 1, pointerEvents: 'auto' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-8555533919324648'}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Fallback Banner when AdSense is loading/not filled */}
        <div className="w-full relative z-0 bg-gradient-to-r from-indigo-500/5 via-slate-900/40 to-cyan-500/5">
          <AdPlaceholder type={type} />
        </div>
      </div>
    </div>
  )
}
