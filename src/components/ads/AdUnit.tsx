'use client'
// src/components/ads/AdUnit.tsx
// Standard Google AdSense ad sizes:
//  • leaderboard      → 728 × 90  px  (header / top of page)
//  • medium-rectangle → 300 × 250 px  (sidebar)  ← gold standard, highest CPM
//  • large-rectangle  → 336 × 280 px  (inside content / tutorials)
//  • inline           → fluid width    (legacy fallback, responsive)

import React, { useEffect, useState } from 'react'

type AdType = 'leaderboard' | 'medium-rectangle' | 'sidebar' | 'large-rectangle' | 'inline' | 'banner'

interface AdUnitProps {
  type: AdType
  slot?: string
  style?: React.CSSProperties
}

interface AdConfig {
  width: number | string
  height: number | string
  fixedSize: boolean   // true → fixed px dimensions (non-responsive), false → fluid
  accentColor: string
}

function getAdConfig(type: AdType): AdConfig {
  switch (type) {
    case 'leaderboard':
    case 'banner':
      // 728×90 — Leaderboard
      return { width: 728, height: 90, fixedSize: true, accentColor: 'rgba(6,182,212,0.3)' }
    case 'medium-rectangle':
    case 'sidebar':
      // 300×250 — Medium Rectangle (gold standard)
      return { width: 300, height: 250, fixedSize: true, accentColor: 'rgba(99,102,241,0.3)' }
    case 'large-rectangle':
      // 336×280 — Large Rectangle (inside content)
      return { width: 336, height: 280, fixedSize: true, accentColor: 'rgba(139,92,246,0.3)' }
    case 'inline':
    default:
      // Fluid responsive
      return { width: '100%', height: 250, fixedSize: false, accentColor: 'rgba(6,182,212,0.2)' }
  }
}

// ──────────────────────────────────────────────
// Placeholder content shown when AdSense is blocked / dev mode
// ──────────────────────────────────────────────
function AdPlaceholder({ type }: { type: AdType }) {
  if (type === 'leaderboard' || type === 'banner') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '0 20px' }}>
        <span style={{ fontSize: '30px', flexShrink: 0 }}>🎓</span>
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: '9px', background: 'var(--clr-primary-h)', color: '#fff',
            padding: '2px 7px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px',
          }}>[ Google AdSense — 728×90 Leaderboard ]</span>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)', margin: '0 0 2px' }}>
            Need a Study Boost? Upgrade to Elite Pass!
          </h4>
          <p style={{ fontSize: '11.5px', color: 'var(--clr-text-2)', margin: 0 }}>
            Ad-free downloads · AI Predictions · Full PDF Solutions — Rs. 199/year
          </p>
        </div>
        <a href="/pricing" style={{
          flexShrink: 0, padding: '8px 18px', borderRadius: '8px',
          background: 'var(--grad-brand)', color: '#fff', fontSize: '12px', fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Upgrade →
        </a>
      </div>
    )
  }

  if (type === 'medium-rectangle' || type === 'sidebar') {
    return (
      <div style={{ textAlign: 'center', padding: '8px' }}>
        <span style={{ fontSize: '38px', display: 'block', marginBottom: '10px' }}>💡</span>
        <span style={{
          fontSize: '9px', background: 'var(--clr-primary-h)', color: '#fff',
          padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '10px',
        }}>[ Google AdSense — 300×250 ]</span>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-accent)', marginBottom: '8px' }}>
          TU Notes Hub
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--clr-text-2)', lineHeight: 1.55, margin: '0 0 14px' }}>
          Best lecture notes, cheatsheets &amp; question banks for BCA, CSIT, and BBS.
        </p>
        <a href="/pricing" style={{
          display: 'inline-block', padding: '8px 18px', borderRadius: '8px',
          background: 'var(--grad-brand)', color: '#fff', fontSize: '12px', fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
        }}>
          Learn More
        </a>
      </div>
    )
  }

  if (type === 'large-rectangle') {
    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>📚</span>
        <span style={{
          fontSize: '9px', background: '#7c3aed', color: '#fff',
          padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '10px',
        }}>[ Google AdSense — 336×280 ]</span>
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '8px' }}>
          Exam Prep Made Easy
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
          AI-generated MCQs · Solved Past Papers · Chapter-wise Notes for TU students.
        </p>
        <a href="/pricing" style={{
          display: 'inline-block', padding: '9px 22px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff',
          fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
        }}>
          Get Full Access
        </a>
      </div>
    )
  }

  // inline / fallback
  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>📱</span>
      <span style={{
        fontSize: '9px', background: 'var(--clr-primary-h)', color: '#fff',
        padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '10px',
      }}>[ Google AdSense Slot ]</span>
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
        Join our Telegram Group
      </h4>
      <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Get instant notifications on TU results, schedules, and exam updates.
      </p>
      <span style={{
        fontSize: '13px', color: 'var(--clr-primary-h)', fontWeight: 700,
        border: '1px solid var(--clr-primary-h)', padding: '8px 18px', borderRadius: '6px',
      }}>
        Join Group →
      </span>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main AdUnit
// ──────────────────────────────────────────────
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

  const cfg = getAdConfig(type)
  const w = typeof cfg.width === 'number' ? `${cfg.width}px` : cfg.width
  const h = typeof cfg.height === 'number' ? `${cfg.height}px` : `${cfg.height}px`

  const containerStyle: React.CSSProperties = {
    margin: '0 auto',
    width: w,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...(!cfg.fixedSize && { width: '100%', maxWidth: '100%' }),
  }

  const boxStyle: React.CSSProperties = {
    width: w,
    height: h,
    background: 'rgba(255,255,255,0.02)',
    border: `1px dashed ${cfg.accentColor}`,
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...(!cfg.fixedSize && { width: '100%', minHeight: h }),
    ...style,
  }

  const insStyle: React.CSSProperties = cfg.fixedSize
    ? { display: 'inline-block', width: w, height: h }
    : { display: 'block', width: '100%', height: '100%' }

  return (
    <div className="adsbox google-ads-wrapper" style={containerStyle}>
      {/* "Sponsored" label */}
      <p style={{
        fontSize: '8.5px', color: 'var(--clr-text-3)', textTransform: 'uppercase',
        letterSpacing: '1.2px', marginBottom: '5px', fontWeight: 700, textAlign: 'center',
      }}>
        Sponsored Advertisement
      </p>

      <div style={boxStyle}>
        {/* Real Google AdSense <ins> tag */}
        <ins
          className="adsbygoogle"
          style={insStyle}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-YOUR_PUBLISHER_ID'}
          data-ad-slot={slot}
          {...(cfg.fixedSize
            ? {}
            : { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' }
          )}
        />

        {/* Dev/adblocker placeholder — sits on top of <ins>, pointer-events none */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${cfg.accentColor.replace('0.3', '0.04')}, rgba(6,182,212,0.04))`,
          pointerEvents: 'none', zIndex: 1, padding: '10px',
        }}>
          <AdPlaceholder type={type} />
        </div>
      </div>
    </div>
  )
}
