// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Removed X-Frame-Options: DENY — it was blocking PDF iframes from Cloudinary
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from Cloudinary (both res.cloudinary.com and any subdomain)
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://pagead2.googlesyndication.com",
              // Allow iframes for PDF preview (Cloudinary) and Google Docs viewer
              "frame-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://docs.google.com https://pagead2.googlesyndication.com",
              // Allow fetching from Cloudinary API (for QR image load) and Google APIs
              "connect-src 'self' https://res.cloudinary.com https://*.cloudinary.com https://api.cloudinary.com https://generativelanguage.googleapis.com https://fonts.googleapis.com https://fonts.gstatic.com",
              "media-src 'self' https://res.cloudinary.com https://*.cloudinary.com",
            ].join('; ')
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

