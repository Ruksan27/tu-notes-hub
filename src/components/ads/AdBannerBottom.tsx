'use client'
// src/components/ads/AdBannerBottom.tsx
import { useState } from 'react'
import Link from 'next/link'

export default function AdBannerBottom() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        background: 'linear-gradient(90deg, rgba(10,10,26,0.98), rgba(12,10,28,0.98))',
        borderTop: '1px solid rgba(99,102,241,0.18)',
        backdropFilter: 'blur(20px)',
        zIndex: 100,
        padding: '8px 0',
      }}
    >
      <div className="container flex-between" style={{ gap: '16px', padding: '6px 24px' }}>
        <span style={{ fontSize: '10px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0, background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
          Sponsored
        </span>
        <Link
          href="/pricing"
          style={{ textDecoration: 'none', flex: 1 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '8px',
            padding: '9px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', margin: 0 }}>
              🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>TU Notes Hub Premium</strong> — Ad‑free + AI Exam Predictions. Upgrade from Rs. 99 only!
            </p>
          </div>
        </Link>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '20px', flexShrink: 0, lineHeight: 1, padding: '0 4px' }}
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
        >×</button>
      </div>
    </div>
  )
}
