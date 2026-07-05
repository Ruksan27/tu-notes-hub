// src/app/download/[noteId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AdUnit from '@/components/ads/AdUnit'

export default function DownloadPage() {
  const params = useParams()
  const [countdown, setCountdown] = useState(10)
  const [note, setNote] = useState<{ title: string; cloudinaryUrl: string } | null>(null)
  const [ready, setReady] = useState(false)

  // Download-trigger ad modal states
  const [downloadAdActive, setDownloadAdActive] = useState(false)
  const [downloadAdCountdown, setDownloadAdCountdown] = useState(15)

  useEffect(() => {
    fetch(`/api/notes/${params.noteId}`)
      .then((r) => r.json())
      .then(setNote)
  }, [params.noteId])

  // Initial page view ad countdown
  useEffect(() => {
    if (countdown <= 0) { setReady(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Download file ad countdown
  useEffect(() => {
    if (!downloadAdActive) return
    if (downloadAdCountdown <= 0) {
      setDownloadAdActive(false)
      // Trigger actual download programmatically
      if (note?.cloudinaryUrl) {
        const link = document.createElement('a')
        link.href = note.cloudinaryUrl
        link.target = '_blank'
        link.download = note.title || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      return
    }
    const t = setTimeout(() => setDownloadAdCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [downloadAdActive, downloadAdCountdown, note])

  const fileUrl = note?.cloudinaryUrl || ''
  const isImage = fileUrl.toLowerCase().endsWith('.png') ||
                  fileUrl.toLowerCase().endsWith('.jpg') ||
                  fileUrl.toLowerCase().endsWith('.jpeg') ||
                  fileUrl.toLowerCase().endsWith('.webp') ||
                  fileUrl.toLowerCase().endsWith('.gif')

  // Generate secure preview URL: Google Docs Viewer works great for PDFs and Word/PPTX files
  const previewUrl = isImage 
    ? fileUrl 
    : `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`

  const handleStartDownload = () => {
    setDownloadAdCountdown(15)
    setDownloadAdActive(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#0b0f19', position: 'relative' }}>
      
      {/* Top Banner Ad */}
      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'center' }}>
        <AdUnit type="banner" slot="download-top-banner" />
      </div>

      <div className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', padding: '24px' }}>
        
        {/* Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <span className="badge badge-semester" style={{ marginBottom: '6px' }}>📄 TU Official Resource</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)', margin: 0 }}>{note?.title || 'Loading document...'}</h2>
            </div>
            
            {/* Download Button (Triggers 15s Ad Lock Modal) */}
            <div>
              {ready && note?.cloudinaryUrl ? (
                <button onClick={handleStartDownload}
                  className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', cursor: 'pointer' }}>
                  ⬇️ Save Offline File
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--clr-text-3)' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  <span>Preparing offline download link...</span>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Display: Show Ads & Countdown Block first, then show preview */}
          {!ready ? (
            <div className="glass-card" style={{ flex: 1, minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px', textAlign: 'center', border: '1px dashed var(--clr-border)' }}>
              
              {/* Countdown Circular Block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="countdown-circle flex-center" style={{ width: '80px', height: '80px', fontSize: '28px', background: 'var(--grad-brand)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                  {countdown}
                </div>
                <p style={{ color: 'var(--clr-text-2)', fontSize: '14px', fontWeight: 600 }}>
                  Securing server connection and loading ads...
                </p>
              </div>

              {/* Large Inline Ad Unit inside download screen */}
              <div style={{
                width: '100%', maxWidth: '640px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--clr-border)',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: 'var(--shadow-glow)',
              }}>
                <p style={{ fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Sponsored Advertisement</p>
                <AdUnit type="inline" slot="countdown-middle-ad" />
                <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '16px' }}>
                  🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>Elite AI Pass — Rs. 199/year</strong> | 
                  Instant downloads without waiting + Full PDF solution views.
                </p>
              </div>

            </div>
          ) : (
            /* Document Preview (Only displayed after 10s countdown) */
            <div style={{ flex: 1, minHeight: '680px', borderRadius: '16px', border: '1px solid var(--clr-border)', overflow: 'hidden', background: '#121824', position: 'relative' }}>
              {note?.cloudinaryUrl ? (
                isImage ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={note.cloudinaryUrl} alt={note.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={note.title}
                  />
                )
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--clr-text-3)' }}>
                  <span className="spinner" />
                  <p>Configuring secure document previewer...</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Ads Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)', marginBottom: '8px' }}>💎 Upgrade to Elite</h4>
            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
              Tired of waiting? Get instant direct downloads, access all AI prediction models, and unlock full solutions offline.
            </p>
            <a href="/pricing" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '12px', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.4)', color: '#fff' }}>
              Unlock Now
            </a>
          </div>

          <AdUnit type="sidebar" slot="download-sidebar-banner-1" />
          <AdUnit type="inline" slot="download-sidebar-banner-2" />
        </div>

      </div>

      {/* Bottom Ad */}
      <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <AdUnit type="banner" slot="download-bottom-banner" />
      </div>

      {/* ── 15-Second Download Ad Lock Modal Overlay ── */}
      {downloadAdActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div className="glass-card" style={{
            maxWidth: '560px',
            width: '100%',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: 'var(--clr-text-1)' }}>
              Preparing Offline File Download
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
              Please wait while the file server finishes packing your document.
            </p>

            {/* Modal Circular Countdown */}
            <div className="countdown-circle flex-center" style={{
              width: '90px',
              height: '90px',
              fontSize: '32px',
              margin: '0 auto 28px',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              boxShadow: '0 8px 24px rgba(6,182,212,0.3)',
            }}>
              {downloadAdCountdown}
            </div>

            {/* Advertisement Block inside Overlay */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--clr-border)',
              borderRadius: '8px',
              padding: '24px',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: '9px', color: 'var(--clr-text-3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Sponsored Advertisement</p>
              <AdUnit type="inline" slot="modal-ad-banner" />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '20px' }}>
              File will download automatically in <strong style={{ color: 'var(--clr-accent)' }}>{downloadAdCountdown} seconds</strong>. Do not close this tab.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

