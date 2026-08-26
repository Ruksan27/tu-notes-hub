'use client'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <section className="section" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div className="container" style={{ maxWidth: '720px', textAlign: 'center' }}>
        <div className="badge badge-moderate" style={{ marginBottom: '20px' }}>
          Offline mode
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', marginBottom: '16px' }}>
          You are currently <span className="text-gradient">offline</span>
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '18px', lineHeight: 1.8, marginBottom: '32px' }}>
          The app will keep showing cached pages and assets when possible. Reconnect to refresh the latest notes, papers, and dashboard data.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary btn-lg">
            Return Home
          </Link>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </section>
  )
}