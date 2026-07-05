'use client'
// src/components/ads/AdBlockerGuard.tsx
import { useEffect, useState } from 'react'

export default function AdBlockerGuard() {
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const bait = document.createElement('div')
    bait.className = 'adsbox google-ads ad-placement pub_300x250'
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;'
    bait.innerHTML = '&nbsp;'
    document.body.appendChild(bait)

    setTimeout(() => {
      const isBlocked =
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        window.getComputedStyle(bait).display === 'none' ||
        window.getComputedStyle(bait).visibility === 'hidden'

      if (isBlocked) setDetected(true)
      document.body.removeChild(bait)
    }, 200)
  }, [])

  if (!detected) return null

  return (
    <div className="adblocker-overlay">
      <div className="adblocker-modal">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '12px', color: 'var(--clr-text-1)' }}>
          AdBlocker Detected
        </h2>
        <p style={{ color: 'var(--clr-text-2)', marginBottom: '24px', lineHeight: 1.7 }}>
          TU Notes Hub is <strong style={{ color: 'var(--clr-text-1)' }}>100% free</strong> for all students.
          Ads keep this platform running. Please disable your AdBlocker to continue.
        </p>
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <p style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>How to disable:</p>
          <ol style={{ color: 'var(--clr-text-2)', fontSize: '13px', paddingLeft: '16px', lineHeight: 2 }}>
            <li>Click your AdBlock extension icon</li>
            <li>Select &quot;Pause on this site&quot;</li>
            <li>Refresh the page</li>
          </ol>
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => window.location.reload()}>
          ✅ I've Disabled AdBlocker — Reload
        </button>
        <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', marginTop: '16px' }}>
          Or upgrade to <strong style={{ color: 'var(--clr-primary-h)' }}>Premium</strong> for an ad-free experience.
        </p>
      </div>
    </div>
  )
}
