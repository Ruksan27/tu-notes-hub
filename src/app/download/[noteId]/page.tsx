// src/app/download/[noteId]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AdUnit from '@/components/ads/AdUnit'
import MarkdownPaperViewer from '@/components/MarkdownPaperViewer'
import ExamPaperViewer, { ExamPaperData } from '@/components/ExamPaperViewer'
import { parseLegacyMarkdownToExamData } from '@/lib/legacyParser'
import DocLoadingProgress from '@/components/DocLoadingProgress'
import { fixCloudinaryUrl } from '@/lib/utils'
import Breadcrumb, { BreadcrumbItem } from '@/components/Breadcrumb'

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

const KNOWN_TYPES = ['cheatsheet', 'past-paper', 'note', 'mcq', 'notes', 'lab-work', 'project-work', 'projects', 'books', 'question-paper', 'solution-book', 'syllabus', 'guides'] as const
type ContentType = typeof KNOWN_TYPES[number] | null

function getNoteTargetId(p: any): string {
  if (p?.noteParams && Array.isArray(p.noteParams) && p.noteParams.length > 0) {
    const paramsArr = p.noteParams as string[]
    if (paramsArr.length >= 3) {
      const subjectPart = paramsArr[0] || ''
      const itemPart = paramsArr[paramsArr.length - 1] || ''
      return extractIdFromSlug(subjectPart === itemPart ? subjectPart : `${subjectPart}-${itemPart}`)
    } else if (paramsArr.length === 2) {
      const seg1 = paramsArr[1]
      if (KNOWN_TYPES.includes(seg1 as any)) {
        return ''
      }
      return extractIdFromSlug(seg1)
    }
  }
  const raw = ((p?.noteSlug || p?.noteId) as string) || ''
  return extractIdFromSlug(raw)
}

function getContentType(p: any): ContentType {
  if (p?.noteParams && Array.isArray(p.noteParams)) {
    for (const seg of p.noteParams as string[]) {
      if (KNOWN_TYPES.includes(seg as any)) return seg as ContentType
    }
  }
  return null
}


export default function DownloadPage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [note, setNote] = useState<{ title: string; cloudinaryUrl: string; extractedText?: string | null; noteType?: string | null; subject?: any; isPastPaper?: boolean; isCheatsheet?: boolean; content?: string | null; files?: any[] } | null>(null)
  const [ready, setReady] = useState(false)
  const [driveContentType, setDriveContentType] = useState('')

  const getCleanDownloadFileName = (title: string, rawUrl = '') => {
    const cleanTitle = (title || 'Document')
      .replace(/\b(old|new)\s*syllabus\b/gi, '')
      .replace(/\b(old|new)_syllabus\b/gi, '')
      .replace(/\s*\(\s*(old|new)\s*\)/gi, '')
      .replace(/^(tunoteshub|tunotes)_/gi, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')

    let ext = 'pdf'
    if (rawUrl) {
      const match = rawUrl.split('?')[0].match(/\.(pdf|docx|doc|pptx|ppt|xlsx|xls|zip|rar|txt|png|jpg|jpeg|webp|gif)$/i)
      if (match) ext = match[1].toLowerCase()
    }

    const name = `tunoteshub_${cleanTitle || 'Document'}`
    if (new RegExp(`\\.${ext}$`, 'i').test(name)) {
      return name
    }
    return `${name}.${ext}`
  }

  const getFinalDownloadUrl = (url: string, proxyUrl: string, title: string, isNote = false) => {
    if (!url) return ''
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url
    }

    // Create a clean filename with correct extension (.pdf, .docx, .pptx, .png, etc.)
    const fileName = getCleanDownloadFileName(title, url)

    // If it's a Cloudinary image (non-PDF), route through our image signing API
    if (url.includes('res.cloudinary.com') && url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      const targetNoteId = getNoteTargetId(params)
      return `/api/download/image?fileUrl=${encodeURIComponent(url)}&noteId=${targetNoteId}&filename=${fileName}`
    }

    const targetNoteId = getNoteTargetId(params)

    // For PDFs from Cloudinary: always route through file-proxy which handles URL signing.
    // This fixes 401 errors from both /image/upload/ and /raw/upload/ Cloudinary PDFs.
    const isPdfUrl = url.toLowerCase().includes('.pdf') || url.includes('/raw/upload/') || url.includes('application/pdf')
    if (isPdfUrl && url.includes('res.cloudinary.com')) {
      return `/api/file-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`
    }

    // Non-Cloudinary PDFs: watermark API
    if (isPdfUrl && !url.includes('drive.google.com')) {
      return `/api/download/watermark?fileUrl=${encodeURIComponent(url)}&noteId=${targetNoteId}&filename=${encodeURIComponent(fileName)}`
    }

    // For all other file types (DOCX, PPTX, ZIP, TXT etc.), route via file-proxy with attachment filename
    if (proxyUrl.includes('/api/file-proxy')) {
      return `${proxyUrl}&filename=${encodeURIComponent(fileName)}`
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
  const [docNotFound, setDocNotFound] = useState(false)

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
      setIsDocLoading(true)
      const contentType = getContentType(params)
      const typeQuery = contentType ? `?type=${contentType}` : ''
      fetch(`/api/notes/${targetNoteId}${typeQuery}`)
        .then((r) => {
          if (!r.ok) throw new Error('404')
          return r.json()
        })
        .then((data) => {
          if (data && !data.error && (data.title || data.id)) {
            setNote(data)
            setDocNotFound(false)
          } else {
            setNote(null)
            setDocNotFound(true)
          }
        })
        .catch(() => {
          setNote(null)
          setDocNotFound(true)
        })
        .finally(() => {
          setIsDocLoading(false)
        })
    } else {
      setNote(null)
      setDocNotFound(true)
      setIsDocLoading(false)
    }
  }, [targetNoteId])

  // Derived: past papers have no noteType field; notes always have noteType set
  const isPastPaper = note ? !note.noteType : false

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

  let fileUrl = fixCloudinaryUrl(note?.cloudinaryUrl || '')

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
        const downloadHref = getFinalDownloadUrl(note.cloudinaryUrl, proxiedUrl, note.title, !isPastPaper)
        const fileName = getCleanDownloadFileName(note.title)

        const link = document.createElement('a')
        link.href = downloadHref
        link.target = '_blank'
        link.download = fileName
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

  // Document Viewer toolbar state for image files
  const [imageScale, setImageScale] = useState<number>(1)
  const [imageRotate, setImageRotate] = useState<number>(0)

  // Auto-switch to original tab if no extractedText, or if this is a Note (not a past paper)
  // The OCR model produces TU exam-paper JSON — only meaningful for past papers

  useEffect(() => {
    if (note) {
      // Cheatsheets with content default to 'text' tab to show cheatsheet text
      if (note.isCheatsheet && note.content) {
        setActiveTab('text')
      } else if (!note.extractedText || !isPastPaper) {
        setActiveTab('original')
      }
    }
  }, [note, isPastPaper])

  const isImage = !isDriveLink && (
    fileUrl.toLowerCase().includes('.png') ||
    fileUrl.toLowerCase().includes('.jpg') ||
    fileUrl.toLowerCase().includes('.jpeg') ||
    fileUrl.toLowerCase().includes('.webp') ||
    fileUrl.toLowerCase().includes('.gif'))

  const isPdf = !isDriveLink && (fileUrl.toLowerCase().includes('.pdf') || fileUrl.includes('/raw/upload/'))
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

  // Drive files render from our own proxy or gview. Images and PDFs can be shown directly
  // via our own proxy (bypassing CORS and auth issues), while Office docs use Docs viewer.
  const driveId = extractDriveFileId(fileUrl)
  
  // Use the proxied URL for Google Docs Viewer so it can bypass Cloudinary restrictions
  // Note: gview needs an absolute URL to work, but on localhost it will fail anyway.
  // In production, NEXT_PUBLIC_BASE_URL should be set.
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  )
  const absoluteProxiedUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${proxiedUrl}` 
    : proxiedUrl
  const googleDocsViewer = `https://docs.google.com/gview?url=${encodeURIComponent(absoluteProxiedUrl)}&embedded=true`
  // For Cloudinary PDFs: use direct URL in iframe (public Cloudinary files load fine in iframes)
  // gview fails on localhost since it can't access localhost URLs
  const previewUrl = isDriveLink
    ? driveProxyUrl
    : (isPdf || isImage)
      ? (isPdf ? `${proxiedUrl}#toolbar=0&navpanes=0` : proxiedUrl)
      : googleDocsViewer

  const fallbackPreviewUrl = isDriveLink
    ? (driveId ? `https://drive.google.com/file/d/${driveId}/preview` : drivePreviewUrl)
    : isDriveOfficeDoc
      ? `https://docs.google.com/gview?url=${encodeURIComponent(driveProxyUrl)}&embedded=true`
      : proxiedUrl

  const handleStartDownload = () => {
    if (!fileUrl && note?.isCheatsheet && note?.content) {
      const element = document.createElement('a')
      const file = new Blob([note.content], { type: 'text/plain;charset=utf-8' })
      element.href = URL.createObjectURL(file)
      element.download = `${getCleanDownloadFileName(note.title || 'cheatsheet')}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      return
    }

    if (isPaid) {
      if (fileUrl) {
        const downloadHref = getFinalDownloadUrl(fileUrl, proxiedUrl, note?.title || '', !isPastPaper)
        const fileName = getCleanDownloadFileName(note?.title || '')

        const link = document.createElement('a')
        link.href = downloadHref
        link.target = '_blank'
        link.download = fileName
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

  const getDisplayTitle = () => {
    if (!note || !note.title) return 'Document Not Found'
    if (note.isCheatsheet) {
      const facCode = note.subject?.semester?.faculty?.id?.toUpperCase() || 'TU'
      const semName = note.subject?.semester?.name
        ? (note.subject.semester.name.toLowerCase().includes('semester') ? note.subject.semester.name : `${note.subject.semester.name} Semester`)
        : (note.subject?.semester?.order ? `${note.subject.semester.order}th Semester` : '')
      const subTitle = note.subject?.title ? note.subject.title.replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim() : ''
      return [
        `TU ${facCode}`,
        semName,
        subTitle,
        `${note.title} (Cheatsheet)`
      ].filter(Boolean).join(' — ')
    }
    if (note.isPastPaper || !note.noteType) {
      return (note.title || 'Question Paper').replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim()
    }
    const facCode = note.subject?.semester?.faculty?.id?.toUpperCase() || 'BCA'
    const semName = note.subject?.semester?.name
      ? (note.subject.semester.name.toLowerCase().includes('semester') ? note.subject.semester.name : `${note.subject.semester.name} Semester`)
      : (note.subject?.semester?.order ? `${note.subject.semester.order}th Semester` : '')
    const subTitle = note.subject?.title ? note.subject.title.replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim() : ''
    const cleanNoteTitle = (note.title || 'Study Material').replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim()

    const isSubIncluded = subTitle && cleanNoteTitle.toLowerCase().includes(subTitle.toLowerCase())
    const parts = [
      `TU ${facCode}`,
      semName,
      !isSubIncluded ? subTitle : '',
      cleanNoteTitle
    ].filter(Boolean)

    return parts.join(' — ')
  }

  if (!isDocLoading && (docNotFound || !note)) {
    const slug = (params?.slug as string) || 'bca'
    const semester = (params?.semester as string) || '1st-semester'
    
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-indigo-500/10">
          📄❓
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight">
          Document Not Found
        </h1>
        <p className="text-sm text-slate-400 max-w-md mt-3 mb-8 leading-relaxed">
          The requested study material or document could not be found. It may have been updated, renamed, or moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`/faculty/${slug}/${semester}`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-all text-decoration-none"
          >
            ⬅️ Back to {slug.toUpperCase()} {semester.replace('-', ' ')}
          </a>
          <a
            href="/"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-extrabold text-sm hover:bg-white/10 hover:text-white transition-all text-decoration-none"
          >
            🏠 Go to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: '#0b0f19', position: 'relative' }}>

      {/* Breadcrumb */}
      {note && (() => {
        const facultyId = note.subject?.semester?.faculty?.id || ''
        const semOrder = note.subject?.semester?.order
        const semSlug = semOrder
          ? `${semOrder}${semOrder === 1 ? 'st' : semOrder === 2 ? 'nd' : semOrder === 3 ? 'rd' : 'th'}-semester`
          : ''
        const subjectTitle = note.subject?.title
          ? note.subject.title.replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim()
          : ''
        const facCode = facultyId.toUpperCase()
        const semName = note.subject?.semester?.name
          ? (note.subject.semester.name.toLowerCase().includes('semester')
            ? note.subject.semester.name
            : `${note.subject.semester.name} Semester`)
          : (semOrder ? `${semOrder}th Semester` : '')

        const cleanNoteTitle = note.title
          ? note.title.replace(/\s*\((Old|New)\s*Syllabus\)/gi, '').trim()
          : ''

        // Determine note type label
        let typeLabel = ''
        if (note.isCheatsheet) typeLabel = 'Cheatsheet'
        else if (note.isPastPaper || !note.noteType) typeLabel = 'Past Paper'
        else if (note.noteType === 'PDF Book') typeLabel = 'PDF Book'
        else if (note.noteType === 'Handwritten') typeLabel = 'Handwritten'
        else if (note.noteType === 'Slides/PPTX') typeLabel = 'Slides'
        else if (note.noteType === 'Short Notes') typeLabel = 'Short Notes'
        else if (note.noteType === 'Project Work') typeLabel = 'Project Work'
        else if (note.noteType === 'Lab Work') typeLabel = 'Lab Work'
        else if (note.noteType === 'Syllabus') typeLabel = 'Syllabus'
        else typeLabel = note.noteType || 'Note'

        const items: BreadcrumbItem[] = [
          { label: 'Home', href: '/' },
          ...(facCode ? [{ label: facCode, href: `/faculty/${facultyId}` }] : []),
          ...(semName && semSlug ? [{ label: semName, href: `/faculty/${facultyId}/${semSlug}` }] : []),
          ...(subjectTitle ? [{ label: subjectTitle }] : []),
          ...(typeLabel ? [{ label: typeLabel }] : []),
          { label: cleanNoteTitle || 'Document' },
        ]

        return (
          <div style={{ padding: '12px 24px 0', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            <Breadcrumb items={items} />
          </div>
        )
      })()}

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
                <span className="mobile-dl-badge" style={{ display: 'inline-flex', marginBottom: '10px', fontSize: '11px', fontWeight: 800, padding: '4px 10px', background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', letterSpacing: '0.05em' }}>TU OFFICIAL RESOURCE</span>
                <h2 className="mobile-dl-title" style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.35 }}>{getDisplayTitle()}</h2>
              </div>

              {/* Download Button (Triggers 15s Ad Lock Modal) */}
              <div className="mobile-dl-btn-wrapper" style={{ flexShrink: 0 }}>
                {!mounted ? (
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', textAlign: 'center', color: '#fff' }}>
                    ⏳ Loading...
                  </div>
                ) : ready && (fileUrl || (note?.isCheatsheet && note?.content)) ? (
                  <button onClick={handleStartDownload} className="mobile-dl-btn desktop-dl-btn active:scale-[0.98] transition-all hover:bg-blue-500"
                    style={{ cursor: 'pointer', background: '#2563eb', color: '#fff', border: '1px solid #3b82f6', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="main-text">{fileUrl ? 'Download PDF' : '📥 Download Cheatsheet Text'}</span>
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '8px',
                    background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontSize: '14px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span>WhatsApp</span>
                </a>

                {/* Instagram Share */}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '8px',
                    background: 'rgba(225,48,108,0.1)', border: '1px solid rgba(225,48,108,0.2)', color: '#E1306C', fontSize: '14px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span>Instagram</span>
                </a>

                {/* Messenger Share */}
                <a
                  href="https://www.facebook.com/dialog/send?link="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '8px',
                    background: 'rgba(0,132,255,0.1)', border: '1px solid rgba(0,132,255,0.2)', color: '#0084FF', fontSize: '14px', fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <span>Messenger</span>
                </a>

                {/* Copy Link button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl)
                    alert('Link copied to clipboard! Share it with your friends.')
                  }}
                  className="mobile-dl-share-btn"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--clr-text-2)', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ad Block Banner */}
          {!isPaid && (
            <div style={{ marginTop: '8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <p style={{ fontSize: '12px', color: '#fca5a5', margin: 0, lineHeight: 1.4 }}>
                <strong>Support TU Notes Hub:</strong> If you use an Ad Blocker, please consider whitelisting our website or upgrading to Elite AI Pass to support free student access!
              </p>
            </div>
          )}

          {/* Ad Unit (Above Document Preview) */}
          {!isPaid && (
            <div style={{ margin: '8px 0' }}>
              <AdUnit type="banner" slot="download-page-top" />
            </div>
          )}

          {/* Ad Gate / Timer View */}
          {downloadAdActive ? (
            <div style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg-surface-1)', borderRadius: '16px', border: '1px solid var(--clr-border)', padding: '40px', textTransform: 'none' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--clr-text-1)', marginBottom: '8px' }}>
                {downloadAdCountdown > 0 ? `Preparing Your Download (${downloadAdCountdown}s)` : 'Download Ready!'}
              </h3>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '14px', marginBottom: '24px', textAlign: 'center', maxWidth: '480px' }}>
                {downloadAdCountdown > 0 ? 'Please wait while we generate your secure download link. Sponsored ads support server hosting.' : 'Click below to download your file.'}
              </p>

              {downloadAdCountdown === 0 && (
                <button
                  onClick={() => {
                    setDownloadAdActive(false)
                    if (fileUrl) {
                      const downloadHref = getFinalDownloadUrl(fileUrl, proxiedUrl, note?.title || '', !isPastPaper)
                      const link = document.createElement('a')
                      link.href = downloadHref
                      link.target = '_blank'
                      link.download = getCleanDownloadFileName(note?.title || '')
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    } else if (note?.isCheatsheet && note?.content) {
                      const element = document.createElement('a')
                      const file = new Blob([note.content], { type: 'text/plain;charset=utf-8' })
                      element.href = URL.createObjectURL(file)
                      element.download = `${getCleanDownloadFileName(note.title || 'cheatsheet')}.txt`
                      document.body.appendChild(element)
                      element.click()
                      document.body.removeChild(element)
                    }
                  }}
                  className="btn btn-primary active:scale-95 transition-all"
                  style={{ padding: '14px 32px', fontSize: '15px', fontWeight: 800, background: 'var(--grad-brand)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', cursor: 'pointer' }}
                >
                  🚀 Download Now
                </button>
              )}

              {/* Sponsored Ad inside Gate */}
              <div style={{
                marginTop: '32px',
                width: '100%',
                maxWidth: '650px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--clr-border)',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: 'var(--shadow-glow)',
              }}>
                <p style={{ fontSize: '10px', color: 'var(--clr-text-3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>Sponsored Advertisement</p>
                <AdUnit type="medium-rectangle" slot="download-gate-ad" />
              </div>
            </div>
          ) : (
            <>
              {/* Tab Controls — Shown when both original file and text content exist */}
              {fileUrl && (note?.content || note?.extractedText) && (
                <div className="mobile-dl-tab-container" style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '5px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <button
                    onClick={() => setActiveTab('original')}
                    className="mobile-dl-tab-btn"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'original' ? 'var(--grad-brand)' : 'transparent',
                      color: activeTab === 'original' ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: activeTab === 'original' ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    📄 Original File
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className="mobile-dl-tab-btn"
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'text' ? 'var(--grad-brand)' : 'transparent',
                      color: activeTab === 'text' ? '#fff' : 'var(--clr-text-3)',
                      boxShadow: activeTab === 'text' ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    {note?.isCheatsheet ? '📝 Cheatsheet Text' : '✨ Smart AI Text'}
                  </button>
                </div>
              )}

              {/* Document Preview */}
              <div style={{ flex: 1, minHeight: '850px', height: '100%', borderRadius: '16px', border: '1px solid var(--clr-border)', overflow: 'hidden', background: '#121824', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {isDocLoading && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#090d16' }}>
                    <DocLoadingProgress onComplete={() => setIsDocLoading(false)} />
                  </div>
                )}

                {activeTab === 'text' && note?.isCheatsheet && note?.content ? (
                  <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '30px', background: '#0f172a', color: '#fff' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <span className="badge badge-elite" style={{ fontSize: '11px', padding: '6px 14px', width: 'fit-content' }}>✨ ELITE AI CHEATSHEET</span>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                        <h4 style={{ fontSize: '12px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700 }}>📝 Cheatsheet Content</h4>
                        <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--clr-text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {note.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : fileUrl ? (
                  activeTab === 'text' && isPastPaper && note?.extractedText ? (
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
                  ) : (isImage || isDriveImage) ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
                      {/* Document Toolbar Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                        <span>🔍 Zoom: {Math.round(imageScale * 100)}%</span>
                        <button onClick={() => setImageScale(s => Math.max(0.4, s - 0.2))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>-</button>
                        <button onClick={() => setImageScale(s => Math.min(3, s + 0.2))} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                        <button onClick={() => setImageRotate(r => (r + 90) % 360)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}>🔄 Rotate</button>
                        <button onClick={() => { setImageScale(1); setImageRotate(0) }} style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>↺ Reset</button>
                      </div>
                      {/* Viewport Area */}
                      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={isDriveImage ? previewUrl : proxiedUrl}
                          alt={note?.title || 'Document'}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                            transform: `scale(${imageScale}) rotate(${imageRotate}deg)`,
                            transition: 'transform 0.2s ease-in-out'
                          }}
                        />
                      </div>
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
                ) : note?.isCheatsheet && note?.content ? (
                  <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '30px', background: '#0f172a', color: '#fff' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <span className="badge badge-elite" style={{ fontSize: '11px', padding: '6px 14px', width: 'fit-content' }}>✨ ELITE AI CHEATSHEET</span>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                        <h4 style={{ fontSize: '12px', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700 }}>📝 Cheatsheet Content</h4>
                        <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--clr-text-1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {note.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : note?.files && note.files.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '30px', background: '#0f172a', color: '#fff' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: 700 }}>📁 Attached Files ({note.files.length})</h4>
                      {note.files.map((f: any, idx: number) => (
                        <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>📄 {f.name || `File ${idx + 1}`}</span>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
                            📥 Download / View File
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
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
