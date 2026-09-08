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

    // If it's a Cloudinary image, route it through our custom image API to securely sign the URL
    if (url.includes('res.cloudinary.com') && url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      const targetNoteId = getNoteTargetId(params)
      return `/api/download/image?fileUrl=${encodeURIComponent(url)}&noteId=${targetNoteId}&filename=${fileName}`
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
    } catch { }

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

      {/* Top Leaderboard Ad (Above the fold) - 728x90/970x90 */}
      {!isPaid && (
        <div className="mobile-dl-top-ad" style={{ width: '100%', padding: '24px 24px 0', display: 'flex', justifyContent: 'center' }}>
          <AdUnit type="leaderboard" slot="download-top-banner" />
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .desktop-dl-btn {
          width: fit-content;
          padding: 10px 24px;
          border-radius: 10px;
        }
        @media (max-width: 768px) {
          .mobile-dl-top-ad { padding: 4px 8px 0 !important; }
          .mobile-dl-main-area { gap: 4px !important; }
          .mobile-dl-container { padding: 8px !important; gap: 8px !important; display: flex !important; flex-direction: column !important; }
          .mobile-dl-card-outer { padding: 8px !important; gap: 8px !important; }
          /* Stack layout for mobile to prevent squishing text */
          .mobile-dl-card-inner { flex-direction: column !important; gap: 8px !important; align-items: flex-start !important; justify-content: flex-start !important; }
          .mobile-dl-btn-wrapper { width: 100% !important; margin-top: 0 !important; }
          .mobile-dl-title { font-size: 14px !important; line-height: 1.2 !important; }
          
          /* Smaller download button for mobile */
          .mobile-dl-btn { width: 100% !important; padding: 4px 0 !important; border-radius: 6px !important; box-shadow: 0 1px 4px rgba(37,99,235,0.1) !important; display: flex !important; align-items: center !important; justify-content: center !important; background: #2563eb !important; border: 1px solid #3b82f6 !important; }
          .mobile-dl-btn span.main-text { font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.01em !important; }
          
          .mobile-dl-badge { padding: 2px 5px !important; font-size: 8px !important; margin-bottom: 4px !important; display: inline-block !important; border-radius: 3px !important; }
          
          .mobile-dl-share-section { padding-top: 8px !important; margin-top: 0px !important; }
          .mobile-dl-share-title { font-size: 9px !important; margin-bottom: 6px !important; }
          
          .mobile-dl-share-grid { 
            display: grid !important; 
            grid-template-columns: repeat(4, 1fr) !important; 
            gap: 4px !important; 
            padding-bottom: 2px !important; 
          }
          
          .mobile-dl-share-btn { 
            display: flex !important;
            flex-direction: column !important;
            padding: 4px 2px !important; 
            font-size: 7.5px !important; 
            gap: 2px !important; 
            border-radius: 6px !important; 
            text-align: center;
          }
          .mobile-dl-share-icon { font-size: 12px !important; line-height: 1 !important; }
          
          .mobile-dl-tab-btn { 
            padding: 6px 8px !important; 
            font-size: 9.5px !important; 
            flex: 1 !important; 
            border-radius: 6px !important; 
            box-shadow: none !important; /* Remove heavy shadow on mobile for flatter look */
          }
          .mobile-dl-tab-container { 
            margin-bottom: 6px !important; 
            padding: 4px !important; 
            border-radius: 12px !important; 
            background: rgba(255,255,255,0.05) !important; 
            border: 1px solid rgba(255,255,255,0.08) !important;
          }
          
          .extracted-text-container { padding: 12px 4px !important; }
        }
      `}} />

      <div className="mobile-dl-container" style={{ flex: 1, display: 'grid', gap: '24px', padding: '16px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%', gridTemplateColumns: isPaid ? '1fr' : 'minmax(0, 1fr) 340px', alignItems: 'stretch' }}>

        {/* Main Area */}
        <div className="mobile-dl-main-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="glass-card mobile-dl-card-outer" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)' }}>
            <div className="mobile-dl-card-inner" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <span className="mobile-dl-badge" style={{ display: 'inline-flex', marginBottom: '10px', fontSize: '11px', fontWeight: 800, padding: '4px 10px', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', letterSpacing: '0.05em' }}>📄 TU OFFICIAL RESOURCE</span>
                <h2 className="mobile-dl-title" style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.35 }}>{note?.title ? note.title.replace(/\s*\((Old|New)\s*Syllabus\)/gi, '') : 'Loading document...'}</h2>
              </div>

              {/* Download Button (Triggers 15s Ad Lock Modal) */}
              <div className="mobile-dl-btn-wrapper" style={{ flexShrink: 0 }}>
                {!mounted ? (
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center', color: '#fff' }}>
                    ⏳ Loading...
                  </div>
                ) : ready && fileUrl ? (
                  <button onClick={handleStartDownload} className="mobile-dl-btn desktop-dl-btn active:scale-[0.98] transition-all hover:bg-blue-500"
                    style={{ cursor: 'pointer', background: '#2563eb', color: '#fff', border: '1px solid #3b82f6', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="main-text">Download PDF</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--clr-text-3)', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                    <span>Preparing offline link... {countdown > 0 && `(${countdown}s)`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* One-Click Social Share Widgets */}
            <div className="mobile-dl-share-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <span className="mobile-dl-share-title" style={{ fontSize: '12px', color: 'var(--clr-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>Share Resource</span>

              <div className="mobile-dl-share-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {/* WhatsApp Share */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey, check out this TU exam note on TU Notes Hub: ${note?.title || ''}\n${currentUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px',
                    background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontSize: '13px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span className="mobile-dl-share-icon"></span> <span>WhatsApp</span>
                </a>

                {/* Instagram Share */}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px',
                    background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.2)', color: '#E1306C', fontSize: '13px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span className="mobile-dl-share-icon"></span> <span>Instagram</span>
                </a>

                {/* Facebook Share */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px',
                    background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.2)', color: '#1877F2', fontSize: '13px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span className="mobile-dl-share-icon"></span> <span>Facebook</span>
                </a>

                {/* Copy Link button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl)
                    alert('Link copied to clipboard! Share it with your friends.')
                  }}
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--clr-text-2)', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <span className="mobile-dl-share-icon"></span> <span>Copy Link</span>
                </button>
              </div>
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
                <div className="mobile-dl-tab-container" style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '5px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <button
                    onClick={() => setActiveTab('text')}
                    className="mobile-dl-tab-btn"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'text' ? 'var(--grad-brand)' : 'transparent',
                      color: activeTab === 'text' ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: activeTab === 'text' ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    Smart AI Text
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    className="mobile-dl-tab-btn"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'original' ? 'var(--grad-brand)' : 'transparent',
                      color: activeTab === 'original' ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: activeTab === 'original' ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    Original File
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
          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignSelf: 'flex-start',
            width: '100%',
          }}>
            <div className="glass-card" style={{ padding: '20px', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--clr-primary-h)', marginBottom: '8px' }}>💎 Upgrade to Elite</h4>
              <p style={{ fontSize: '12px', color: 'var(--clr-text-2)', lineHeight: 1.5 }}>
                Tired of ads? Get instant direct downloads, access all AI prediction models, and unlock full solutions offline.
              </p>
              <a href="/pricing" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '12px', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.4)', color: '#fff' }}>
                Unlock Premium
              </a>
            </div>

            {/* Ads stay sticky as user scrolls down */}
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <AdUnit type="large-rectangle" slot="download-sidebar-banner-1" style={{ minHeight: '280px' }} />
              <AdUnit type="large-rectangle" slot="download-sidebar-banner-2" style={{ minHeight: '280px' }} />
              <AdUnit type="large-rectangle" slot="download-sidebar-banner-3" style={{ minHeight: '280px' }} />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Billboard Ad - 970x250 */}
      {!isPaid && (
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ minHeight: '250px', width: '100%', maxWidth: '970px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AdUnit type="leaderboard" slot="download-bottom-banner" style={{ minHeight: '250px' }} />
          </div>
        </div>
      )}

      {/* 10-SECOND SPONSORED AD COUNTDOWN MODAL (FOR FREE USERS) */}
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
