// public/sw.js - Offline-first service worker with navigation fallback
const CACHE_NAME = 'tu-notes-hub-v4'
const PRECACHE_URLS = ['/', '/offline', '/manifest.json', '/favicon.ico', '/icon-192.svg', '/icon-512.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    
    // Only return the offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlineFallback = await cache.match('/offline')
      if (offlineFallback) return offlineFallback
    }
    
    return new Response('Offline: Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    })
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && (response.ok || response.status === 0)) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    // If it fails to fetch and it's an image, we can try to return a placeholder SVG if cached
    if (request.destination === 'image') {
      const fallbackIcon = await cache.match('/icon-192.svg')
      if (fallbackIcon) return fallbackIcon
    }
    
    return new Response('Offline: Asset not found', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Cache Google Fonts
  const isGoogleFont = url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')
  const isSameOrigin = url.origin === self.location.origin
  
  if (!isSameOrigin && !isGoogleFont) return
  if (isSameOrigin && url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

