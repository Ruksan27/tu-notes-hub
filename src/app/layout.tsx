// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, Montserrat } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '@/components/Navbar'
import AdBannerBottom from '@/components/ads/AdBannerBottom'
import AdBlockerGuard from '@/components/ads/AdBlockerGuard'
import PWARegister from '@/components/PWARegister'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://tunoteshub.com'),
  title: {
    default: 'TU Notes Hub – Free Notes, Past Papers & AI Exam Predictions',
    template: '%s | TU Notes Hub',
  },
  description: 'The ultimate academic platform for Tribhuvan University (TU) students. Download free notes, past year question papers, and get AI-powered exam predictions for BCA, CSIT, BIT, BBS, BBA and all TU faculties.',
  keywords: ['TU notes', 'Tribhuvan University', 'BCA notes', 'CSIT notes', 'TU past papers', 'exam prediction Nepal', 'free notes Nepal', 'BBS notes', 'BBA notes', 'TU syllabus'],
  authors: [{ name: 'TU Notes Hub' }],
  alternates: {
    canonical: 'https://tunoteshub.com.np',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    title: 'TU Notes Hub – Free Notes & AI Exam Predictions',
    description: 'Notes, past papers, and AI predictions for TU students.',
    siteName: 'TU Notes Hub',
    images: [
      {
        url: '/og-image.png', // Main sharing banner
        width: 1200,
        height: 630,
        alt: 'TU Notes Hub Academic Platform',
      }
    ]
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'TU Notes Hub – Free Notes & AI Exam Predictions',
    description: 'The ultimate academic platform for Tribhuvan University (TU) students. Download free notes, past year question papers, and get AI-powered exam predictions.',
    images: ['/og-image.png'],
    site: '@tunoteshub',
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // Apple PWA meta
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'TU Notes Hub',
    'google-adsense-account': 'ca-pub-8555533919324648',
  },
}

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' })

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${montserrat.variable}`} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico?v=11" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=11" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=11" />
        {/* Google AdSense — must use plain <script> tag, NOT Next.js <Script>, AdSense rejects data-nscript */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8555533919324648"
          crossOrigin="anonymous"
        />
        {/* Website + Organization JSON-LD for Google */}
        <Script
          id="website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://tunoteshub.com/#website',
                  url: 'https://tunoteshub.com',
                  name: 'TU Notes Hub',
                  description: 'Free notes, past papers, and AI exam predictions for Tribhuvan University students.',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: { '@type': 'EntryPoint', urlTemplate: 'https://tunoteshub.com/faculties?q={search_term_string}' },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://tunoteshub.com/#organization',
                  name: 'TU Notes Hub',
                  alternateName: ['TuneNotesHub', 'TU Notes'],
                  url: 'https://tunoteshub.com',
                  logo: { '@type': 'ImageObject', url: 'https://tunoteshub.com/Untitled%20design.png' },
                  sameAs: [
                    'https://facebook.com/tunoteshub',
                    'https://twitter.com/tunoteshub',
                    'https://instagram.com/tunoteshub',
                    'https://github.com/tunoteshub',
                    'https://linkedin.com/company/tunoteshub'
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning data-disable-image-menu="true">
        <AdBlockerGuard />
        <PWARegister />
        <Navbar />
        <main style={{ paddingBottom: '80px' }}>
          {children}
        </main>
        <AdBannerBottom />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{
            background: 'rgba(18,21,38,0.95)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#f1f5f9',
            backdropFilter: 'blur(20px)',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </body>
    </html>
  )
}
