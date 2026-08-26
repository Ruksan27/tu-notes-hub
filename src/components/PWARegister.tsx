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
  const [platform, setPlatform] = useState<{ isIOS: boolean; isSafari: boolean }>({ isIOS: false, isSafari: false })

  useEffect(() => {
    // Detect if already installed / standalone
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    // Detect platform
    const ua = window.navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    setPlatform({ isIOS, isSafari })

    // Check offline/online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()

    // Listen for install events
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      
      // Only show if not dismissed recently
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (!dismissedTime || Date.now() - Number(dismissedTime) > oneWeek) {
        setShowPrompt(true)
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

    // Show fallback install guidance for iOS/Safari after a short delay
    if (!standalone) {
      const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (!dismissedTime || Date.now() - Number(dismissedTime) > oneWeek) {
        // Delay showing to not interrupt user immediately
        const timer = setTimeout(() => {
          // If deferredPrompt hasn't fired (e.g. on iOS or older Safari)
          if (!deferredPrompt && (isIOS || isSafari)) {
            setShowPrompt(true)
          }
        }, 6000)
        return () => clearTimeout(timer)
      }
    }

    // Only register service worker in production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // In development, unregister any existing service workers to prevent reload loops
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
      // Toggle instructions overlay for iOS or other custom platforms
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
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '24px',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            width: 'min(480px, calc(100vw - 32px))',
            padding: '14px 20px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(13,15,26,0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📶</span>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: '#fca5a5' }}>Offline Mode</strong>
              <span style={{ color: 'var(--clr-text-2)', fontSize: '12px' }}>
                Cached pages and papers will still work.
              </span>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Install Prompt Banner ── */}
      {showPrompt && isOnline && !showInstructions && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 1200,
            width: 'min(380px, calc(100vw - 48px))',
            padding: '20px',
            display: 'grid',
            gap: '16px',
            boxShadow: 'var(--shadow-glow), 0 20px 40px rgba(0,0,0,0.6)',
            background: 'rgba(13,15,26,0.95)',
            border: '1px solid var(--clr-border-h)',
            animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div className="badge badge-elite" style={{ background: 'var(--grad-brand)', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                INSTALL APP
              </div>
              <button 
                type="button" 
                onClick={handleDismiss} 
                style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '16px', padding: '0 4px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-text-1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text-3)'}
              >
                ✕
              </button>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--clr-text-1)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
              Add TU Notes Hub to your screen
            </h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '12.5px', lineHeight: 1.5 }}>
              Access study notes, past papers, and AI predictions instantly. Works offline!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm" 
              type="button" 
              onClick={handleInstallClick}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Install
            </button>
            <button 
              className="btn btn-outline btn-sm" 
              type="button" 
              onClick={handleDismiss}
              style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--clr-border)', color: 'var(--clr-text-2)' }}
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
            background: 'rgba(5, 7, 13, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="glass-card"
            style={{
              width: 'min(440px, 100%)',
              padding: '24px',
              background: 'var(--clr-bg-800)',
              boxShadow: 'var(--shadow-glow), 0 24px 48px rgba(0,0,0,0.8)',
              border: '1px solid var(--clr-border-h)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                How to Install
              </h3>
              <button 
                type="button" 
                onClick={() => setShowInstructions(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-3)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '16px', color: 'var(--clr-text-2)', fontSize: '14px', lineHeight: 1.6 }}>
              {platform.isIOS ? (
                <>
                  <p>Safari browser requires a manual addition to the home screen on iOS devices:</p>
                  <div style={{ background: 'var(--clr-bg-700)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px', background: 'rgba(99,102,241,0.1)', padding: '6px', borderRadius: '6px' }}>📤</span>
                      <span>1. Tap the <strong>Share</strong> button in the Safari bottom toolbar.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px', background: 'rgba(6,182,212,0.1)', padding: '6px', borderRadius: '6px' }}>➕</span>
                      <span>2. Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>Follow these steps to add the app to your home screen or desktop:</p>
                  <div style={{ background: 'var(--clr-bg-700)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px' }}>⋮</span>
                      <span>1. Open your browser settings menu (top-right corner).</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px' }}>🖥️</span>
                      <span>2. Click <strong>&quot;Install TU Notes Hub&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                    </div>
                  </div>
                </>
              )}
              
              <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', textAlign: 'center', marginTop: '8px' }}>
                Once added, you can open it as a standalone app directly from your home screen.
              </p>
            </div>

            <button
              className="btn btn-primary btn-md"
              type="button"
              onClick={() => setShowInstructions(false)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </>
  )
}

