'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--clr-bg-900)', overflow: 'hidden', position: 'relative' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.05) 50%, transparent 75%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Animated icon */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
          }}>
            📡
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 14px', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', fontSize: '11px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
          No Internet Connection
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 6vw, 42px)', fontWeight: 900, lineHeight: 1.2, marginBottom: '14px', fontFamily: 'var(--font-display)' }}>
          You&apos;re{' '}
          <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Offline
          </span>
        </h1>

        <p style={{ color: 'var(--clr-text-2)', fontSize: 'clamp(13.5px, 3vw, 16px)', lineHeight: 1.7, marginBottom: '32px' }}>
          No worries — previously viewed notes, papers, and pages are still available from your cache. Reconnect to sync the latest content.
        </p>

        {/* What's cached section */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px', marginBottom: '28px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            ✅ Still Available Offline
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              { icon: '📄', label: 'Previously viewed notes & past papers' },
              { icon: '🏠', label: 'Homepage & faculty pages (cached)' },
              { icon: '🤖', label: 'AI predictions you already loaded' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13.5px', color: 'var(--clr-text-2)' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
              transition: 'opacity 0.2s, transform 0.15s',
              opacity: isRetrying ? 0.7 : 1,
              minWidth: '160px',
            }}
          >
            {isRetrying ? '⏳ Retrying...' : '🔄 Retry Connection'}
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--clr-text-1)',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            🏠 Go Home
          </Link>
        </div>
      </div>
    </section>
  )
}