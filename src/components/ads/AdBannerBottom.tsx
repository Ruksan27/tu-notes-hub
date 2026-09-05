'use client'
// src/components/ads/AdBannerBottom.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdBannerBottom() {
  const [visible, setVisible] = useState(false)
  const [priceText, setPriceText] = useState('Rs. 99')
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is a paid member — hide the ad for SEMESTER_PASS or ELITE_AI users
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          // Paid user — keep ad hidden
          return
        }
      }
    } catch {}
    // Free user — show the ad
    setVisible(true)

    // Fetch dynamic pricing
    fetch('/api/admin/pricing')
      .then(res => res.json())
      .then(data => {
        if (data && data.plans) {
          const semPlan = data.plans.find((p: any) => p.packageType === 'SEMESTER_PASS')
          if (semPlan && semPlan.price) {
            setPriceText(semPlan.price.trim())
          }
        }
      })
      .catch(() => {})
  }, [])

  if (pathname?.startsWith('/admin')) return null
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
        padding: '4px 0',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '4px 12px' }}>
        <span className="hide-mobile" style={{ fontSize: '9px', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0, background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
          Sponsored
        </span>
        <Link
          href="/pricing"
          style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '8px',
            padding: '6px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>TU Notes Hub Premium</strong> — Upgrade from {priceText}!
            </p>
          </div>
        </Link>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '18px', flexShrink: 0, lineHeight: 1, padding: '4px 6px' }}
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
        >×</button>
      </div>
    </div>
  )
}
