// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance: enable gzip compression
  compress: true,

  // Security: hide "X-Powered-By: Next.js" header
  poweredByHeader: false,


  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
    ],
    // Optimize image caching
    minimumCacheTTL: 86400, // 24 hours
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://pagead2.googlesyndication.com",
              "frame-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://docs.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
              "connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://api.cloudinary.com https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com https://pagead2.googlesyndication.com",
              "media-src 'self' https://res.cloudinary.com https://*.cloudinary.com",
            ].join('; ')
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
