'use client'
// src/components/ads/AdBlockerGuard.tsx
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Only trigger AdBlocker warning when free users browse or view notes & study materials
const NOTE_ROUTES = [
  '/faculties',
  '/faculty',
  '/note',
  '/notes',
  '/paper',
  '/projects',
  '/mcq',
  '/download',
  '/blogs',
  '/blog',
]

export default function AdBlockerGuard() {
  const [detected, setDetected] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // 1. Only run detection when user is browsing/viewing notes or study materials
    const isNotesBrowsingPage = NOTE_ROUTES.some((route) => pathname?.startsWith(route))
    if (!isNotesBrowsingPage) {
      setDetected(false)
      return
    }

    // 2. Paid users (SEMESTER_PASS, ELITE_AI) & Admins get an ad-free experience — skip check
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI' || user?.role === 'ADMIN') {
          setDetected(false)
          return
        }
      }
    } catch {}

    // Skip in development mode unless explicitly needed
    if (process.env.NODE_ENV === 'development') return

    // 3. Skip if user already dismissed the warning during this session
    if (sessionStorage.getItem('adblock_dismissed')) return

    // 4. Double-check detection logic — prevent false positives from tracking protection
    const bait = document.createElement('div')
    bait.className = 'adsbox google-ads ad-placement pub_300x250 doubleclick'
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none;'
    bait.innerHTML = '&nbsp;'
    document.body.appendChild(bait)

    const timer = setTimeout(() => {
      try {
        const style = window.getComputedStyle(bait)
        const isHidden =
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'

        if (isHidden) {
          const img = new Image()
          img.onload = () => {
            // Image loaded = not a real ad blocker
          }
          img.onerror = () => {
            // DOM hidden + network request blocked = confirmed ad blocker
            setDetected(true)
          }
          img.src = 'https://pagead2.googlesyndication.com/pagead/1x1.gif?' + Date.now()
        }
      } catch {}
      finally {
        try { document.body.removeChild(bait) } catch {}
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname])

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
          Ads keep this platform running. Please disable your AdBlocker to continue reading notes.
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
