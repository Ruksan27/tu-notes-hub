// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '@/components/Navbar'
import AdBannerBottom from '@/components/ads/AdBannerBottom'
import AdBlockerGuard from '@/components/ads/AdBlockerGuard'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: {
    default: 'TU Notes Hub – Free Notes, Past Papers & AI Exam Predictions',
    template: '%s | TU Notes Hub',
  },
  description: 'The ultimate academic platform for Tribhuvan University (TU) students. Download free notes, past year question papers, and get AI-powered exam predictions for BCA, CSIT, BIT, BBS, BBA and all TU faculties.',
  keywords: ['TU notes', 'Tribhuvan University', 'BCA notes', 'CSIT notes', 'TU past papers', 'exam prediction Nepal', 'free notes Nepal'],
  authors: [{ name: 'TU Notes Hub' }],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    title: 'TU Notes Hub – Free Notes & AI Exam Predictions',
    description: 'Notes, past papers, and AI predictions for TU students.',
    siteName: 'TU Notes Hub',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
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
