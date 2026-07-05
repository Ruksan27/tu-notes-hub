// public/sw.js - Dummy service worker to clear caching issues
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)))
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Pass-through all requests to the network directly
  event.respondWith(fetch(event.request))
})
