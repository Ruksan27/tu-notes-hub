// src/app/download/[noteId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function DownloadPage() {
  const params = useParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)
  const [note, setNote] = useState<{ title: string; cloudinaryUrl: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch(`/api/notes/${params.noteId}`)
      .then((r) => r.json())
      .then(setNote)
  }, [params.noteId])

  useEffect(() => {
    if (countdown <= 0) { setReady(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', flexDirection: 'column', gap: '32px', padding: '40px 16px' }}>
      {/* Inline Ad During Countdown */}
      <div style={{
        width: '100%', maxWidth: '728px',
        background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.05))',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        textAlign: 'center',
        minHeight: '90px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--clr-text-3)', marginBottom: '8px' }}>ADVERTISEMENT</p>
          <p style={{ color: 'var(--clr-text-2)' }}>
            🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>Elite AI Pass — Rs. 199/year</strong> | 
            AI Predictions + Zero Ads + Instant Downloads
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '440px', width: '100%' }}>
        <p style={{ color: 'var(--clr-text-2)', marginBottom: '8px', fontSize: '14px' }}>Preparing download for</p>
        <h2 style={{ marginBottom: '32px', fontFamily: 'var(--font-display)', fontSize: '22px' }}>
          {note?.title || 'Loading...'}
        </h2>

        <div className="countdown-circle flex-center" style={{ margin: '0 auto 32px' }}>
          {ready ? '✓' : countdown}
        </div>

        {ready ? (
          <a href={note?.cloudinaryUrl} download target="_blank" rel="noreferrer"
            className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
            ⬇️ Download Now
          </a>
        ) : (
          <p style={{ color: 'var(--clr-text-3)', fontSize: '13px' }}>
            Your download will be ready in <strong style={{ color: 'var(--clr-accent)' }}>{countdown}s</strong>
          </p>
        )}
      </div>

      {/* Bottom Ad */}
      <div style={{
        width: '100%', maxWidth: '728px',
        background: 'var(--clr-surface)',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        textAlign: 'center',
        minHeight: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '11px', color: 'var(--clr-text-3)' }}>ADVERTISEMENT</p>
      </div>
    </div>
  )
}
