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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', boxSizing: 'border-box', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🎓</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              fontSize: '8px', background: 'var(--clr-primary-h)', color: '#fff',
              padding: '1px 5px', borderRadius: '3px', display: 'inline-block', marginBottom: '2px', fontWeight: 700
            }}>[ Google AdSense ]</span>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--clr-primary-h)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Upgrade to Elite Pass!
            </h4>
            <p style={{ fontSize: '10px', color: 'var(--clr-text-2)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Ad-free downloads · AI Predictions
            </p>
          </div>
        </div>
        <a href="/pricing" style={{
          flexShrink: 0, padding: '6px 12px', borderRadius: '6px',
          background: 'var(--grad-brand)', color: '#ffffff', fontSize: '11px', fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap',
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

  return (
    <div className="tu-display-unit" style={containerStyle}>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        minHeight: '80px',
        background: 'rgba(22, 24, 40, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        ...style,
      }}>
        {/* Real Google AdSense <ins> tag */}
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '80px' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-YOUR_PUBLISHER_ID'}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Fallback Banner when AdSense is loading/not filled */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.05) 100%)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <AdPlaceholder type={type} />
        </div>
      </div>
    </div>
  )
}
