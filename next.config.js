// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance: enable gzip compression
  compress: true,

  // Security: hide "X-Powered-By: Next.js" header
  poweredByHeader: false,


  devIndicators: false,

  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
    ],
    // Optimize image caching
    minimumCacheTTL: 86400, // 24 hours
  },

  // Experimental features
  experimental: {
    sri: {
      algorithm: 'sha256',
    },
  },

  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'strict-dynamic' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.google-analytics.com https://*.googletagservices.com${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
      "frame-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://docs.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.youtube.com https://youtube.com https://*.youtube.com https://www.tiktok.com https://*.googlesyndication.com https://*.doubleclick.net",
      "connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://api.cloudinary.com https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
      "media-src 'self' https://res.cloudinary.com https://*.cloudinary.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ]

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/terms-and-conditions',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/rules-and-regulations',
        destination: '/terms',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
