'use client'
// src/components/PWARegister.tsx
import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
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
  }, [])
  return null
}
