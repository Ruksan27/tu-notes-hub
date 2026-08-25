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
  const [installState, setInstallState] = useState<'idle' | 'ready' | 'installed' | 'dismissed'>('idle')

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const installEvent = event as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setInstallState('ready')
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setInstallState('installed')
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

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
  }, [])

  const showInstallPrompt = !isInstalled && isOnline && (installState === 'ready' || installState === 'dismissed')
  const helperText = useMemo(() => {
    if (!isOnline) return 'You are offline. Cached pages will still work.'
    if (installState === 'ready') return 'Install TU Notes Hub for faster access and offline study.'
    return 'Tip: use your browser menu to add this site to your home screen.'
  }, [installState, isOnline])

  async function handleInstall() {
    if (!deferredPrompt) {
      setInstallState('dismissed')
      return
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setInstallState(choice.outcome === 'accepted' ? 'installed' : 'dismissed')
  }

  if (isInstalled) return null

  return (
    <>
      {!isOnline && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            left: '16px',
            right: '16px',
            bottom: '76px',
            zIndex: 1200,
            padding: '14px 16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Offline ready</strong>
            <span style={{ color: 'var(--clr-text-2)', fontSize: '13px' }}>{helperText}</span>
          </div>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {showInstallPrompt && (
        <div
          className="glass-card"
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '76px',
            zIndex: 1200,
            width: 'min(360px, calc(100vw - 32px))',
            padding: '16px',
            display: 'grid',
            gap: '14px',
          }}
        >
          <div>
            <div className="badge badge-elite" style={{ marginBottom: '10px' }}>
              Install app
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Put TU Notes Hub on your home screen</h3>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '13px', lineHeight: 1.6 }}>{helperText}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" type="button" onClick={handleInstall}>
              Install Now
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => setInstallState('dismissed')}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
