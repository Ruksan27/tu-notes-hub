'use client'
// src/components/PWARegister.tsx
import { useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [platform, setPlatform] = useState<{ isIOS: boolean; isSafari: boolean }>({ isIOS: false, isSafari: false })

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    const ua = window.navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
    setPlatform({ isIOS, isSafari })
    setIsMobile(mobile)

    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (!dismissedTime || Date.now() - Number(dismissedTime) > oneWeek) {
        // Delay to not interrupt immediately
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowPrompt(false)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    if (!standalone) {
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (!dismissedTime || Date.now() - Number(dismissedTime) > oneWeek) {
        const timer = setTimeout(() => {
          if (!deferredPrompt && (isIOS || isSafari)) {
            setShowPrompt(true)
          }
        }, 7000)
        return () => clearTimeout(timer)
      }
    }

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister())
      })
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else {
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', String(Date.now()))
  }

  if (isInstalled) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRightIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pwa-prompt-mobile {
          animation: slideUpIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pwa-prompt-desktop {
          animation: slideRightIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: isMobile ? '72px' : '24px',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          width: 'min(420px, calc(100vw - 24px))',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.4)',
          background: 'rgba(13,15,26,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '14px',
          animation: 'slideUpIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📶</span>
            <div>
              <strong style={{ display: 'block', fontSize: '13px', color: '#fca5a5' }}>You&apos;re Offline</strong>
              <span style={{ color: 'var(--clr-text-2)', fontSize: '11.5px' }}>
                Cached notes & pages still work.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Install Prompt: MOBILE (bottom sheet style) ── */}
      {showPrompt && isOnline && !showInstructions && isMobile && (
        <div
          className="pwa-prompt-mobile"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            background: 'rgba(13, 15, 26, 0.98)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px 32px',
            boxShadow: '0 -16px 60px rgba(0,0,0,0.6), 0 -4px 0 rgba(99,102,241,0.3)',
          }}
        >
          {/* Drag handle */}
          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 16px' }} />

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
            {/* App Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
            }}>
              🎓
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--clr-text-1)', fontFamily: 'var(--font-display)' }}>
                TU Notes Hub
              </div>
              <div style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '2px' }}>
                tunoteshub.com
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'var(--clr-text-3)',
                cursor: 'pointer',
                fontSize: '14px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ color: 'var(--clr-text-2)', fontSize: '13.5px', lineHeight: 1.55, marginBottom: '18px' }}>
            Add to your home screen for faster access to free notes, past papers & AI predictions — works offline too!
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {['⚡ Instant Access', '📴 Works Offline', '🤖 AI Predictor', '📚 Free Notes'].map(f => (
              <span key={f} style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#a5b4fc',
              }}>
                {f}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              }}
            >
              📲 Install App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--clr-text-3)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* ── Install Prompt: DESKTOP (bottom-right card) ── */}
      {showPrompt && isOnline && !showInstructions && !isMobile && (
        <div
          className="pwa-prompt-desktop"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 1200,
            width: '340px',
            padding: '20px',
            display: 'grid',
            gap: '14px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.3)',
            background: 'rgba(13,15,26,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                🎓
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--clr-text-1)' }}>TU Notes Hub</div>
                <div style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>Install for offline access</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '16px', padding: '0 2px' }}
            >
              ✕
            </button>
          </div>

          <p style={{ color: 'var(--clr-text-2)', fontSize: '12.5px', lineHeight: 1.55, margin: 0 }}>
            Access notes, past papers & AI predictions instantly — works offline too!
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleInstallClick}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              📲 Install
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={handleDismiss}
              style={{ flex: 1, justifyContent: 'center', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--clr-text-3)' }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* ── Fallback Install Instructions Modal ── */}
      {showInstructions && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            background: 'rgba(5,7,13,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowInstructions(false)}
        >
          <div
            style={{
              width: 'min(420px, 100%)',
              padding: '24px',
              background: 'rgba(18,21,38,0.98)',
              borderRadius: '20px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(99,102,241,0.35)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
                📲 How to Install
              </h3>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--clr-text-2)', cursor: 'pointer', fontSize: '14px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.6 }}>
              {platform.isIOS ? (
                <>
                  <p style={{ margin: 0, color: 'var(--clr-text-2)' }}>Add TU Notes Hub to your iPhone home screen in 2 steps:</p>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '22px', background: 'rgba(99,102,241,0.1)', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>📤</span>
                      <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '22px', background: 'rgba(6,182,212,0.1)', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>➕</span>
                      <span>Select <strong>&quot;Add to Home Screen&quot;</strong> from the list</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, color: 'var(--clr-text-2)' }}>Install TU Notes Hub as an app on your device:</p>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '22px', background: 'rgba(99,102,241,0.1)', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>⋮</span>
                      <span>Open browser menu (top-right corner)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '22px', background: 'rgba(6,182,212,0.1)', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>📲</span>
                      <span>Tap <strong>&quot;Install TU Notes Hub&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong></span>
                    </div>
                  </div>
                </>
              )}

              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', textAlign: 'center', margin: 0 }}>
                Opens as a native app from your home screen. Works offline!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Got It ✓
            </button>
          </div>
        </div>
      )}
    </>
  )
}
