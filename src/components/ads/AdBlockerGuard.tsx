'use client'
// src/components/ads/AdBlockerGuard.tsx
import { useEffect, useState } from 'react'

export default function AdBlockerGuard() {
  const [detected, setDetected] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Paid users get ad-free experience — skip ad blocker detection
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        // Skip for paid users AND admins
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI' || user?.role === 'ADMIN') return
      }
    } catch {}

    // Skip in development
    if (process.env.NODE_ENV === 'development') return

    // Skip if user already dismissed this session
    if (sessionStorage.getItem('adblock_dismissed')) return

    // Use two independent checks — only flag if BOTH confirm an ad blocker
    // This prevents false positives from Edge Tracking Prevention (which blocks
    // the AdSense script but does NOT collapse DOM elements)
    const bait = document.createElement('div')
    bait.className = 'adsbox google-ads ad-placement pub_300x250 doubleclick'
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none;'
    bait.innerHTML = '&nbsp;'
    document.body.appendChild(bait)

    // Wait 500ms to let ad blockers apply their filters
    setTimeout(() => {
      try {
        const style = window.getComputedStyle(bait)
        const isHidden =
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'

        // Second check: attempt to load a known ad-network image pixel
        // If it loads → no ad blocker. If blocked → ad blocker confirmed.
        if (isHidden) {
          const img = new Image()
          img.onload = () => {
            // Image loaded = NOT a real ad blocker (just Edge Tracking Prevention hiding DOM)
            // Don't show the overlay
          }
          img.onerror = () => {
            // Both DOM hidden AND network blocked = real ad blocker
            setDetected(true)
          }
          // Use a tiny transparent tracking pixel from Google's ad network
          img.src = 'https://pagead2.googlesyndication.com/pagead/1x1.gif?' + Date.now()
        }
      } catch {}
      finally {
        try { document.body.removeChild(bait) } catch {}
      }
    }, 500)
  }, [])

  const handleDismiss = () => {
    try { sessionStorage.setItem('adblock_dismissed', '1') } catch {}
    setDismissed(true)
  }

  if (!detected || dismissed) return null

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
          ✅ I&apos;ve Disabled AdBlocker — Reload
        </button>
        <button
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--clr-text-3)', fontSize: '12px', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Continue anyway (limited experience)
        </button>
        <p style={{ color: 'var(--clr-text-3)', fontSize: '12px', marginTop: '12px' }}>
          Or upgrade to <strong style={{ color: 'var(--clr-primary-h)' }}>Premium</strong> for an ad-free experience.
        </p>
      </div>
    </div>
  )
}
