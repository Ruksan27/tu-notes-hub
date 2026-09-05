'use client'
// src/components/ads/AdUnit.tsx – Responsive Google AdSense Component
// Standard Google AdSense ad sizes & responsive fallbacks

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
  fixedSize: boolean   // true → fixed px dimensions, false → fluid
  accentColor: string
}

function getAdConfig(type: AdType): AdConfig {
  switch (type) {
    case 'leaderboard':
    case 'banner':
      return { width: '100%', height: 'auto', fixedSize: false, accentColor: 'rgba(6,182,212,0.3)' }
    case 'medium-rectangle':
    case 'sidebar':
      return { width: '100%', height: 'auto', fixedSize: false, accentColor: 'rgba(99,102,241,0.3)' }
    case 'large-rectangle':
      return { width: '100%', height: 'auto', fixedSize: false, accentColor: 'rgba(139,92,246,0.3)' }
    case 'inline':
    default:
      return { width: '100%', height: 'auto', fixedSize: false, accentColor: 'rgba(6,182,212,0.2)' }
  }
}

// ──────────────────────────────────────────────
// Placeholder content shown when AdSense is blocked / dev mode
// ──────────────────────────────────────────────
function AdPlaceholder({ type }: { type: AdType }) {
  if (type === 'leaderboard' || type === 'banner') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', width: '100%', padding: '12px 16px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>🎓</span>
          <div>
            <span style={{
              fontSize: '8.5px', background: 'var(--clr-primary-h)', color: '#fff',
              padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '2px', fontWeight: 700
            }}>[ Google AdSense ]</span>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-primary-h)', margin: 0 }}>
              Need a Study Boost? Upgrade to Elite Pass!
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--clr-text-2)', margin: 0 }}>
              Ad-free downloads · AI Predictions · Full PDF Solutions
            </p>
          </div>
        </div>
        <a href="/pricing" style={{
          flexShrink: 0, padding: '7px 16px', borderRadius: '6px',
          background: 'var(--grad-brand)', color: '#fff', fontSize: '12px', fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap', margin: '0 auto',
        }}>
          Upgrade →
        </a>
      </div>
    )
  }

  if (type === 'medium-rectangle' || type === 'sidebar') {
    return (
      <div style={{ textAlign: 'center', padding: '14px', width: '100%', boxSizing: 'border-box' }}>
        <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>💡</span>
        <span style={{
          fontSize: '8.5px', background: 'var(--clr-primary-h)', color: '#fff',
          padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px', fontWeight: 700
        }}>[ Google AdSense ]</span>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-accent)', marginBottom: '6px' }}>
          TU Notes Hub
        </h4>
        <p style={{ fontSize: '11.5px', color: 'var(--clr-text-2)', lineHeight: 1.5, margin: '0 0 12px' }}>
          Best lecture notes, cheatsheets &amp; question banks for TU faculties.
        </p>
        <a href="/pricing" style={{
          display: 'inline-block', padding: '7px 16px', borderRadius: '6px',
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
      <div style={{ textAlign: 'center', padding: '14px', width: '100%', boxSizing: 'border-box' }}>
        <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>📚</span>
        <span style={{
          fontSize: '8.5px', background: '#7c3aed', color: '#fff',
          padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px', fontWeight: 700
        }}>[ Google AdSense ]</span>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '6px' }}>
          Exam Prep Made Easy
        </h4>
        <p style={{ fontSize: '11.5px', color: 'var(--clr-text-2)', lineHeight: 1.5, margin: '0 0 12px' }}>
          AI MCQs · Solved Past Papers · Chapter-wise Notes.
        </p>
        <a href="/pricing" style={{
          display: 'inline-block', padding: '8px 18px', borderRadius: '6px',
          background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff',
          fontSize: '12px', fontWeight: 700, textDecoration: 'none',
        }}>
          Get Full Access
        </a>
      </div>
    )
  }

  // inline / fallback
  return (
    <div style={{ textAlign: 'center', padding: '14px', width: '100%', boxSizing: 'border-box' }}>
      <span style={{ fontSize: '30px', display: 'block', marginBottom: '4px' }}>📱</span>
      <span style={{
        fontSize: '8.5px', background: 'var(--clr-primary-h)', color: '#fff',
        padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px', fontWeight: 700
      }}>[ Google AdSense Slot ]</span>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-text-1)', marginBottom: '4px' }}>
        Join our Telegram Group
      </h4>
      <p style={{ fontSize: '11.5px', color: 'var(--clr-text-3)', margin: '0 0 10px', lineHeight: 1.4 }}>
        Get instant notifications on TU results &amp; exam updates.
      </p>
      <a href="https://t.me/tunoteshub" target="_blank" rel="noopener noreferrer" style={{
        fontSize: '12px', color: '#67e8f9', fontWeight: 700, display: 'inline-block',
        border: '1px solid rgba(6,182,212,0.4)', padding: '6px 16px', borderRadius: '6px',
        textDecoration: 'none', background: 'rgba(6,182,212,0.08)'
      }}>
        Join Group →
      </a>
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

  const containerStyle: React.CSSProperties = {
    margin: '16px auto',
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }

  const boxStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    minHeight: '80px',
    background: 'rgba(255,255,255,0.02)',
    border: `1px dashed ${cfg.accentColor}`,
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...style,
  }

  const insStyle: React.CSSProperties = { display: 'block', width: '100%', minHeight: '80px' }

  return (
    <div className="tu-display-unit" style={containerStyle}>
      {/* "Sponsored" label */}
      <p style={{
        fontSize: '8.5px', color: 'var(--clr-text-3)', textTransform: 'uppercase',
        letterSpacing: '1.2px', marginBottom: '4px', fontWeight: 700, textAlign: 'center',
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
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Dev/adblocker placeholder — relative layout to prevent overlap */}
        <div style={{
          width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${cfg.accentColor.replace('0.3', '0.04')}, rgba(6,182,212,0.04))`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <AdPlaceholder type={type} />
        </div>
      </div>
    </div>
  )
}
