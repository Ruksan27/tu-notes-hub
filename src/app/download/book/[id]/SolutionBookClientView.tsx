'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdUnit from '@/components/ads/AdUnit'
import DocLoadingProgress from '@/components/DocLoadingProgress'

interface BookData {
  id: string
  title: string
  description?: string | null
  cloudinaryUrl: string
  author?: string | null
  isPremium: boolean
  semester: {
    order: number
    facultyId: string
    faculty: {
      name: string
    }
  }
}

function extractDriveFileId(link: string): string | null {
  if (!link) return null
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

function getDriveDownloadUrl(link: string): string {
  if (!link) return ''
  const fileId = extractDriveFileId(link)
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }
  return link
}

export default function SolutionBookClientView({ book }: { book: BookData }) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState(`https://tunoteshub.com/download/book/${book.id}`)
  const [driveContentType, setDriveContentType] = useState('')
  const [isDocLoading, setIsDocLoading] = useState(true)

  // Ad Lock Modal states for FREE users
  const [isPaid, setIsPaid] = useState(false)
  const [downloadAdActive, setDownloadAdActive] = useState(false)
  const [downloadAdCountdown, setDownloadAdCountdown] = useState(10)

  // Default view mode to 'proxy' for 100% reliable document rendering without iframe blocks
  const [viewMode, setViewMode] = useState<'gview' | 'drive' | 'proxy'>('proxy')

  // Clean title — strip "(Old Syllabus)" / "(New Syllabus)" from display
  const cleanTitle = (book.title || '')
    .replace(/\s*\(\s*(old syllabus|new syllabus|old|new)\s*\)/gi, '')
    .trim()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
    try {
      const stored = localStorage.getItem('tu_user')
      if (stored) {
        const user = JSON.parse(stored)
        const pkg = user?.packageType ?? 'FREE'
        if (pkg === 'SEMESTER_PASS' || pkg === 'ELITE_AI') {
          setIsPaid(true)
        }
      }
    } catch {}
  }, [])

  const rawUrl = book.cloudinaryUrl || ''
  const isDrive = rawUrl.includes('drive.google.com')
  const driveId = extractDriveFileId(rawUrl)

  // Fetch Drive file metadata (content-type)
  useEffect(() => {
    if (!isDrive) {
      setDriveContentType('')
      return
    }
    fetch(`/api/drive-proxy?mode=meta&url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((data) => setDriveContentType((data?.contentType || '').toLowerCase()))
      .catch(() => setDriveContentType(''))
  }, [rawUrl, isDrive])
  
  const isImage = !isDrive && /\.(png|jpg|jpeg|webp|gif)$/i.test(rawUrl)
  const isDriveImage = isDrive && (
    driveContentType.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(rawUrl)
  )

  // Construct URLs
  const driveEmbedUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rawUrl
  const gviewEmbedUrl = driveId
    ? `https://drive.google.com/file/d/${driveId}/preview`
    : `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`
  // For Cloudinary PDFs, use the URL directly — the browser will embed it properly in an iframe
  // We do NOT use /api/drive-proxy for Cloudinary as that can cause downloads
  const proxyEmbedUrl = isDrive ? `/api/drive-proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl
  let downloadUrl = rawUrl
  const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9 _-]/g, '_')
  const fileName = `TUNotes_${safeTitle}`

  if (rawUrl.includes('res.cloudinary.com') && rawUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
    const parts = rawUrl.split('/upload/')
    if (parts.length === 2) {
      // Cloudinary Image Watermark
      const diagonalWatermark = `l_text:Arial_100_bold:TU%20Notes%20Hub/co_black,o_12,a_-45/fl_layer_apply,g_center`
      const footerLink = `l_text:Arial_22:tunoteshub.com/co_black,o_50/fl_layer_apply,g_south_east,x_15,y_15`
      downloadUrl = `${parts[0]}/upload/fl_attachment:${fileName}/${diagonalWatermark}/${footerLink}/${parts[1]}`
    }
  } else if (rawUrl.toLowerCase().endsWith('.pdf') || isDrive) {
    // Route through universal watermark API for PDFs and Drive files
    downloadUrl = `/api/download/watermark?fileUrl=${encodeURIComponent(rawUrl)}&bookId=${book.id}&filename=${encodeURIComponent(fileName)}`
  } else {
    downloadUrl = getDriveDownloadUrl(rawUrl)
  }

  // Download file ad countdown — triggers actual download when countdown hits 0
  useEffect(() => {
    if (!downloadAdActive) return
    if (downloadAdCountdown <= 0) {
      setDownloadAdActive(false)
      if (downloadUrl) {
        // Force browser to download rather than view
        const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9 _-]/g, '_')
        const link = document.createElement('a')
        link.href = downloadUrl
        const extension = downloadUrl.includes('fl_attachment') && downloadUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? 'jpg' : 'pdf'
        link.setAttribute('download', `TUNotes_${safeTitle}.${extension}`)
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      return
    }
    const t = setTimeout(() => setDownloadAdCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [downloadAdActive, downloadAdCountdown, downloadUrl, cleanTitle])

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isPaid) {
      // Premium — direct download, no ad
      const safeTitle = cleanTitle.replace(/[^a-zA-Z0-9 _-]/g, '_')
      const link = document.createElement('a')
      link.href = downloadUrl
      const extension = downloadUrl.includes('fl_attachment') && downloadUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? 'jpg' : 'pdf'
      link.setAttribute('download', `TUNotes_${safeTitle}.${extension}`)
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      setDownloadAdCountdown(10)
      setDownloadAdActive(true)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ord = book.semester.order === 1 ? '1st' : book.semester.order === 2 ? '2nd' : book.semester.order === 3 ? '3rd' : `${book.semester.order}th`
  const facultyUpper = book.semester.facultyId.toUpperCase()
  const semLabel = `${ord} Semester`
  const semSlug = `${ord.toLowerCase()}-semester`

  // Get the correct embed URL based on viewMode
  const getActiveSourceUrl = () => {
    if (isDrive && driveId) {
      return driveEmbedUrl
    }
    if (viewMode === 'drive' && driveId) return driveEmbedUrl
    if (viewMode === 'gview') return gviewEmbedUrl
    return proxyEmbedUrl
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', background: 'var(--clr-bg)', color: '#fff', padding: '24px 4%' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* BREADCRUMB */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--clr-text-3)' }}>
          <Link href="/" style={{ color: 'var(--clr-text-3)' }}>Home</Link>
          <span>/</span>
          <Link href={`/faculty/${book.semester.facultyId}`} style={{ color: 'var(--clr-text-3)' }}>{facultyUpper}</Link>
          <span>/</span>
          <Link href={`/faculty/${book.semester.facultyId}/${semSlug}`} style={{ color: 'var(--clr-text-3)' }}>{semLabel}</Link>
          <span>/</span>
          <span style={{ color: 'var(--clr-text-1)' }}>{cleanTitle}</span>
        </div>

        {/* TOP TOOLBAR */}
        <div className="glass-card" style={{ padding: '20px 28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            
            {/* LEFT DETAILS & TITLE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📄 TU OFFICIAL RESOURCE
                </span>
                <span className="badge badge-free" style={{ fontSize: '11px' }}>
                  {facultyUpper} {semLabel}
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {cleanTitle}
              </h1>
              {book.author && (
                <span style={{ fontSize: '12px', color: 'var(--clr-text-3)' }}>
                  Author / Credit: <strong style={{ color: '#fff' }}>{book.author}</strong>
                </span>
              )}
            </div>

            {/* TOP RIGHT DOWNLOAD BUTTON */}
            <div>
              <button
                onClick={handleDownloadClick}
                className="btn btn-primary btn-lg"
                style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', cursor: 'pointer', border: 'none' }}
              >
                <span>📥</span> Download Files
              </button>
            </div>
          </div>

          {/* SHARE RESOURCE BAR */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-text-3)' }}>Share Resource:</span>
            
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${book.title} - ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ background: '#128c7e', color: '#fff', textDecoration: 'none', fontWeight: 600, border: 'none' }}
            >
              💬 WhatsApp
            </a>

            <a
              href={`viber://forward?text=${encodeURIComponent(`${book.title} - ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ background: '#7360f2', color: '#fff', textDecoration: 'none', fontWeight: 600, border: 'none' }}
            >
              📱 Viber
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{ background: '#1877f2', color: '#fff', textDecoration: 'none', fontWeight: 600, border: 'none' }}
            >
              🔵 Facebook
            </a>

            <button
              onClick={handleCopyLink}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600 }}
            >
              🔗 {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT: LEFT DOCUMENT VIEWER + RIGHT ADS SIDEBAR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'stretch' }} className="semester-layout-grid">
          
          {/* LEFT COLUMN: EMBEDDED DOCUMENT VIEWER */}
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            height: '100%',
            minHeight: '850px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>


            {/* VIEWER CONTENT AREA */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: '850px', background: '#090d16' }}>
              {isDocLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#090d16' }}>
                  <DocLoadingProgress onComplete={() => setIsDocLoading(false)} />
                </div>
              )}
              {(isImage || isDriveImage) ? (
                <div style={{ width: '100%', height: '100%', minHeight: '850px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxyEmbedUrl}
                    alt={book.title}
                    style={{ maxWidth: '100%', maxHeight: '850px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                </div>
              ) : (
                <iframe
                  src={getActiveSourceUrl()}
                  style={{ width: '100%', height: '100%', minHeight: '850px', border: 'none' }}
                  title={book.title}
                  allow="autoplay; fullscreen"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ADS SIDEBAR */}
          <div className="ads-sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AdUnit type="sidebar" slot="solution-book-sidebar-1" />
            <AdUnit type="sidebar" slot="solution-book-sidebar-2" />
          </div>

        </div>

      </div>

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
              Preparing Solution Book...
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
              <AdUnit type="medium-rectangle" slot="solution-book-modal-ad" />
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
