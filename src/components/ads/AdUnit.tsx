'use client'
// src/components/ads/AdUnit.tsx – High-RPM Google AdSense Component
// Premium users (SEMESTER_PASS, ELITE_AI) see NO ads.
// Free users see real AdSense units with high-RPM fallback placeholders.

import React, { useEffect, useRef, useState } from 'react'

type AdType =
  | 'leaderboard'       // 728x90  – Top of page, high CPM
  | 'medium-rectangle'  // 300x250 – Highest fill rate, best RPM
  | 'large-rectangle'   // 336x280 – Slightly better than medium
  | 'half-page'         // 300x600 – Highest CPM of all formats
  | 'sidebar'           // 300x600 alias for sidebar placement
  | 'inline'            // Responsive inline
  | 'banner'            // 320x50 mobile banner

// Google AdSense Publisher ID & slots
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-8555533919324648'

// Map each ad type to its ideal fixed size [width, height] and ad-format
// 300x600 (half-page) and 300x250 (medium-rectangle) have highest CPM
const AD_CONFIG: Record<AdType, { w: number; h: number; format: string; responsive: boolean }> = {
  'leaderboard':       { w: 728,  h: 90,  format: 'horizontal',    responsive: true  },
  'medium-rectangle':  { w: 300,  h: 250, format: 'rectangle',     responsive: false },
  'large-rectangle':   { w: 336,  h: 280, format: 'rectangle',     responsive: false },
  'half-page':         { w: 300,  h: 600, format: 'rectangle',     responsive: false },
  'sidebar':           { w: 300,  h: 600, format: 'rectangle',     responsive: false },
  'inline':            { w: 468,  h: 60,  format: 'auto',          responsive: true  },
  'banner':            { w: 320,  h: 50,  format: 'auto',          responsive: true  },
}

// Fallback placeholder shown when AdSense is loading/blocked/unfilled
function AdPlaceholder({ type }: { type: AdType }) {
  const isTall = type === 'half-page' || type === 'sidebar'
  const isLeader = type === 'leaderboard' || type === 'banner'

  if (isLeader) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 20px', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>🎓</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Upgrade to Elite Pass — Ad-free + AI Predictions
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
              Instant downloads · Cheatsheets · Full Solutions
            </p>
          </div>
        </div>
        <a
          href="/pricing"
          style={{ flexShrink: 0, padding: '7px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
        >
          Upgrade Now →
        </a>
      </div>
    )
  }

  if (isTall) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center', gap: '12px', height: '100%' }}>
        <span style={{ fontSize: '40px' }}>💎</span>
        <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Sponsored
        </span>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
          Go Elite.<br />Zero Ads.
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, maxWidth: '200px' }}>
          Full AI exam predictions, instant downloads & offline PDFs.
        </p>
        <a
          href="/pricing"
          style={{ marginTop: '8px', padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', width: '80%', textAlign: 'center' }}
        >
          Unlock Now →
        </a>
        <p style={{ margin: 0, fontSize: '10px', color: '#475569', marginTop: '4px' }}>Limited time offer</p>
      </div>
    )
  }

  // medium-rectangle / large-rectangle / inline fallback
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', textAlign: 'center', gap: '8px' }}>
      <span style={{ fontSize: '28px' }}>📚</span>
      <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Google AdSense
      </span>
      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fff' }}>TU Notes Hub</h4>
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
        Notes, MCQs, Past Papers & AI Predictions for every TU Faculty.
      </p>
      <a
        href="/pricing"
        style={{ marginTop: '6px', padding: '7px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
      >
        Learn More →
      </a>
    </div>
  )
}

export default function AdUnit({ type, slot = 'default-slot', style }: {
  type: AdType
  slot?: string
  style?: React.CSSProperties
}) {
  const [isPaidUser, setIsPaidUser] = useState(true) // default true = no flash
  const [initialized, setInitialized] = useState(false)
  const insRef = useRef<HTMLModElement>(null)
  const cfg = AD_CONFIG[type]

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
    setIsPaidUser(false)
    setInitialized(true)
  }, [])

  // Push AdSense unit after confirming free user
  useEffect(() => {
    if (!initialized || isPaidUser) return
    try {
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch {}
  }, [initialized, isPaidUser])

  // Premium users → completely invisible, no DOM element
  if (isPaidUser && initialized) return null
  // Before hydration → render nothing to avoid layout shift flicker
  if (!initialized) return null

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    margin: '12px 0',
    ...style,
  }

  const boxStyle: React.CSSProperties = {
    position: 'relative',
    width: cfg.responsive ? '100%' : `${cfg.w}px`,
    maxWidth: '100%',
    minHeight: `${cfg.h}px`,
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  }

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        {/* Real AdSense <ins> overlaid on top (opacity 0 → filled by Google) */}
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: cfg.responsive ? '100%' : `${cfg.w}px`,
            height: `${cfg.h}px`,
            position: 'absolute',
            inset: 0,
            zIndex: 2,
          }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={cfg.responsive ? 'auto' : undefined}
          data-full-width-responsive={cfg.responsive ? 'true' : undefined}
        />
        {/* Fallback placeholder (behind AdSense layer, visible when ad is unfilled) */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: `${cfg.h}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AdPlaceholder type={type} />
        </div>
      </div>
    </div>
  )
}
