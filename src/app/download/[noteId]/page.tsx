// src/app/download/[noteId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AdUnit from '@/components/ads/AdUnit'
import MarkdownPaperViewer from '@/components/MarkdownPaperViewer'
import ExamPaperViewer, { ExamPaperData } from '@/components/ExamPaperViewer'
import { parseLegacyMarkdownToExamData } from '@/lib/legacyParser'
import DocLoadingProgress from '@/components/DocLoadingProgress'

function extractDriveFileId(link: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = link.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function getDrivePreviewUrl(link: string): string {
  const fileId = extractDriveFileId(link)
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : link
}

function getDriveDownloadUrl(link: string): string {
  const fileId = extractDriveFileId(link)
  return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : link
}

function getDriveProxyUrl(link: string): string {
  return `/api/drive-proxy?url=${encodeURIComponent(link)}`
}

import { extractIdFromSlug } from '@/lib/utils'

function getNoteTargetId(p: any): string {
  if (p?.noteParams && Array.isArray(p.noteParams) && p.noteParams.length > 0) {
    const subjectPart = p.noteParams[0] || ''
    const itemPart = p.noteParams[p.noteParams.length - 1] || ''
    return extractIdFromSlug(`${subjectPart}-${itemPart}`)
  }
  const raw = ((p?.noteSlug || p?.noteId) as string) || ''
  return extractIdFromSlug(raw)
}

export default function DownloadPage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [note, setNote] = useState<{ title: string; cloudinaryUrl: string; extractedText?: string | null } | null>(null)
  const [ready, setReady] = useState(false)
  const [driveContentType, setDriveContentType] = useState('')

  const getFinalDownloadUrl = (url: string, proxyUrl: string, title: string) => {
    if (!url) return ''
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url
    }

    // Create a clean filename: "TUNotes_2021_BOARD_EXAM_Computer_Graphics"
    const safeTitle = (title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
    const fileName = `TUNotes_${safeTitle}`

    // If it's a Cloudinary image, inject watermark and force download with specific filename
    if (url.includes('res.cloudinary.com') && url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      const parts = url.split('/upload/')
      if (parts.length === 2) {
        // Layer 1: Diagonal faint watermark in the center (Copy Protection)
        const diagonalWatermark = `l_text:Arial_100_bold:TU%20Notes%20Hub/co_black,o_12,a_-45/fl_layer_apply,g_center`
        // Layer 2: Small website link at the bottom right (Subtle Branding)
        const footerLink = `l_text:Arial_22:tunoteshub.com/co_black,o_50/fl_layer_apply,g_south_east,x_15,y_15`
        
        // Pass filename to fl_attachment so the browser saves it with this name
        return `${parts[0]}/upload/fl_attachment:${fileName}/${diagonalWatermark}/${footerLink}/${parts[1]}`
      }
    }
    
    const targetNoteId = getNoteTargetId(params)
    // If it's a PDF, route it through our custom watermarking API
    if (url.toLowerCase().endsWith('.pdf') && !url.includes('drive.google.com')) {
      return `/api/download/watermark?fileUrl=${encodeURIComponent(url)}&noteId=${targetNoteId}&filename=${fileName}`
    }

    return proxyUrl
  }

  // Download-trigger ad modal states
  const [downloadAdActive, setDownloadAdActive] = useState(false)
  const [downloadAdCountdown, setDownloadAdCountdown] = useState(10)
  const [currentUrl, setCurrentUrl] = useState('')

  // AI Answer Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [isDocLoading, setIsDocLoading] = useState(true)

  const targetNoteId = getNoteTargetId(params)

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  useEffect(() => {
    // Check if user is a paid subscriber
    let paid = false
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          paid = true
        }
      }
    } catch {}

    if (paid) {
      setIsPaid(true)
      setReady(true)
      setCountdown(0)
    }
    setMounted(true)

    if (targetNoteId) {
      fetch(`/api/notes/${targetNoteId}`)
        .then((r) => r.json())
        .then(setNote)
    }
  }, [targetNoteId])

  useEffect(() => {
    const fileUrl = note?.cloudinaryUrl || ''
    if (!fileUrl.includes('drive.google.com')) {
      setDriveContentType('')
      return
    }

    fetch(`/api/drive-proxy?mode=meta&url=${encodeURIComponent(fileUrl)}`)
      .then((r) => r.json())
      .then((data) => setDriveContentType((data?.contentType || '').toLowerCase()))
      .catch(() => setDriveContentType(''))
  }, [note?.cloudinaryUrl])

  let fileUrl = note?.cloudinaryUrl || ''
  if (fileUrl.startsWith('http://')) {
    fileUrl = fileUrl.replace('http://', 'https://')
  }

  const isDriveLink = fileUrl.includes('drive.google.com')
  const drivePreviewUrl = isDriveLink ? getDrivePreviewUrl(fileUrl) : ''
  const driveDownloadUrl = isDriveLink ? getDriveDownloadUrl(fileUrl) : ''
  const driveProxyUrl = isDriveLink ? getDriveProxyUrl(fileUrl) : ''

  // Route through our server-side proxy to avoid Cloudinary CORS/X-Frame-Options blocks on Vercel
  const proxiedUrl = (fileUrl && !isDriveLink) ? `/api/file-proxy?url=${encodeURIComponent(fileUrl)}` : fileUrl

  // Initial page view ad countdown
  useEffect(() => {
    if (!mounted) return
    if (countdown <= 0) { setReady(true); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, mounted])

  // Download file ad countdown
  useEffect(() => {
    if (!downloadAdActive) return
    if (downloadAdCountdown <= 0) {
      setDownloadAdActive(false)
      // Trigger actual download programmatically
      if (note?.cloudinaryUrl) {
        const downloadHref = getFinalDownloadUrl(note.cloudinaryUrl, proxiedUrl, note.title)
        const safeTitle = (note.title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
        
        const link = document.createElement('a')
        link.href = downloadHref
        link.target = '_blank'
        link.download = `TUNotes_${safeTitle}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      return
    }
    const t = setTimeout(() => setDownloadAdCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [downloadAdActive, downloadAdCountdown, note, proxiedUrl])

  // Active view tab state: 'text' or 'original'
  const [activeTab, setActiveTab] = useState<'text' | 'original'>('text')

  // Auto-switch to original tab if no extractedText is available
  useEffect(() => {
    if (note && !note.extractedText) {
      setActiveTab('original')
    }
  }, [note])

  const isImage = !isDriveLink && (
                  fileUrl.toLowerCase().includes('.png') ||
                  fileUrl.toLowerCase().includes('.jpg') ||
                  fileUrl.toLowerCase().includes('.jpeg') ||
                  fileUrl.toLowerCase().includes('.webp') ||
                  fileUrl.toLowerCase().includes('.gif'))

  const isPdf = !isDriveLink && fileUrl.toLowerCase().includes('.pdf')
  const isDriveImage = isDriveLink && (
    driveContentType.startsWith('image/') ||
    fileUrl.toLowerCase().includes('.png') ||
    fileUrl.toLowerCase().includes('.jpg') ||
    fileUrl.toLowerCase().includes('.jpeg') ||
    fileUrl.toLowerCase().includes('.webp') ||
    fileUrl.toLowerCase().includes('.gif')
  )

  const isDrivePdf = driveContentType.includes('pdf') || fileUrl.toLowerCase().includes('.pdf')
  const isDriveOfficeDoc = isDriveLink && (
    driveContentType.includes('msword') ||
    driveContentType.includes('officedocument.wordprocessingml') ||
    driveContentType.includes('presentationml') ||
    fileUrl.toLowerCase().includes('.doc') ||
    fileUrl.toLowerCase().includes('.docx') ||
    fileUrl.toLowerCase().includes('.ppt') ||
    fileUrl.toLowerCase().includes('.pptx')
  )

  // Drive files render from our own proxy. Images and PDFs can be shown directly,
  // while Office docs/presentations use the Docs viewer with the proxied file URL.
  const driveId = extractDriveFileId(fileUrl)
  const previewUrl = isDriveLink
    ? (driveId
      ? `https://docs.google.com/gview?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${driveId}`)}&embedded=true`
      : `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`)
    : (isImage || isPdf)
      ? proxiedUrl
      : `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`

  const fallbackPreviewUrl = isDriveOfficeDoc
    ? `https://docs.google.com/gview?url=${encodeURIComponent(driveProxyUrl)}&embedded=true`
    : ''

  const handleStartDownload = () => {
    if (isPaid) {
      if (fileUrl) {
        const downloadHref = getFinalDownloadUrl(fileUrl, proxiedUrl, note?.title || '')
        const safeTitle = (note?.title || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_')
        
        const link = document.createElement('a')
        link.href = downloadHref
        link.target = '_blank'
        link.download = `TUNotes_${safeTitle}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      return
    }

    // Free user Ad-Blocker check
    const bait = document.createElement('div');
    bait.className = 'adsbox ad-placement doubleclick ad-placeholder';
    bait.style.position = 'absolute';
    bait.style.top = '-999px';
    bait.style.height = '10px';
    document.body.appendChild(bait);
    
    const isBlocked = window.getComputedStyle(bait).display === 'none' || bait.offsetHeight === 0;
    document.body.removeChild(bait);

    if (isBlocked) {
      alert('⚠️ Ad Blocker Detected!\n\nPlease disable your Ad Blocker to download free files. We rely on ads to keep this service free for students.');
      return;
    }

    setDownloadAdCountdown(10)
    setDownloadAdActive(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#0b0f19', position: 'relative' }}>
      
      {/* Top Banner Ad */}
      {!isPaid && (
        <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'center' }}>
          <AdUnit type="leaderboard" slot="download-top-banner" />
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gap: '24px', padding: '16px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%', gridTemplateColumns: isPaid ? '1fr' : 'minmax(0, 1fr) 340px', alignItems: 'stretch' }}>
        
        {/* Main Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-semester" style={{ marginBottom: '6px' }}>📄 TU Official Resource</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-1)', margin: 0 }}>{note?.title || 'Loading document...'}</h2>
              </div>
              
              {/* Download Button (Triggers 15s Ad Lock Modal) */}
              <div>
                  {!mounted ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: '#fff' }}>
                      ⏳ Loading...
                    </div>
                  ) : ready && fileUrl ? (
                  <button onClick={handleStartDownload}
                    className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', cursor: 'pointer' }}>
                    ⬇️ Download Files
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--clr-text-3)' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                    <span>Preparing offline download link... {countdown > 0 && `(${countdown}s)`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* One-Click Social Share Widgets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 600 }}>Share Resource:</span>
              
              {/* WhatsApp Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey, check out this TU exam note on TU Notes Hub: ${note?.title || ''}\n${currentUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(37,211,102,0.12)', color: '#25D366', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                }}
              >
                💬 WhatsApp
              </a>

              {/* Viber Share */}
              <a
                href={`viber://forward?text=${encodeURIComponent(`Download TU Notes: ${note?.title || ''} on ${currentUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(115,114,242,0.12)', color: '#7372F2', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                }}
              >
                📱 Viber
              </a>

              {/* Facebook Share */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(24,119,242,0.12)', color: '#1877F2', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                }}
              >
                🔵 Facebook
              </a>

              {/* Copy Link button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl)
                  alert('Link copied to clipboard! Share it with your friends.')
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)', color: 'var(--clr-text-2)', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer'
                }}
              >
                🔗 Copy Link
              </button>
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
                <AdUnit type="large-rectangle" slot="countdown-middle-ad" />
                <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '16px' }}>
                  🎯 <strong style={{ color: 'var(--clr-primary-h)' }}>Elite AI Pass — Rs. 199/year</strong> | 
                  Instant downloads without waiting + Full PDF solution views.
                </p>
              </div>

            </div>
          ) : (
            <>
              {/* Tab Controls (Only shown if extractedText exists) */}
              {note?.extractedText && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => setActiveTab('text')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'text' ? 'var(--grad-brand)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      boxShadow: activeTab === 'text' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    📄 Interactive Text (Smart AI)
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'original' ? 'var(--grad-brand)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      boxShadow: activeTab === 'original' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    🖼️ Original File
                  </button>
                </div>
              )}

              {/* Document Preview (Only displayed after countdown) */}
              <div style={{ flex: 1, minHeight: '850px', height: '100%', borderRadius: '16px', border: '1px solid var(--clr-border)', overflow: 'hidden', background: '#121824', position: 'relative' }}>
                {isDocLoading && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#090d16' }}>
                    <DocLoadingProgress onComplete={() => setIsDocLoading(false)} />
                  </div>
                )}
                {fileUrl ? (
                  activeTab === 'text' && note?.extractedText ? (
                    <div
                      className="extracted-text-container"
                      style={{
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        padding: '24px 16px',
                        background: '#dde1e7',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {(() => {
                        try {
                          let cleanText = note.extractedText.trim();
                          
                          // Remove markdown formatting if the AI returned it inside a code block
                          if (cleanText.startsWith('```')) {
                            cleanText = cleanText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
                          }

                          let parsed: any;
                          try {
                            parsed = JSON.parse(cleanText);
                          } catch (parseErr) {
                            // Replace literal newlines with spaces
                            let fixedText = cleanText.replace(/\n/g, ' ').replace(/\r/g, '').replace(/\t/g, ' ');
                            
                            // Fix Bad escaped character errors (e.g., AI generating LaTeX like \alpha or \c)
                            // We escape any backslash that isn't followed by a valid JSON escape character (" \ / b f n r t u)
                            fixedText = fixedText.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
                            
                            parsed = JSON.parse(fixedText);
                          }

                          // Handle double-stringified JSON
                          if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                          }

                          if (parsed && typeof parsed === 'object' && parsed.groups) {
                            return <ExamPaperViewer data={parsed as ExamPaperData} />
                          }
                        } catch (e) {
                          // Silently fallback to legacy markdown parser instead of console.error
                          // Next.js dev overlay pops up on console.error during render
                          const legacyParsed = parseLegacyMarkdownToExamData(note.extractedText);
                          if (legacyParsed && legacyParsed.groups && legacyParsed.groups.length > 0) {
                            return <ExamPaperViewer data={legacyParsed} />
                          }
                          // If even legacy parser fails, show plain text
                        }
                        return <MarkdownPaperViewer content={note.extractedText} />
                      })()}
                    </div>
                  ) : isImage ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proxiedUrl} alt={note?.title || 'Document'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                  ) : isDriveImage ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt={note?.title || 'Document'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                  ) : (
                    <iframe
                      src={previewUrl}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title={note?.title || 'Document'}
                      referrerPolicy="no-referrer"
                      allow="fullscreen"
                      onError={(event) => {
                        const target = event.currentTarget
                        if (fallbackPreviewUrl && target.src !== fallbackPreviewUrl) {
                          target.src = fallbackPreviewUrl
                        }
                      }}
                    />
                  )
                ) : (
                  <DocLoadingProgress />
                )}
              </div>
            </>
          )}

        </div>

        {/* Sidebar Ads Column */}
        {!isPaid && (
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
            <AdUnit type="sidebar" slot="download-sidebar-banner-2" />
          </div>
        )}

      </div>

      {/* Bottom Ad */}
      {!isPaid && (
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
          <AdUnit type="leaderboard" slot="download-bottom-banner" />
        </div>
      )}

      {/* ── 15-S      {/* 10-SECOND SPONSORED AD COUNTDOWN MODAL (FOR FREE USERS) */}
      {downloadAdActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px',
            padding: '36px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
          }}>
            <button
              onClick={() => setDownloadAdActive(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--clr-text-3)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>

            <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🔒 FREE DOWNLOAD AD GATEWAY
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>
              Preparing Study File...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--clr-text-3)', marginBottom: '24px' }}>
              Please wait while our server packs your file and verifies sponsor links.
            </p>

            {/* Modal Circular Countdown */}
            <div className="countdown-circle flex-center" style={{
              width: '90px',
              height: '90px',
              fontSize: '32px',
              fontWeight: 800,
              margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              boxShadow: '0 8px 24px rgba(6,182,212,0.4)',
              borderRadius: '50%',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {downloadAdCountdown}s
            </div>

            {/* Sponsored Advertisement Unit */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Sponsored Advertisement</p>
              <AdUnit type="medium-rectangle" slot="modal-ad-banner" />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', marginTop: '20px' }}>
              Your file will download automatically in <strong style={{ color: 'var(--clr-accent)' }}>{downloadAdCountdown} second{downloadAdCountdown !== 1 ? 's' : ''}</strong>. Do not close this tab.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

